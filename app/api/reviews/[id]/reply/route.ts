import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reviewId } = await params;
        const body = await req.json();
        const { replyText } = body;

        if (!reviewId || replyText === undefined) {
            return NextResponse.json({ error: 'Missing reply text' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the review
        const { data: review, error: fetchReviewError } = await supabase
            .from('reviews')
            .select('listing_id, subject_id')
            .eq('id', reviewId)
            .single();

        if (fetchReviewError || !review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        let isAuthorized = false;

        // 1. Check if the user is the subject_id (seller/seller of the review)
        if (review.subject_id === user.id) {
            isAuthorized = true;
        }

        // 2. Check if the user is the seller of the listing
        if (!isAuthorized && review.listing_id) {
            const { data: listing } = await supabase
                .from('listings')
                .select('seller_id')
                .eq('id', review.listing_id)
                .single();

            if (listing && listing.seller_id === user.id) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden: Only the seller/seller can reply to this review' }, { status: 403 });
        }

        // Update the reply (allow empty string to clear a reply)
        const { error: updateError } = await supabase
            .from('reviews')
            .update({
                seller_reply: replyText || null,
                seller_reply_at: replyText ? new Date().toISOString() : null
            })
            .eq('id', reviewId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'Reply updated successfully' });
    } catch (error: any) {
        console.error('Submit Reply Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
