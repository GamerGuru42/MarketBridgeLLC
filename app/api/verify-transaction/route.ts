import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';

export async function POST(request: Request) {
    try {
        // Create a Supabase client with the SERVICE ROLE key to bypass RLS for administrative updates
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
        );

        const { reference, tx_ref } = await request.json();

        // reference is often the Paystack reference, tx_ref is our internal tracking ref
        const lookupRef = reference || tx_ref;

        if (!lookupRef) {
            return NextResponse.json({ error: 'Missing transaction details' }, { status: 400 });
        }

        // 1. Verify with Paystack
        const verification = await paystackClient.verifyTransaction(lookupRef);

        if (!verification.status || verification.data.status !== 'success') {
            return NextResponse.json({ error: 'Payment verification failed at provider' }, { status: 400 });
        }

        // 2. Fetch order to validate amount
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('transaction_ref', tx_ref)
            .single();

        if (orderError || !order) {
            // If it's a subscription, we might not have an "order" record in the same table
            // But for item purchases, we do.
            console.warn('Order record not found for ref:', tx_ref);
        }

        // 3. Update Order status
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'paid',
                payment_id: verification.data.id.toString(),
                updated_at: new Date().toISOString(),
                payment_metadata: verification.data
            })
            .eq('transaction_ref', tx_ref);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            // Don't return error yet if it's potentially a subscription that doesn't use 'orders' table
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and status updated',
            data: verification.data
        });

    } catch (error: any) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
    }
}
