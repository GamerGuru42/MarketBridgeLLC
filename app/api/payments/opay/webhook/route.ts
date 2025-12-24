import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log('OPay Webhook Received:', JSON.stringify(payload));

        // Basic validation of payload structure based on OPay docs
        if (payload.payload && payload.payload.status === 'SUCCESSFUL') {
            const reference = payload.payload.reference;

            if (reference.startsWith('SUB-')) {
                // Update User Subscription Status
                const { error } = await supabase
                    .from('users')
                    .update({
                        subscription_status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('last_payment_ref', 'pending'); // Or use the reference if stored

                if (error) console.error('Error activating dealer via webhook:', error);
            } else {
                // Update order status in Supabase
                const { error } = await supabase
                    .from('orders')
                    .update({
                        status: 'paid',
                        updated_at: new Date().toISOString()
                    })
                    .eq('transaction_ref', reference);

                if (error) console.error('Error updating order via webhook:', error);
            }

            console.log(`Payment with ref ${reference} processed.`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('OPay Webhook Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
