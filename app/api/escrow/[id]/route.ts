import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/escrow/[id]
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = params.id;

        // In this system, "escrow" is represented by an Order with status 'paid' or 'held'
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order/Escrow not found' }, { status: 404 });
        }

        // Map order status to what the frontend expects for escrow
        // If it's 'paid', we tell the frontend it's 'held'
        const escrowStatus = order.status === 'paid' ? 'held' : order.status;

        return NextResponse.json({
            success: true,
            escrow: {
                id: order.id,
                orderId: order.id,
                amount: order.amount,
                status: escrowStatus,
                buyerId: order.buyer_id,
                sellerId: order.seller_id,
                createdAt: order.created_at
            }
        });
    } catch (error: any) {
        console.error('Get Escrow Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
