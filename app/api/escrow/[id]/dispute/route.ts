import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/escrow/[id]/dispute
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const { reason, description } = await req.json();

        // Update the order status to 'disputed'
        // We could also insert into a separate disputes table if it exists
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'disputed',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Try to insert into disputes table if it exists (optional/fallback)
        try {
            await supabase
                .from('disputes')
                .insert({
                    order_id: orderId,
                    reason,
                    description,
                    status: 'open',
                    created_at: new Date().toISOString()
                });
        } catch (e: unknown) {
            console.log('Disputes table might not exist, but order status was updated.');
        }

        return NextResponse.json({
            success: true,
            message: 'Dispute filed successfully'
        });
    } catch (error: unknown) {
        console.error('File Dispute Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
