import { NextResponse } from 'next/server'
import { generateAndSendOtp } from '@/lib/verification/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { email } = body || {}
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  try {
    await generateAndSendOtp(email)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
