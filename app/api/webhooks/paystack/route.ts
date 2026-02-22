import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { tryAwardReferralBonusForUser } from '@/lib/referrals/server'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(req: NextRequest) {
    const signature = req.headers.get('x-paystack-signature') || ''
    const bodyText = await req.text()

    // Verify signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(bodyText).digest('hex')
    if (!signature || hash !== signature) {
        console.warn('Invalid Paystack webhook signature')
        return new Response('Invalid signature', { status: 401 })
    }

    let event
    try {
        event = JSON.parse(bodyText)
    } catch (e) {
        console.error('Invalid webhook payload', e)
        return new Response('Bad payload', { status: 400 })
    }

    try {
        const eventType = event.event || event.type
        const data = event.data || event.payload || {}

        if (eventType === 'charge.success' || eventType === 'transaction.success') {
            const reference = data.reference || data.trxref || data.id
            const metadata = data.metadata || {}
            const subscriptionId = metadata?.subscription_id || metadata?.subscriptionId || null

            if (subscriptionId) {
                // Mark subscription active
                const plan = metadata.plan || 'monthly'
                const periodStart = new Date().toISOString()
                const periodEnd = new Date()
                if (plan === 'yearly' || plan === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1)
                else periodEnd.setMonth(periodEnd.getMonth() + 1)

                await supabaseAdmin.from('subscriptions').update({
                    status: 'active',
                    paystack_reference: reference,
                    current_period_start: periodStart,
                    current_period_end: periodEnd.toISOString()
                }).eq('id', subscriptionId)

                // Update user subscription_status
                const { data: sub } = await supabaseAdmin.from('subscriptions').select('user_id,plan_id').eq('id', subscriptionId).single()
                if (sub?.user_id) {
                    await supabaseAdmin.from('users').update({ subscription_status: 'active', subscription_start_date: periodStart }).eq('id', sub.user_id)
                }
            }

            // Record payment in payments table if exists
            try {
                const payment = { processor: 'paystack', reference: reference, amount: data.amount / 100, metadata: data, user_id: data?.customer?.id || data?.customer || metadata?.user_id || null }
                await supabaseAdmin.from('payments').insert([payment])

                // If this payment belongs to a referred user, check referral threshold
                const paidUserId = payment.user_id
                if (paidUserId) {
                    // Try awarding referral bonus when threshold reached
                    await tryAwardReferralBonusForUser(paidUserId)
                }
            } catch (e) { /* ignore if payments table absent */ }
        }

        return new Response('OK', { status: 200 })
    } catch (e) {
        console.error('Webhook processing failed', e)
        return new Response('Error', { status: 500 })
    }
}
