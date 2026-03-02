'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Clock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AdminVerifySellers() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    setProcessingId(requestId);
    try {
      const res = await fetch('/api/admin/verification/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approve }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-[#FF6200] animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 animate-pulse">
            Loading verification queue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="border-b border-white/5 pb-10 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#FF6200]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">MarketBridge Central</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            Seller <span className="text-[#FF6200]">Verification</span>
          </h1>
          <p className="text-white/40 font-medium italic max-w-xl">
            Review and process pending seller account requests. Approve legitimate applications and reject invalid ones.
          </p>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 bg-white/[0.02] rounded-[3rem]">
              <CheckCircle2 className="h-16 w-16 text-[#FF6200]/30 mx-auto mb-6" />
              <p className="text-white/30 font-black uppercase tracking-widest text-xs italic">
                Queue is clear — no pending verification requests
              </p>
            </div>
          ) : (
            rows.map((r: any) => (
              <div
                key={r.id}
                className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-[#FF6200]/20 transition-all duration-300"
              >
                {/* Icon */}
                <div className="h-12 w-12 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-[#FF6200]" />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-white uppercase tracking-tighter text-lg italic">{r.email}</span>
                    <Badge className="bg-[#FF6200]/10 text-[#FF6200] text-[8px] font-black uppercase tracking-widest border-none animate-pulse">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-white/40 font-medium italic">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      ID: {r.user_id?.substring(0, 16)}...
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    onClick={() => handleApprove(r.id, true)}
                    disabled={processingId === r.id}
                    className="h-12 px-6 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-[#FF6200]/10 transition-all"
                  >
                    {processingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleApprove(r.id, false)}
                    disabled={processingId === r.id}
                    variant="outline"
                    className="h-12 px-6 border-white/10 bg-transparent text-white/60 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-[10px] font-black uppercase text-white/20 tracking-widest italic pt-8 border-t border-white/5">
          All verification actions are logged and audited — Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
