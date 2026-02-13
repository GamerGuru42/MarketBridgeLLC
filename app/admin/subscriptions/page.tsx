'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function AdminSubscriptionVerification() {
    const { user, loading: authLoading } = useAuth();
    const [verifications, setVerifications] = useState<any[]>([]);
    const [plans, setPlans] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();
    const { toast } = useToast();

    // TODO: Add proper Admin Role check here
    // if (!user || user.role !== 'admin') return <AccessDenied />

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
            // Fetch subscriptions that are pending manual verification
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
                    *,
                    user:users(id, email, first_name, last_name, business_name)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVerifications(data || []);
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
                // 1. Activate Subscription
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        trial_end: null // Clear trial if any
                    })
                    .eq('id', subId);

                if (subError) throw subError;

                // 2. Update Payment Record (find the pending one linked to this sub)
                // We'll update all pending payments for this sub to successful for simplicity
                const { error: payError } = await supabase
                    .from('payments')
                    .update({ status: 'successful' })
                    .eq('subscription_id', subId)
                    .eq('status', 'pending');

                if (payError) console.error('Payment update error', payError);

                // 3. Update User Status
                // Need to fetch user ID from the sub first
                const sub = verifications.find(v => v.id === subId);
                if (sub) {
                    await supabase
                        .from('users')
                        .update({ subscription_status: 'active' })
                        .eq('id', sub.user_id);
                }

                toast('Subscription activated successfully', 'success');
            } else {
                // Reject logic
                await supabase
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('id', subId);

                // Update Payment Record to failed
                await supabase
                    .from('payments')
                    .update({ status: 'failed' })
                    .eq('subscription_id', subId)
                    .eq('status', 'pending');

                toast('Subscription request rejected', 'info');
            }

            // Refresh list
            fetchPendingVerifications();
        } catch (err: any) {
            console.error('Verification action error:', err);
            toast(err.message || 'Action failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Pending Verifications</h1>
                    <Button onClick={fetchPendingVerifications} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
                    </div>
                ) : verifications.length === 0 ? (
                    <div className="bg-zinc-900 border border-white/10 p-12 rounded-xl text-center text-zinc-500">
                        No pending manual payments found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {verifications.map((verification) => (
                            <div key={verification.id} className="bg-zinc-900 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-white">
                                            {verification.user?.business_name || verification.user?.email}
                                        </span>
                                        <span className="text-xs bg-[#FFB800]/20 text-[#FFB800] px-2 py-0.5 rounded-full">
                                            {plans[verification.plan_id]?.name || verification.plan_id}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-zinc-400">
                                        <div>Sender Name:</div>
                                        <div className="text-white font-mono">{verification.metadata?.sender_name || 'N/A'}</div>

                                        <div>Transaction Ref:</div>
                                        <div className="text-white font-mono">{verification.metadata?.manual_payment_ref || 'N/A'}</div>

                                        <div>Submitted At:</div>
                                        <div>{new Date(verification.metadata?.submitted_at || verification.created_at).toLocaleString()}</div>

                                        <div>Amount Due:</div>
                                        <div className="text-[#00FF85] font-bold">
                                            {/* Calculate amount based on billing cycle in metadata if possible, else fallback */}
                                            {formatCurrency(plans[verification.plan_id]?.price_monthly || 0)}
                                            {/* Note: Ideally we store the actual amount in the subscription or payment record to display here accurately */}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 justify-center min-w-[150px]">
                                    <Button
                                        onClick={() => handleVerify(verification.id, true)}
                                        disabled={!!actionLoading}
                                        className="bg-[#00FF85] hover:bg-[#00CC6A] text-black font-bold"
                                    >
                                        {actionLoading === verification.id ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleVerify(verification.id, false)}
                                        disabled={!!actionLoading}
                                        variant="destructive"
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
