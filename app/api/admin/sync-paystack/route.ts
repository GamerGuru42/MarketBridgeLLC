import { NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Simple security: Check for an admin session or a secret query param
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Optional: Add a secret key check for dev use
        const url = new URL(req.url);
        const secret = url.searchParams.get('secret');
        const bypass = process.env.ADMIN_SYNC_SECRET && secret === process.env.ADMIN_SYNC_SECRET;

        if (!user && !bypass) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is admin
        if (user) {
            const { data: profile } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || !['admin', 'super_admin', 'ceo', 'technical_admin'].includes(profile.role)) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // 1. Fetch Plan from Database
        const { data: plans, error: plansError } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true);

        if (plansError) throw plansError;

        const results = [];

        for (const plan of plans) {
            // We'll create one Paystack Plan for the Monthly interval for now
            // Annual plans are usually handled as one-time charges with metadata in simple setups,
            // or separate plans. For brevity, let's just ensure the Monthly plan exists.

            if (!plan.paystack_plan_code && plan.price_monthly > 0) {
                console.log(`Creating Paystack plan for: ${plan.name}`);

                try {
                    const paystackPlan = await paystackClient.createPlan({
                        name: plan.name,
                        amount: plan.price_monthly * 100, // kobo
                        interval: 'monthly',
                        description: plan.description || `MarketBridge ${plan.name} Subscription`
                    });

                    if (paystackPlan.status) {
                        const planCode = paystackPlan.data.plan_code;

                        // Update Supabase with the new code
                        await supabaseAdmin
                            .from('subscription_plans')
                            .update({ paystack_plan_code: planCode })
                            .eq('id', plan.id);

                        results.push({
                            planId: plan.id,
                            status: 'created',
                            code: planCode
                        });
                    }
                } catch (e: any) {
                    results.push({ planId: plan.id, status: 'error', message: e.message });
                }
            } else {
                results.push({ planId: plan.id, status: 'exists', code: plan.paystack_plan_code });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Plan synchronization complete',
            results
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
