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
    // Update the verification request status
    await supabase
      .from('seller_verification_requests')
      .update({ status: 'approved', admin_id: adminId || null, admin_note: note || null, updated_at: new Date().toISOString() })
      .eq('id', requestId)

    const { data: userRow } = await supabase.from('users').select('coins_balance').eq('id', reqRow.user_id).single()
    const currentMC = userRow?.coins_balance || 0;

    // Update user: set is_verified=true (what AuthContext reads), is_verified_seller=true, email_verified=true, and role=student_seller
    await supabase
      .from('users')
      .update({
        is_verified_seller: true,
        is_verified: true,       // AuthContext maps this to user.isVerified
        isVerified: true,        // Also set camelCase column if it exists in DB
        email_verified: true,    // Bypass OTP
        role: 'student_seller',  // Ensure they have seller role to access dashboard
        coins_balance: currentMC + 10, // Reward 10 Market Coins for verification
      })
      .eq('id', reqRow.user_id)

    // Also update any matching seller_applications to approved
    await supabase
      .from('seller_applications')
      .update({ status: 'approved' })
      .eq('user_id', reqRow.user_id)

    return NextResponse.json({ success: true })
  } else {
    await supabase
      .from('seller_verification_requests')
      .update({ status: 'rejected', admin_id: adminId || null, admin_note: note || null, updated_at: new Date().toISOString() })
      .eq('id', requestId)

    // Also update any matching seller_applications to rejected
    await supabase
      .from('seller_applications')
      .update({ status: 'rejected' })
      .eq('user_id', reqRow.user_id)

    return NextResponse.json({ success: true })
  }
}

