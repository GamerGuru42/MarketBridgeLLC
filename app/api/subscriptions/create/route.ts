import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
const SUB_MONTHLY = Number(process.env.PUBLIC_SUB_PRICE || '1000')
const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || '5.3')

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, plan } = body

        if (!userId || !plan) return new Response(JSON.stringify({ error: 'Missing userId or plan' }), { status: 400 })

        const amount = plan === 'yearly' ? SUB_MONTHLY * 10 : SUB_MONTHLY
        const amountKobo = Math.round(amount * 100)

        // Create subscription record (pending)
        const { data: subData, error: subErr } = await supabaseAdmin
            .from('subscriptions')
            .insert([{ user_id: userId, plan_id: plan === 'yearly' ? 'annual' : 'monthly', status: 'pending' }])
            .select('*')
            .limit(1)

        if (subErr) {
            console.error('Failed to create subscription record', subErr)
            return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 })
        }

        const subscription = subData?.[0]

        // Initialize Paystack transaction
        if (!PAYSTACK_SECRET) {
            return new Response(JSON.stringify({ error: 'Payment processor not configured' }), { status: 500 })
        }

        const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: body.email || 'no-reply@marketbridge.com.ng',
                amount: amountKobo,
                metadata: { subscription_id: subscription.id, plan: plan },
                callback_url: process.env.NEXT_PUBLIC_PAYSTACK_CALLBACK_URL || undefined
            })
        })

        const initJson = await initRes.json()
        if (!initRes.ok) {
            console.error('Paystack init failed', initJson)
            return new Response(JSON.stringify({ error: initJson.message || 'Payment init failed' }), { status: 502 })
        }

        // Persist paystack reference in subscription
        try {
            await supabaseAdmin.from('subscriptions').update({ paystack_reference: initJson.data.reference }).eq('id', subscription.id)
        } catch (e) { console.warn('Failed to persist paystack reference', e) }

        return new Response(JSON.stringify({ data: initJson.data }), { status: 200 })
    } catch (e: any) {
        console.error('Subscription create error', e)
        return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), { status: 500 })
    }
}
