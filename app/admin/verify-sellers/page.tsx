import React from 'react'
import { createServerSupabaseClient } from '../../../../lib/supabase/server'

export default async function AdminVerifySellers() {
  const supabase = createServerSupabaseClient({})
  const { data } = await supabase.from('seller_verification_requests').select('id,user_id,email,status,created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(100)
  const rows = data || []

  return (
    <div style={{ padding: 20, color: '#FFF', background: '#000', minHeight: '100vh' }}>
      <h2 style={{ color: '#FF6200' }}>Seller Verification Requests</h2>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {rows.length === 0 && <div style={{ color: '#777' }}>No pending requests</div>}
        {rows.map((r: any) => (
          <div key={r.id} style={{ background: '#111', padding: 12, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#FFF', fontWeight: 800 }}>{r.email}</div>
                <div style={{ color: '#999', fontSize: 12 }}>User: {r.user_id}</div>
                <div style={{ color: '#999', fontSize: 12 }}>Requested: {new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => window.fetch('/api/admin/verification/approve', { method: 'POST', body: JSON.stringify({ requestId: r.id, approve: true }) }).then(() => location.reload())} style={{ background: '#FF6200', color: '#000', padding: '8px 10px', borderRadius: 8, border: 'none' }}>Approve</button>
                <button onClick={() => window.fetch('/api/admin/verification/approve', { method: 'POST', body: JSON.stringify({ requestId: r.id, approve: false }) }).then(() => location.reload())} style={{ background: '#222', color: '#FFF', padding: '8px 10px', borderRadius: 8, border: '1px solid #333' }}>Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
