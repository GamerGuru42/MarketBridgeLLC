import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { requestId, approve, adminId, note } = body || {}
  if (!requestId || typeof approve !== 'boolean') return NextResponse.json({ error: 'requestId and approve required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  // fetch request
  const { data } = await supabase.from('seller_verification_requests').select('*').eq('id', requestId).limit(1)
  const reqRow = data && data[0]
  if (!reqRow) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (approve) {
    // set user as verified seller
    await supabase.from('users').update({ is_verified_seller: true }).eq('id', reqRow.user_id)
    await supabase.from('seller_verification_requests').update({ status: 'approved', admin_id: adminId || null, admin_note: note || null, updated_at: new Date().toISOString() }).eq('id', requestId)
    return NextResponse.json({ success: true })
  } else {
    await supabase.from('seller_verification_requests').update({ status: 'rejected', admin_id: adminId || null, admin_note: note || null, updated_at: new Date().toISOString() }).eq('id', requestId)
    return NextResponse.json({ success: true })
  }
}
