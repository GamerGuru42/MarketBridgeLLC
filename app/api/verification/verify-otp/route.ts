import { NextResponse } from 'next/server'
import { verifyOtpAndCreateRequest } from '../../../../../../lib/verification/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { email, code, userId } = body || {}
  if (!email || !code || !userId) return NextResponse.json({ error: 'email, code, userId required' }, { status: 400 })

  try {
    const res = await verifyOtpAndCreateRequest(email, code, userId)
    if ((res as any).error) return NextResponse.json({ error: (res as any).error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
