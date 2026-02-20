'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, Loader2, AlertCircle, Zap, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { usePaystackPayment } from 'react-paystack';
import { PAYSTACK_PUBLIC_KEY_CLIENT } from '@/lib/payment/paystack-constants';

export default function SubscriptionCheckoutContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const { toast } = useToast();
    const planId = searchParams.get('plan');
    const billingCycle = searchParams.get('billing') as 'monthly' | 'annual' || 'monthly';
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [plan, setPlan] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const amount = plan ? (billingCycle === 'annual' ? plan.price_annual : plan.price_monthly) : 0;

    // Paystack Hook
    const paystackConfig = {
        reference: `SUB-${Date.now()}-${user?.id.slice(0, 5)}`,
        email: user?.email || '',
        amount: amount * 100, // kobo
        publicKey: PAYSTACK_PUBLIC_KEY_CLIENT,
        metadata: {
            plan_id: planId,
            billing_cycle: billingCycle,
            user_id: user?.id,
            custom_fields: []
        } as any
    };

    const onPaystackSuccess = async (response: any) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/subscriptions/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference: response.reference,
                    planId,
                    billingCycle
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Activation failed');

            router.push('/checkout/pending?status=success&ref=' + response.reference);
        } catch (err: any) {
            setError(err.message || 'Failed to verify automated payment. Please contact support.');
        } finally {
            setSubmitting(false);
        }
    };

    const onPaystackCancel = () => {
        setSubmitting(false);
    };

    const initializePaystack = usePaystackPayment(paystackConfig);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?redirect=/checkout/subscription?plan=${planId}&billing=${billingCycle}`);
            return;
        }

        // Restriction: Only sellers can buy plans
        if (user && user.role === 'student_buyer') {
            toast('Access Restricted: These plans are for Sellers only. Please update your profile to sell.', 'error');
            router.push('/pricing');
            return;
        }

        if (planId) {
            fetchPlanDetails();
        } else {
            router.push('/pricing');
        }
    }, [user, authLoading, planId]);

    const fetchPlanDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (error) throw error;
            setPlan(data);
        } catch (err) {
            console.error('Error fetching plan:', err);
            setError('Plan not found or unavailable.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[#FF6200] animate-spin" />
            </div>
        );
    }

    if (!user || !plan) return null;

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-24 relative z-10 max-w-2xl">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic font-heading mb-4">
                        Secure <span className="text-[#00FF85]">Activation</span>
                    </h1>
                    <p className="text-zinc-400 max-w-lg mx-auto italic">
                        Confirm your <strong>{plan.name}</strong> subscription via our secure payment gateway.
                    </p>
                </div>
                <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF85]/50 to-transparent"></div>
                    <div className="flex justify-between items-start mb-10 pb-10 border-b border-white/5">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{plan.name} Plan</h3>
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{billingCycle} Billing Cycle</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-[#00FF85]">{formatCurrency(amount)}</div>
                        </div>
                    </div>
                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-500 mb-8 rounded-2xl">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-black uppercase tracking-widest text-xs">Security Alert</AlertTitle>
                            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-6">
                        <Button
                            onClick={() => {
                                // @ts-ignore
                                initializePaystack(onPaystackSuccess, onPaystackCancel);
                            }}
                            disabled={submitting}
                            className="w-full h-20 bg-[#00FF85] hover:bg-[#00CC6A] text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,255,133,0.2)] group"
                        >
                            {submitting ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="h-6 w-6 fill-current group-hover:animate-pulse" />
                                    Launch Gateway
                                </>
                            )}
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <ShieldCheck className="h-5 w-5 text-[#00FF85]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paystack Secured</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <Zap className="h-5 w-5 text-[#FF6200]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Instant Activation</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 text-center font-bold uppercase tracking-widest mt-8">
                        By proceeding, you agree to the MarketBridge subscription protocols.
                    </p>
                </div>
                <div className="mt-12 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft className="mr-2 h-3 w-3" /> Abort Session
                    </Button>
                </div>
            </div>
        </div>
    );
}