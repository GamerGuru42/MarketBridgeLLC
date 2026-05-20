import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const FLAGGED_KEYWORDS = [
    'scam', 'fraud', 'fake', 'stolen', 'illegal', 'drug', 'weapon',
];

const PROFANITY_LIST = [
    'fuck', 'shit', 'bitch', 'bastard', 'idiot', 'stupid',
];

const analyzeReview = (text: string, rating: number) => {
    const flags: string[] = [];
    if (!text) return flags;
    
    const lowerText = text.toLowerCase();
    
    // Profanity
    if (PROFANITY_LIST.some(word => lowerText.includes(word))) flags.push('profanity');
    
    // All caps (>80% uppercase letters)
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 5 && (letters.replace(/[^A-Z]/g, '').length / letters.length) > 0.8) {
        flags.push('all_caps');
    }
    
    // Low effort (has text but < 10 chars)
    if (text.trim().length > 0 && text.trim().length < 10) flags.push('low_effort');
    
    // Drive-by negative (1 star, no meaningful text)
    if (rating === 1 && text.trim().length < 20) flags.push('drive_by_negative');
    
    // Suspicious keywords
    if (FLAGGED_KEYWORDS.some(word => lowerText.includes(word))) flags.push('suspicious_keyword');
    
    return flags;
};

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agreementId } = await params;
        const body = await req.json();
        const { rating, comment, userId, photoUrls } = body;

        if (!agreementId || !rating || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Validate auth session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Validate agreement exists and user is the buyer
        const { data: agreement, error: checkError } = await supabase
            .from('escrow_agreements')
            .select('*')
            .eq('id', agreementId)
            .single();

        if (checkError || !agreement) {
            return NextResponse.json({ error: 'Escrow agreement not found' }, { status: 404 });
        }

        if (agreement.buyer_id !== userId) {
            return NextResponse.json({ error: 'Only the buyer can leave a review' }, { status: 403 });
        }

        if (agreement.status !== 'completed' && agreement.status !== 'released') {
            return NextResponse.json({ error: 'Transaction must be completed first' }, { status: 400 });
        }

        // Fetch listing_id associated with the conversation
        const { data: conversation } = await supabase
            .from('conversations')
            .select('listing_id')
            .eq('id', agreement.conversation_id)
            .single();
        const listingId = conversation?.listing_id || null;
        
        // Prevent sellers from reviewing their own listings
        if (listingId) {
            const { data: listing } = await supabase.from('listings').select('seller_id').eq('id', listingId).single();
            if (listing && listing.seller_id === user.id) {
                return NextResponse.json({ error: "Can't review own listing" }, { status: 403 });
            }
        }

        // Check Review Bombing (>3 reviews to same seller within 24h)
        const { count } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('reviewer_id', userId)
            .eq('subject_id', agreement.seller_id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            
        const isReviewBombing = (count || 0) > 3;

        // Auto-flagging check
        const textFlags = analyzeReview(comment || '', Number(rating));
        if (isReviewBombing) textFlags.push('review_bombing');
        
        const finalStatus = textFlags.length > 0 ? 'flagged' : 'pending';

        // 2. Insert into reviews table
        const { error: reviewError } = await supabase
            .from('reviews')
            .insert({
                escrow_agreement_id: agreementId,
                reviewer_id: userId,
                subject_id: agreement.seller_id,
                listing_id: listingId,
                rating: Number(rating),
                comment,
                photo_urls: photoUrls || [],
                status: finalStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (reviewError) {
            // Check if it's already reviewed (unique violation)
            if (reviewError.code === '23505') {
                return NextResponse.json({ error: 'You have already reviewed this transaction/listing' }, { status: 400 });
            }
            throw reviewError;
        }

        return NextResponse.json({ success: true, message: 'Review submitted for moderation successfully' });
    } catch (error: any) {
        console.error('Submit Review Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
