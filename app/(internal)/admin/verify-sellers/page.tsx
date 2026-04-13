'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, CheckCircle2, Clock, User, AlertTriangle, UserX } from 'lucide-react';
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
      .select('id, email, display_name, phone_number, is_verified, email_verified, is_temporary_seller, temporary_seller_expires_at, created_at')
      .in('role', ['student_seller', 'seller'])
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

  async function handleRevoke(sellerId: string) {
    if (!confirm("Are you sure you want to revoke this seller's privileges? This will instantly block them from uploading listings.")) return;
    
    setProcessingId(sellerId);
    try {
      const res = await fetch('/api/admin/revoke-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      });
      if (res.ok) {
        toast('Seller privileges revoked. They are now completely blocked.', 'success');
        await fetchRequests();
      } else {
          toast('Failed to revoke privileges', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Failed to execute God Mode revoke', 'error');
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
            Seller <span className="text-[#FF6200]">Verification</span>
          </h1>
          <p className="text-white/40 font-medium italic max-w-xl">
            Operations review overview. Verify pending sellers, approve manual submissions, or revoke access for non-compliant merchant accounts.
          </p>
        </div>

        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 bg-white/[0.02] rounded-[3rem]">
              <CheckCircle2 className="h-16 w-16 text-[#FF6200]/30 mx-auto mb-6" />
              <p className="text-white/30 font-black uppercase tracking-widest text-xs italic">
                No Sellers Detected on Platform
              </p>
            </div>
          ) : (
            rows.map((r: any) => {
              const fullyVerified = r.is_verified || r.email_verified;

              return (
              <div
                key={r.id}
                className="group relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-[#FF6200]/30 transition-all p-6 md:p-8"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6200]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-6 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20 text-[#FF6200] shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex flex-wrap items-center gap-3">
                          <span className="truncate max-w-[200px] md:max-w-xs">{r.display_name || 'Anonymous Applicant'}</span>
                          {fullyVerified ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] uppercase tracking-widest font-black shrink-0">Active/Verified</Badge>
                          ) : (
                            <Badge className="bg-white/10 text-white border-white/20 text-[9px] uppercase tracking-widest font-black shrink-0">Pending Approval</Badge>
                          )}
                        </h3>
                        <p className="text-sm font-medium text-white/50 truncate max-w-[250px]">{r.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 p-4 rounded-3xl bg-black/50 border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Contact No.</span>
                        <p className="text-sm font-bold text-white/80">{r.phone_number || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Signup Date</span>
                        <p className="text-sm font-bold text-white/80 flex items-center gap-2">
                          <Clock className="h-3 w-3 text-[#FF6200]" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {r.is_temporary_seller && (
                         <div className="space-y-1 pl-4 border-l border-orange-500/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6200]">Temporary Access</span>
                            <p className="text-sm font-bold text-[#FF6200] flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" />
                                Expires {new Date(r.temporary_seller_expires_at).toLocaleDateString()}
                            </p>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-[220px]">
                    {!fullyVerified && (
                        <Button
                          onClick={() => handleApprove(r.id)}
                          disabled={processingId === r.id}
                          className="h-14 rounded-2xl bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest text-[10px] italic transition-all group-hover:shadow-[0_0_20px_rgba(255,98,0,0.3)] w-full"
                        >
                          {processingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve & Verify'}
                        </Button>
                    )}
                    
                    {fullyVerified && (
                        <Button
                          onClick={() => handleRevoke(r.id)}
                          disabled={processingId === r.id}
                          className="h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-black uppercase tracking-widest text-[10px] italic transition-all w-full flex items-center justify-center gap-2"
                        >
                          {processingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserX className="h-4 w-4" /> Revoke Access</>}
                        </Button>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>

        <div className="text-center py-6 text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">
          End of List // Marketbridge Ops System
        </div>
      </div>
    </div>
  );
}
