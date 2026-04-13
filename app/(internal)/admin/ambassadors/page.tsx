'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, CheckCircle2, Clock, User, Award, Crown, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

export default function AdminAmbassadors() {
  const supabase = createClient();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    // Fetch applications with user details
    const { data, error } = await supabase
      .from('ambassador_applications')
      .select(`
        *,
        user:users (
            display_name,
            email,
            photo_url
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
        console.error("Error fetching applications:", error);
        toast('Failed to fetch applications', 'error');
    }
    
    setApplications(data || []);
    setLoading(false);
  }

  async function handleAction(app: any, action: 'approve' | 'decline') {
    if (action === 'decline' && !confirm("Are you sure you want to decline this ambassador?")) return;
    
    setProcessingId(app.id);
    try {
      const res = await fetch('/api/admin/approve-ambassador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            appId: app.id, 
            userId: app.user_id, 
            action 
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast(result.message || `Ambassador ${action}d successfully!`, 'success');
        await fetchApplications();
      } else {
        toast(result.error || `Failed to ${action} ambassador`, 'error');
      }
    } catch (err) {
      console.error(err);
      toast('System error during ambassador operations', 'error');
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
            Loading ambassador queue...
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
            <Crown className="h-5 w-5 text-[#FF6200]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Ambassador HQ</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            Campus <span className="text-[#FF6200]">Leads</span>
          </h1>
          <p className="text-white/40 font-medium italic max-w-xl">
            Review and approve MarketBridge Brand Ambassadors. Approval grants 44 days of Pro status, 500 MarketCoins, and an exclusive profile badge.
          </p>
        </div>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 bg-white/[0.02] rounded-[3rem]">
              <Award className="h-16 w-16 text-[#FF6200]/30 mx-auto mb-6" />
              <p className="text-white/30 font-black uppercase tracking-widest text-xs italic">
                No Ambassador Applications Detected
              </p>
            </div>
          ) : (
            applications.map((app: any) => (
              <div
                key={app.id}
                className={cn(
                    "group relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] border border-white/5 transition-all p-6 md:p-8",
                    app.status === 'pending' ? 'hover:border-[#FF6200]/30' : 'opacity-60'
                )}
              >
                {/* Visual Accent */}
                {app.status === 'approved' && <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full -z-10" />}
                {app.status === 'pending' && <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6200]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                  <div className="space-y-6 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20 text-[#FF6200] shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex flex-wrap items-center gap-3">
                          <span className="truncate max-w-[200px] md:max-w-xs">{app.user?.display_name || 'Anonymous candidate'}</span>
                          {app.status === 'approved' ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] uppercase tracking-widest font-black shrink-0">Approved Ambassador</Badge>
                          ) : app.status === 'declined' ? (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] uppercase tracking-widest font-black shrink-0">Declined</Badge>
                          ) : (
                            <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20 text-[9px] uppercase tracking-widest font-black shrink-0">Pending Review</Badge>
                          )}
                        </h3>
                        <p className="text-sm font-medium text-white/50 truncate">{app.user?.email}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-6 p-4 rounded-3xl bg-black/50 border border-white/5">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Target Campus</span>
                                <p className="text-sm font-bold text-[#FF6200] italic">{app.campus}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Application Date</span>
                                <p className="text-sm font-bold text-white/80 flex items-center gap-2">
                                <Clock className="h-3 w-3 text-[#FF6200]" />
                                {new Date(app.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-white/[0.01] border border-white/5 rounded-[2rem] space-y-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Motivation Transmission</span>
                             <p className="text-sm text-white/70 italic leading-relaxed">"{app.motivation}"</p>
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-[220px]">
                    {app.status === 'pending' ? (
                        <>
                            <Button
                                onClick={() => handleAction(app, 'approve')}
                                disabled={processingId === app.id}
                                className="h-14 rounded-2xl bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest text-[10px] italic transition-all group-hover:shadow-[0_0_20px_rgba(255,98,0,0.3)] w-full flex items-center justify-center gap-2"
                            >
                                {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Approve Lead</>}
                            </Button>
                            <Button
                                onClick={() => handleAction(app, 'decline')}
                                disabled={processingId === app.id}
                                variant="outline"
                                className="h-14 rounded-2xl border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 font-black uppercase tracking-widest text-[10px] italic transition-all w-full flex items-center justify-center gap-2"
                            >
                                {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Decline</>}
                            </Button>
                        </>
                    ) : app.status === 'approved' ? (
                        <div className="h-14 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center justify-center gap-2 text-green-500 text-[9px] font-black uppercase tracking-widest italic">
                            <CheckCircle className="h-4 w-4" /> Fully Deployed
                        </div>
                    ) : (
                        <div className="h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 text-white/20 text-[9px] font-black uppercase tracking-widest italic">
                            <XCircle className="h-4 w-4" /> Rejected
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center py-6 text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">
          End of Transmission // Ambassador Ops
        </div>
      </div>
    </div>
  );
}
