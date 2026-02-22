import { NextRequest } from 'next/server'
import { createPaystackSubaccount } from '@/lib/paystack/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { businessName, bankCode, accountNumber, userId, primaryContact, primaryContactEmail } = body

        if (!businessName || !bankCode || !accountNumber) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
        }

        // Attempt creation (wrap to provide friendly error handling)
        try {
            const result = await createPaystackSubaccount({
                business_name: businessName,
                settlement_bank: bankCode,
                account_number: accountNumber,
                primary_contact: primaryContact,
                primary_contact_email: primaryContactEmail,
                userId,
            })

            return new Response(JSON.stringify({ ok: true, data: result }), { status: 200 })
        } catch (e: any) {
            console.error('Paystack subaccount creation failed:', e)
            return new Response(JSON.stringify({ error: e?.message || 'Paystack error' }), { status: 502 })
        }

    } catch (e: any) {
        console.error('Invalid request to Paystack subaccount API', e)
        return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 })
    }
}
// consolidated single handler above
