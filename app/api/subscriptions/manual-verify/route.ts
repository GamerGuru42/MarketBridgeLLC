// MarketBridge Manual Bank Transfer Verification API
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            planId,
            billingCycle,
            amount,
            senderName,
            transactionRef,
            paymentDate,
            bankDetails
        } = body;

        if (!planId || !amount || !senderName) {
            return NextResponse.json({ message: 'Missing required payment details' }, { status: 400 });
        }

        // 1. Fetch Plan Details to Validate Amount
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 });
        }

        const expectedAmount = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly;

        // Since this is manual, we can enforce exact match or just flag it
        if (Number(amount) < Number(expectedAmount)) {
            return NextResponse.json({ message: 'Submitted amount mismatch. Please verify pricing.' }, { status: 400 });
        }

        const reference = transactionRef || `MB-MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const periodEnd = new Date();
        if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // 2. Create/Update Subscription Record (Status: ACTIVE - PROVISIONAL)
        // We grant "active" status immediately so they can work while you verify.
        // We add a "provisional" flag to metadata to track this.

        // Check for existing FIRST
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .single();

        let subscriptionId;

        const subData = {
            plan_id: planId,
            status: 'active', // <--- INSTANT ACCESS
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            // Clear trial data
            trial_end: null,
            metadata: {
                payment_status: 'provisional_pending_verification', // Track that money isn't confirmed yet
                provisional: true, // Flag for Admin Dashboard
                manual_payment_ref: reference,
                sender_name: senderName,
                submitted_at: new Date().toISOString()
            }
        };

        if (existingSub) {
            const { data: updatedSub, error: updateError } = await supabase
                .from('subscriptions')
                .update(subData)
                .eq('id', existingSub.id)
                .select()
                .single();

            if (updateError) throw updateError;
            subscriptionId = updatedSub.id;
        } else {
            const { data: newSub, error: createError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    ...subData
                })
                .select()
                .single();

            if (createError) throw createError;
            subscriptionId = newSub.id;
        }

        // 3. Record Payment (Status: PENDING)
        // Payment itself stays pending until you see the money.
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                subscription_id: subscriptionId,
                amount: amount,
                currency: 'NGN',
                status: 'pending',
                processor: 'manual',
                processor_reference: reference,
                payment_method: 'bank_transfer',
                metadata: {
                    sender_name: senderName,
                    payment_date: paymentDate,
                    bank_details: bankDetails,
                    plan_name: plan.name,
                    billing_cycle: billingCycle,
                    provisional_access: true
                }
            });

        if (paymentError) console.error('Error recording payment:', paymentError);

        // 4. Update User Profile Status to ACTIVE
        await supabase
            .from('users')
            .update({
                subscription_status: 'active', // They are live!
                subscription_plan_id: planId
            })
            .eq('id', user.id);

        // TODO: Send email to Admin about new pending payment

        return NextResponse.json({
            success: true,
            reference,
            message: 'Provisional access granted. Please wait for final verification.'
        });

    } catch (error: any) {
        console.error('Manual verification error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
