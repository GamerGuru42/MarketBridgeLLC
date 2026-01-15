import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('verif-hash');
        const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

        // Verify webhook signature if secret hash is configured
        if (secretHash && signature !== secretHash) {
            return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
        }

        const payload = await req.json();
        console.log('Flutterwave Webhook Received:', JSON.stringify(payload));

        if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
            const reference = payload.data.tx_ref;

            if (reference.startsWith('SUB-')) {
                // Update User Subscription Status
                const { error } = await supabase
                    .from('users')
                    .update({
                        subscription_status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('last_payment_ref', 'pending');

                if (error) console.error('Error activating dealer via Flutterwave webhook:', error);
            } else {
                // Update order status in Supabase
                const { error } = await supabase
                    .from('orders')
                    .update({
                        status: 'paid',
                        updated_at: new Date().toISOString()
                    })
                    .eq('transaction_ref', reference);

                if (error) console.error('Error updating order via Flutterwave webhook:', error);
            }

            console.log(`Order with ref ${reference} confirmed via Flutterwave.`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Flutterwave Webhook Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
