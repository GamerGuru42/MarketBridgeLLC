'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AdminVerifySellers() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data } = await supabase
      .from('seller_verification_requests')
      .select('id,user_id,email,status,created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100);
    setRows(data || []);
    setLoading(false);
  }

  async function handleApprove(requestId: string, approve: boolean) {
    try {
      const res = await fetch('/api/admin/verification/approve', {
        method: 'POST',
        body: JSON.stringify({ requestId, approve })
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-[#FF6200]" />
    </div>
  );

  return (
    <div style={{ padding: 20, color: '#FFF', background: '#000', minHeight: '100vh' }}>
      <h2 style={{ color: '#FF6200', fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase' }}>Seller Verification Requests</h2>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {rows.length === 0 && <div style={{ color: '#777', fontStyle: 'italic' }}>No pending requests</div>}
        {rows.map((r: any) => (
          <div key={r.id} style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ color: '#FFF', fontWeight: 800 }}>{r.email}</div>
                <div style={{ color: '#999', fontSize: 12 }}>User: {r.user_id}</div>
                <div style={{ color: '#999', fontSize: 12 }}>Requested: {new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleApprove(r.id, true)}
                  style={{ background: '#FF6200', color: '#000', padding: '10px 16px', borderRadius: 10, border: 'none', fontWeight: 900, cursor: 'pointer' }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApprove(r.id, false)}
                  style={{ background: '#222', color: '#FFF', padding: '10px 16px', borderRadius: 10, border: '1px solid #333', fontWeight: 900, cursor: 'pointer' }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

