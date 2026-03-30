'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, CheckCircle2, Clock, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';

export default function AdminVerifySellers() {
  const supabase = createClient();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, phone_number, university, matric_number, is_temporary_seller, temporary_seller_expires_at, created_at')
      .eq('role', 'student_seller')
      .eq('email_verified', false)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) {
        console.error("Error fetching sellers mapping:", error);
    }
    
    setRows(data || []);
    setLoading(false);
  }

  async function handleApprove(sellerId: string) {
    setProcessingId(sellerId);
    try {
      const res = await fetch('/api/admin/verify-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      });
      if (res.ok) {
        toast('Seller successfully verified & permanently approved!', 'success');
        await fetchRequests();
      } else {
          toast('Failed to verify seller', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Failed to verify seller due to system logic error', 'error');
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
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="border-b border-white/5 pb-10 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#FF6200]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Operations Admin</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            Pending <span className="text-[#FF6200]">Verifications</span>
          </h1>
          <p className="text-white/40 font-medium italic max-w-xl">
            Review queued sellers who require manual verification bypassing Magic Links / OTP logic.
          </p>
        </div>

        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 bg-white/[0.02] rounded-[3rem]">
              <CheckCircle2 className="h-16 w-16 text-[#FF6200]/30 mx-auto mb-6" />
              <p className="text-white/30 font-black uppercase tracking-widest text-xs italic">
                No Pending Verifications Detected
              </p>
            </div>
          ) : (
            rows.map((r: any) => (
              <div
                key={r.id}
                className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col xl:flex-row items-start xl:items-center gap-6 hover:border-[#FF6200]/20 transition-all duration-300 relative overflow-hidden"
              >
                {r.is_temporary_seller && (
                    <div className="absolute top-0 right-0 py-1 px-4 bg-yellow-500/10 border-b border-l border-yellow-500/20 text-yellow-500 text-[9px] font-black tracking-widest uppercase rounded-bl-xl flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        48hr System Override Active
                    </div>
                )}
                <div className="h-12 w-12 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center shrink-0 mt-4 xl:mt-0">
                  <User className="h-6 w-6 text-[#FF6200]" />
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-white uppercase tracking-tighter text-xl italic">{r.display_name}</span>
                    <Badge className="bg-white/5 text-white/60 text-[8px] font-black uppercase tracking-widest border-none">
                      {r.email}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50 font-medium italic">
                    <span className="flex items-center gap-1.5 opacity-80 pb-1">
                       UNI: {r.university || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80 pb-1">
                       MATRIC: {r.matric_number || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80 pb-1">
                       PHONE: {r.phone_number || 'N/A'}
                    </span>
                    {r.is_temporary_seller && r.temporary_seller_expires_at && (
                        <span className="flex items-center gap-1.5 text-yellow-500/80 font-bold pb-1">
                          <Clock className="w-3 h-3" />
                          EXPIRES: {new Date(r.temporary_seller_expires_at).toLocaleString()}
                        </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full xl:w-auto mt-4 xl:mt-0">
                  <Button
                    onClick={() => handleApprove(r.id)}
                    disabled={processingId === r.id}
                    className="w-full xl:w-auto h-12 px-8 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-[#FF6200]/10 transition-all"
                  >
                    {processingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Manually Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
