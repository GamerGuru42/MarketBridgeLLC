import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paystackClient } from '@/lib/payment/paystack';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { reference, planId, billingCycle } = body;

        if (!reference || !planId) {
            return NextResponse.json({ message: 'Missing reference or plan ID' }, { status: 400 });
        }

        // 1. Verify Transaction with Paystack
        const verification = await paystackClient.verifyTransaction(reference);

        if (!verification.status) {
            return NextResponse.json({ message: 'Payment verification failed' }, { status: 400 });
        }

        const amountPaid = verification.data.amount / 100; // Convert kobo to NGN
        const currency = verification.data.currency;

        // 2. Fetch Plan Details to Validate Amount
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 });
        }

        const expectedAmount = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly;

        // Allow small margin for currency conversion differences if any, but strictly check amount
        if (amountPaid < expectedAmount) {
            return NextResponse.json({ message: 'Payment amount mismatch. Please contact support.' }, { status: 400 });
        }

        // 3. Create Subscription Record
        const periodEnd = new Date();
        if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Check for existing subscription to update or create new
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .single();

        let subscriptionId;

        if (existingSub) {
            // Update existing
            const { data: updatedSub, error: updateError } = await supabase
                .from('subscriptions')
                .update({
                    plan_id: planId,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    cancel_at_period_end: false,
                    trial_end: null, // End trial immediately on payment
                    metadata: {
                        last_payment_ref: reference,
                        billing_cycle: billingCycle
                    }
                })
                .eq('id', existingSub.id)
                .select()
                .single();

            if (updateError) throw updateError;
            subscriptionId = updatedSub.id;
        } else {
            // Create new (should be rare given migration, but safegaurd)
            const { data: newSub, error: createError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: planId,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    trial_end: null,
                    metadata: {
                        last_payment_ref: reference,
                        billing_cycle: billingCycle
                    }
                })
                .select()
                .single();

            if (createError) throw createError;
            subscriptionId = newSub.id;
        }

        // 4. Record Payment
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                subscription_id: subscriptionId,
                amount: amountPaid,
                currency: currency,
                status: 'successful',
                processor: 'paystack',
                processor_reference: reference,
                processor_response: verification.data,
                payment_method: verification.data.channel, // 'card', 'bank', etc.
                metadata: {
                    plan_name: plan.name,
                    billing_cycle: billingCycle
                }
            });

        if (paymentError) console.error('Error recording payment:', paymentError);

        // 5. Update User Profile Status
        await supabase
            .from('users')
            .update({
                subscription_status: 'active',
                subscription_plan_id: planId
            })
            .eq('id', user.id);

        return NextResponse.json({
            success: true,
            subscriptionId,
            message: 'Subscription activated successfully'
        });

    } catch (error: any) {
        console.error('Subscription confirmation error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
