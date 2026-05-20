import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user making the request is an admin
    const { data: adminData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminData || !['admin', 'ceo', 'operations_admin', 'technical_admin', 'operations', 'super_admin'].includes(adminData.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    const { requestId, approve, note } = body || {}
    if (!requestId || typeof approve !== 'boolean') return NextResponse.json({ error: 'requestId and approve required' }, { status: 400 })

    // fetch request
    const { data } = await supabase.from('seller_verification_requests').select('*').eq('id', requestId).limit(1)
    const reqRow = data && data[0]
    if (!reqRow) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (approve) {
      // Update the verification request status
      await supabase
        .from('seller_verification_requests')
        .update({ status: 'approved', admin_id: user.id, admin_note: note || null, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      const { data: userRow } = await supabase.from('users').select('coins_balance').eq('id', reqRow.user_id).single()
      const currentMC = userRow?.coins_balance || 0;

      // Update user
      await supabase
        .from('users')
        .update({
          is_verified_seller: true,
          is_verified: true,
          isVerified: true,
          email_verified: true,
          coins_balance: currentMC + 10,
        })
        .eq('id', reqRow.user_id)

      await supabase
        .from('profiles')
        .update({
          role: 'student_seller'
        })
        .eq('id', reqRow.user_id)

      // Also update any matching seller_applications to approved
      await supabase
        .from('seller_applications')
        .update({ status: 'approved' })
        .eq('user_id', reqRow.user_id)

      // Audit Log
      await logAudit({
        action: 'approve_seller_verification',
        category: 'admin',
        severity: 'info',
        targetType: 'user',
        targetId: reqRow.user_id,
        details: { requestId, adminId: user.id, note },
        newValue: { is_verified_seller: true, role: 'student_seller', coins_balance: currentMC + 10 }
      }, req)

      return NextResponse.json({ success: true })
    } else {
      await supabase
        .from('seller_verification_requests')
        .update({ status: 'rejected', admin_id: user.id, admin_note: note || null, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      // Also update any matching seller_applications to rejected
      await supabase
        .from('seller_applications')
        .update({ status: 'rejected' })
        .eq('user_id', reqRow.user_id)

      // Audit Log
      await logAudit({
        action: 'reject_seller_verification',
        category: 'admin',
        severity: 'warning',
        targetType: 'user',
        targetId: reqRow.user_id,
        details: { requestId, adminId: user.id, note },
        newValue: { status: 'rejected' }
      }, req)

      return NextResponse.json({ success: true })
    }
  } catch (err: any) {
    console.error('Verification Approval API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

