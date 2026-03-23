import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agreementId } = await params;
        const body = await req.json();
        const { reason, description, userId } = body;

        if (!agreementId || !reason || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // 1. Validate agreement exists and user is a participant
        const { data: agreement, error: checkError } = await supabase
            .from('escrow_agreements')
            .select('*')
            .eq('id', agreementId)
            .single();

        if (checkError || !agreement) {
            return NextResponse.json({ error: 'Escrow agreement not found' }, { status: 404 });
        }

        if (agreement.buyer_id !== userId && agreement.seller_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 403 });
        }

        // 2. Insert into disputes table
        const { error: disputeError } = await supabase
            .from('disputes')
            .insert({
                escrow_agreement_id: agreementId,
                filed_by_id: userId,
                reason,
                description,
                status: 'open'
            });

        if (disputeError) throw disputeError;

        // 3. Update agreement status
        const { error: updateError } = await supabase
            .from('escrow_agreements')
            .update({ status: 'disputed' })
            .eq('id', agreementId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'Dispute filed successfully' });
    } catch (error: any) {
        console.error('File Escrow Dispute Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
