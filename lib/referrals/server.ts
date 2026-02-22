import { supabaseAdmin } from '@/lib/supabase/admin'

const REFERRAL_BONUS = 300; // ₦300 credit
const PURCHASE_THRESHOLD = 5000; // ₦5,000

export async function recordReferral(referrerCode: string, referredUserId: string) {
    // Resolve referrer by referral_code
    const { data: refUser } = await supabaseAdmin.from('users').select('id').eq('referral_code', referrerCode).limit(1).single();
    if (!refUser?.id) return null;

    // Create referral record if not exists
    await supabaseAdmin.from('referrals').upsert({ referrer_id: refUser.id, referred_id: referredUserId }, { onConflict: '(referrer_id, referred_id)' });

    // Mark referred_by on user
    await supabaseAdmin.from('users').update({ referred_by: refUser.id }).eq('id', referredUserId);

    return refUser.id;
}

export async function tryAwardReferralBonusForUser(referredUserId: string) {
    // Sum completed purchases for user (payments table assumed)
    try {
        const { data } = await supabaseAdmin
            .from('payments')
            .select('amount')
            .eq('user_id', referredUserId)
            .gte('amount', 0);

        const total = (data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

        if (total >= PURCHASE_THRESHOLD) {
            // Get referral record
            const { data: ref } = await supabaseAdmin.from('referrals').select('id,referrer_id,bonus_paid').eq('referred_id', referredUserId).limit(1).single();
            if (ref && !ref.bonus_paid) {
                // Award bonus to referrer
                await supabaseAdmin.rpc('add_coins', { user_id: ref.referrer_id, amount_to_add: REFERRAL_BONUS, trans_type: 'referral_bonus', trans_desc: 'Referral bonus for referred user purchase' });

                // Mark referral as completed and bonus_paid
                await supabaseAdmin.from('referrals').update({ status: 'completed', purchase_threshold_met: true, bonus_paid: true }).eq('id', ref.id);

                // Also add coins transaction row exists via RPC
            }
        }
    } catch (e) {
        console.error('Referral bonus check failed', e);
    }
}
