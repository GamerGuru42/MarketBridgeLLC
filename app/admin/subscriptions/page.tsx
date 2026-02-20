'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/badge';

export default function AdminSubscriptionVerification() {
    const { user, loading: authLoading } = useAuth();
    const [verifications, setVerifications] = useState<any[]>([]);
    const [plans, setPlans] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading) {
            Promise.all([
                fetchPendingVerifications(),
                fetchPlans()
            ]);
        }
    }, [authLoading]);

    const fetchPlans = async () => {
        const { data } = await supabase.from('subscription_plans').select('*');
        if (data) {
            const planMap = data.reduce((acc: any, plan: any) => {
                acc[plan.id] = plan;
                return acc;
            }, {});
            setPlans(planMap);
        }
    };

    const fetchPendingVerifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
                    *,
                    user:users(id, email, first_name, last_name, business_name, photo_url)
                `)
                .or('status.eq.pending,status.eq.active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const pendingReviews = (data || []).filter(sub =>
                sub.status === 'pending' ||
                (sub.status === 'active' && sub.metadata?.provisional === true)
            );
            setVerifications(pendingReviews);
        } catch (err) {
            console.error('Error fetching verifications:', err);
            toast('Failed to load pending verifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (subId: string, approve: boolean) => {
        setActionLoading(subId);
        try {
            if (approve) {
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        trial_end: null,
                        metadata: {
                            verified_at: new Date().toISOString(),
                            provisional: false
                        }
                    })
                    .eq('id', subId);

                if (subError) throw subError;

                const { error: payError } = await supabase
                    .from('payments')
                    .update({ status: 'successful' })
                    .eq('subscription_id', subId)
                    .neq('status', 'successful');

                if (payError) console.error('Payment update error', payError);
                toast('Subscription verified & permanent access granted', 'success');
            } else {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('id', subId);

                await supabase
                    .from('payments')
                    .update({ status: 'failed' })
                    .eq('subscription_id', subId);

                toast('Access revoked and subscription rejected', 'info');
            }
            fetchPendingVerifications();
        } catch (err: any) {
            console.error('Verification action error:', err);
            toast(err.message || 'Action failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-[#FF6200]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-[#FF6200] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="h-5 w-5 text-[#FF6200]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 font-heading">Operations Command</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            Sub <span className="text-[#FF6200]">Verification</span>
                        </h1>
                    </div>
                    <Button
                        onClick={fetchPendingVerifications}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-[#FF6200] hover:bg-[#FF6200]/10 font-mono text-xs uppercase tracking-widest border border-white/10"
                    >
                        <RefreshCw className="mr-2 h-3 w-3" /> Sync Database
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-12 w-12 animate-spin text-zinc-800" />
                    </div>
                ) : verifications.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-dashed border-white/10 p-24 rounded-3xl text-center">
                        <ShieldCheck className="h-16 w-16 text-zinc-800 mx-auto mb-6" />
                        <h3 className="text-zinc-500 font-black uppercase tracking-widest text-sm font-heading">All Clear</h3>
                        <p className="text-zinc-600 text-xs font-mono mt-2">No pending manual verifications in the queue.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {verifications.map((verification) => (
                            <div key={verification.id} className="group relative bg-zinc-950/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl overflow-hidden hover:border-[#FF6200]/30 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#FF6200] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col lg:flex-row justify-between gap-8">
                                    <div className="space-y-6 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-zinc-500">
                                                {verification.user?.first_name?.charAt(0) || verification.user?.email?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-white">
                                                        {verification.user?.business_name || 'Individual Seller'}
                                                    </h3>
                                                    <Badge variant="outline" className="bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20 font-mono text-[10px] uppercase tracking-widest">
                                                        {plans[verification.plan_id]?.name || 'Unknown Plan'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-zinc-500 font-mono">{verification.user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white/5 rounded-xl p-6 border border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 font-heading mb-1">Payer Name</p>
                                                <p className="text-sm text-zinc-300 font-mono">{verification.metadata?.sender_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 font-heading mb-1">Reference ID</p>
                                                <p className="text-sm text-zinc-300 font-mono">{verification.metadata?.manual_payment_ref || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 font-heading mb-1">Timestamp</p>
                                                <p className="text-sm text-zinc-300 font-mono">{new Date(verification.metadata?.submitted_at || verification.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 font-heading mb-1">Amount Due</p>
                                                <p className="text-xl font-black text-[#FF6200] font-heading">
                                                    {formatCurrency(plans[verification.plan_id]?.price_monthly || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 justify-center min-w-[200px] border-l border-white/10 pl-8 border-dashed lg:border-solid border-l-0 lg:border-l lg:pl-8 pt-6 lg:pt-0 lg:border-t-0 border-t">
                                        <Button
                                            onClick={() => handleVerify(verification.id, true)}
                                            disabled={!!actionLoading}
                                            className="bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-xs h-12"
                                        >
                                            {actionLoading === verification.id ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Authorize Access
                                        </Button>
                                        <Button
                                            onClick={() => handleVerify(verification.id, false)}
                                            disabled={!!actionLoading}
                                            variant="ghost"
                                            className="text-white hover:bg-white/5 font-mono uppercase tracking-widest text-xs h-12 border border-white/10"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Deny Request
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}