import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agreementId } = await params;
        const body = await req.json();
        const { rating, comment, userId } = body;

        if (!agreementId || !rating || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

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

        // 2. Insert into reviews table
        const { error: reviewError } = await supabase
            .from('reviews')
            .insert({
                escrow_agreement_id: agreementId,
                reviewer_id: userId,
                subject_id: agreement.seller_id,
                rating: Number(rating),
                comment,
                created_at: new Date().toISOString()
            });

        if (reviewError) {
            // Check if it's already reviewed
            if (reviewError.code === '23505') { // unique violation
                return NextResponse.json({ error: 'You have already reviewed this transaction' }, { status: 400 });
            }
            throw reviewError;
        }

        return NextResponse.json({ success: true, message: 'Review submitted successfully' });
    } catch (error: any) {
        console.error('Submit Review Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
