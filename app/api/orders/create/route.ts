import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, items, totalAmount, coinsRedeemed = 0, proofUrl, paymentRef } = body;

        if (!userId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
        }

        // Initialize Supabase Admin client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
        );

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                buyer_id: userId,
                amount: totalAmount,
                status: 'pending_verification', // New status for manual review
                payment_proof_url: proofUrl,
                payment_reference: paymentRef,
                payment_method: 'manual_transfer',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select() // Returning the created order
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
        }

        const orderItemsData = items.map((item: any) => ({
            order_id: order.id,
            listing_id: item.listingId,
            quantity: item.quantity,
            price_at_purchase: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsData);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            return NextResponse.json({ error: 'Failed to add items to order' }, { status: 500 });
        }

        // Deduct Coins if they were redeemed
        if (coinsRedeemed > 0) {
            const { error: coinsError } = await supabase
                .rpc('subtract_coins', {
                    user_id: userId,
                    amount_to_subtract: coinsRedeemed,
                    trans_type: 'redeem_discount',
                    trans_desc: `MarketCoins redeemed on order ${order.id}`
                });

            if (coinsError) {
                console.error('Error deducting MarketCoins:', coinsError);
                // We've already created the order, so just log it to avoid blocking checkout, 
                // but realistically we should run this inside a transaction or catch it natively.
            }
        }

        return NextResponse.json({ success: true, orderId: order.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
