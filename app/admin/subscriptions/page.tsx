'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Search, Filter, Crown, Zap, Mail, Phone, Loader2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface SubscriptionRequest {
    id: string;
    user_id: string;
    plan_id: string;
    billing_cycle: string;
    status: string;
    created_at: string;
    user?: {
        display_name: string;
        email: string;
        phone_number: string;
    };
}

export default function AdminSubscriptionsPage() {
    const { user: admin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!admin || !['admin', 'ceo', 'super_admin', 'cofounder'].includes(admin.role))) {
            router.push('/');
            return;
        }
        if (admin) fetchRequests();
    }, [admin, authLoading, router]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_requests')
                .select(`
                    *,
                    user:users!user_id(display_name, email, phone_number)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Failed to fetch subscription requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, userId: string, planId: string, approve: boolean) => {
        setProcessingId(requestId);
        try {
            // 1. Update request status
            const { error: reqError } = await supabase
                .from('subscription_requests')
                .update({ status: approve ? 'approved' : 'rejected' })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. If approved, update user's plan
            if (approve) {
                const expiresAt = new Date();
                // Basic expiry logic: +1 month if monthly, +1 year if annual
                const req = requests.find(r => r.id === requestId);
                if (req?.billing_cycle === 'annual') {
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                } else {
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                }

                const { error: userError } = await supabase
                    .from('users')
                    .update({
                        subscription_plan_id: planId,
                        subscription_status: 'active',
                        subscription_start_date: new Date().toISOString(),
                        subscription_expires_at: expiresAt.toISOString(),
                        listing_limit: planId === 'pro' ? 30 : planId === 'elite' ? 999999 : 5
                    })
                    .eq('id', userId);

                if (userError) throw userError;
                toast(`Successfully upgraded user to ${planId.toUpperCase()}!`, 'success');
            } else {
                toast('Subscription request rejected.', 'info');
            }

            fetchRequests();
        } catch (err) {
            console.error('Failed to process request:', err);
            toast('Action failed. Check console for details.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-[#FF6200] animate-spin mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 animate-pulse">Scanning Plan Requests...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 text-[#FF6200]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">MarketBridge Central</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                            Subscription <span className="text-[#FF6200]">Verification</span>
                        </h1>
                        <p className="text-white/40 font-medium italic max-w-xl">
                            Command & Control panel for manual subscription upgrades and payment verification.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {requests.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-white/5 bg-white/[0.02] rounded-[3rem]">
                            <Zap className="h-16 w-16 text-white/10 mx-auto mb-6" />
                            <p className="text-white/30 font-black uppercase tracking-widest text-xs italic">Zero pending upgrade requests</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 group hover:border-[#FF6200]/20 transition-all duration-500">
                                <div className={cn(
                                    "h-16 w-16 rounded-3xl flex items-center justify-center shrink-0 border border-white/5",
                                    req.plan_id === 'elite' ? "bg-amber-500/10 text-amber-500" : "bg-[#FF6200]/10 text-[#FF6200]"
                                )}>
                                    <Crown className="h-8 w-8" />
                                </div>

                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic">{req.user?.display_name || 'Legacy Merchant'}</h3>
                                        <Badge className={cn(
                                            "px-2 py-0.5 font-black uppercase text-[8px] tracking-widest bg-white/5 text-white/60",
                                            req.status === 'pending' && "bg-[#FF6200]/10 text-[#FF6200] animate-pulse"
                                        )}>
                                            {req.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-white/40 italic">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {req.user?.email}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {req.user?.phone_number || 'No Phone Data'}</span>
                                    </div>
                                </div>

                                <div className="border-x border-white/5 px-8 hidden lg:block">
                                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Target Plan</p>
                                    <p className="text-lg font-black uppercase italic tracking-tighter">
                                        {req.plan_id} <span className="text-[10px] text-[#FF6200]/70">/{req.billing_cycle}</span>
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    {req.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => handleAction(req.id, req.user_id, req.plan_id, true)}
                                                disabled={!!processingId}
                                                className="h-14 px-8 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-[#FF6200]/10 shrink-0"
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Plan"}
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(req.id, req.user_id, req.plan_id, false)}
                                                disabled={!!processingId}
                                                variant="outline"
                                                className="h-14 px-8 border-white/10 text-white/60 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shrink-0"
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        onClick={() => router.push(`/admin/users?id=${req.user_id}`)}
                                        variant="ghost"
                                        className="h-14 w-14 p-0 text-white/30 hover:text-white rounded-2xl"
                                    >
                                        <ArrowUpRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <p className="text-center text-[10px] font-black uppercase text-white/20 tracking-widest italic pt-8 border-t border-white/5">
                    Authorized Access Only — All manual activations are audited by Central Command.
                </p>
            </div>
        </div>
    );
}