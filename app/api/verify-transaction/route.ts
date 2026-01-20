import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
// Note: Validate that this key exists in your .env

// Create a Supabase client with the SERVICE ROLE key to bypass RLS for administrative updates
// We use this because the user might not have permission to 'approve' their own order status directly
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { transaction_id, tx_ref } = await request.json();

        if (!transaction_id || !tx_ref) {
            return NextResponse.json({ error: 'Missing transaction details' }, { status: 400 });
        }

        // 1. Verify with Flutterwave
        const flwResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
            }
        });

        const flwData = await flwResponse.json();

        if (flwData.status !== 'success' || flwData.data.status !== 'successful') {
            return NextResponse.json({ error: 'Payment verification failed at provider' }, { status: 400 });
        }

        // 2. Initial Checks (Currency, matches expected)
        // In a real app, you would fetch the expected order amount from your DB here using tx_ref
        // const { data: order } = await supabaseAdmin.from('orders').select('*').eq('transaction_ref', tx_ref).single();
        // if (order.amount > flwData.data.amount) throw new Error('Amount mismatch');

        // 3. Update Database Securely
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'paid',
                payment_id: transaction_id.toString(), // Store the provider ID
                updated_at: new Date().toISOString(),
                payment_metadata: flwData.data // Store full receipt
            })
            .eq('transaction_ref', tx_ref);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Payment verified and order updated' });

    } catch (error: any) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
    }
}
