import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/escrow/[id]/release
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        // 1. Fetch order details to calculate MarketCoins
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('amount, buyer_id, seller_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            throw new Error(orderError?.message || 'Order not found');
        }

        const { amount, buyer_id, seller_id } = order;

        // 2. Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // 3. MarketCoins Logic (Buyer: 1 per ₦100, Seller: 1 per ₦200)
        const buyerCoinsEarned = Math.floor(amount / 100);
        const sellerCoinsEarned = Math.floor(amount / 200);

        // A simple function to add coins to a user's existing balance
        const addCoinsToUser = async (userId: string, earned: number) => {
            if (!userId || earned <= 0) return;
            // Get current balance
            const { data: userData } = await supabase
                .from('users')
                .select('coins_balance')
                .eq('id', userId)
                .single();

            const currentBalance = userData?.coins_balance || 0;

            await supabase
                .from('users')
                .update({ coins_balance: currentBalance + earned })
                .eq('id', userId);
        };

        // Increment coins concurrently
        await Promise.all([
            addCoinsToUser(buyer_id, buyerCoinsEarned),
            addCoinsToUser(seller_id, sellerCoinsEarned)
        ]);

        return NextResponse.json({
            success: true,
            message: 'Funds released successfully and MarketCoins awarded'
        });
    } catch (error: unknown) {
        console.error('Release Escrow Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
