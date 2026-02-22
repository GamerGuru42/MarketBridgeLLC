import { NextRequest } from 'next/server'
import { recordReferral } from '@/lib/referrals/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { refCode, referredUserId } = body
        if (!refCode || !referredUserId) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })

        const referrerId = await recordReferral(refCode, referredUserId)
        if (!referrerId) return new Response(JSON.stringify({ ok: false, message: 'Referrer not found' }), { status: 404 })

        return new Response(JSON.stringify({ ok: true, referrerId }), { status: 200 })
    } catch (e: any) {
        console.error('Record referral failed', e)
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 })
    }
}
