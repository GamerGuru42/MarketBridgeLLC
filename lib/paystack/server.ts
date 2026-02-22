import { supabaseAdmin } from '@/lib/supabase/admin'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET) {
    console.warn('PAYSTACK_SECRET_KEY is not set — Paystack subaccount creation will fail until configured.')
}

export async function createPaystackSubaccount(payload: {
    business_name: string
    settlement_bank: string
    account_number: string
    primary_contact?: string
    primary_contact_email?: string
    userId?: string
}) {
    if (!PAYSTACK_SECRET) throw new Error('Paystack secret key not configured')

    const body = {
        business_name: payload.business_name,
        settlement_bank: payload.settlement_bank,
        account_number: payload.account_number,
        primary_contact: payload.primary_contact || undefined,
        primary_contact_email: payload.primary_contact_email || undefined,
    }

    const res = await fetch('https://api.paystack.co/subaccount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
        const message = data?.message || 'Paystack API error'
        throw new Error(message)
    }

    // Save returned subaccount code to user's profile if userId provided
    try {
        const subcode = data?.data?.subaccount_code || data?.data?.subaccount_id || null
        if (payload.userId && subcode) {
            await supabaseAdmin
                .from('users')
                .update({ paystack_subaccount_code: subcode })
                .eq('id', payload.userId)
        }
    } catch (e) {
        console.error('Failed to persist paystack subaccount code:', e)
    }

    return data
}
