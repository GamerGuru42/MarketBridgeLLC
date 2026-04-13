import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the user making the request is an admin
        const { data: adminData } = await supabase
            .from('users')
            .select('role')
            .eq('id', adminUser.id)
            .single();

        if (!adminData || !['admin', 'ceo', 'operations', 'operations_admin'].includes(adminData.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
        }

        const body = await req.json();
        const { appId, userId, action } = body; // action is 'approve' or 'decline'

        if (!appId || !userId || !action) {
            return NextResponse.json({ error: 'appId, userId, and action are required' }, { status: 400 });
        }

        if (action === 'decline') {
            const { error } = await supabaseAdmin
                .from('ambassador_applications')
                .update({ status: 'declined' })
                .eq('id', appId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Application declined.' });
        }

        if (action === 'approve') {
            // Atomic transaction (best effort via multiple calls if transaction helper isn't available)
            // 1. Get application details for campus
            const { data: appData, error: appFetchError } = await supabaseAdmin
                .from('ambassador_applications')
                .select('campus')
                .eq('id', appId)
                .single();

            if (appFetchError) throw appFetchError;

            const now = new Date();
            const expiresAt = new Date();
            expiresAt.setDate(now.getDate() + 44);

            // 2. Update Application
            const { error: appError } = await supabaseAdmin
                .from('ambassador_applications')
                .update({ status: 'approved' })
                .eq('id', appId);
            if (appError) throw appError;

            // 3. Create Ambassador record
            const { error: ambError } = await supabaseAdmin
                .from('ambassadors')
                .insert({
                    user_id: userId,
                    campus: appData.campus,
                    pro_trial_ends_at: expiresAt.toISOString(),
                    badge_active: true
                });
            if (ambError) throw ambError;

            // 4. Update User Profile (Role, Coins, Plan)
            // Fetch current coins to increment
            const { data: userData, error: userFetchError } = await supabaseAdmin
                .from('users')
                .select('coins_balance')
                .eq('id', userId)
                .single();
            
            if (userFetchError) throw userFetchError;

            const newBalance = (userData.coins_balance || 0) + 500;

            const { error: userError } = await supabaseAdmin
                .from('users')
                .update({
                    is_ambassador: true,
                    coins_balance: newBalance,
                    subscription_plan_id: 'pro',
                    subscription_status: 'active',
                    subscription_expires_at: expiresAt.toISOString()
                })
                .eq('id', userId);
            if (userError) throw userError;

            // 5. Create Subscription Record
            const { error: subError } = await supabaseAdmin
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_id: 'pro',
                    status: 'active',
                    current_period_start: now.toISOString(),
                    current_period_end: expiresAt.toISOString(),
                    metadata: { type: 'ambassador_reward', app_id: appId }
                });
            if (subError) throw subError;

            return NextResponse.json({ success: true, message: 'Ambassador approved and rewards granted.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err: any) {
        console.error('Ambassador Approval API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
