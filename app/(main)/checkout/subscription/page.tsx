'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, ShieldCheck, University, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function SubscriptionCheckoutPage() {
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

    // Payment Proof Form State
    const [senderName, setSenderName] = useState('');
    const [transactionRef, setTransactionRef] = useState(''); // Optional user input
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const BANK_DETAILS = {
        bankName: 'Moniepoint MFB',
        accountNumber: '9022858358',
        accountName: 'MarketBridge LLC' // Assuming business name, update if different
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?redirect=/checkout/subscription?plan=${planId}&billing=${billingCycle}`);
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast('Account details copied to clipboard.', 'success');
    };

    const handleManualPaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // 1. Submit payment proof to API
            const res = await fetch('/api/subscriptions/manual-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    billingCycle,
                    amount: billingCycle === 'annual' ? plan.price_annual : plan.price_monthly,
                    senderName,
                    transactionRef, // Optional user-provided ref
                    paymentDate,
                    bankDetails: BANK_DETAILS
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Submission failed');

            // 2. Redirect to success/pending page
            router.push('/checkout/pending?ref=' + data.reference);

        } catch (err: any) {
            console.error('Payment submission error:', err);
            setError(err.message || 'Failed to submit payment proof. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[#FF6600] animate-spin" />
            </div>
        );
    }

    if (!user || !plan) return null;

    const amount = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly;

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 py-12 md:py-24 relative z-10 max-w-5xl">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic font-heading mb-4">
                        Confirm <span className="text-[#FF6600]">Transfer</span>
                    </h1>
                    <p className="text-zinc-400 max-w-lg mx-auto">
                        Please make a bank transfer to activate your <strong>{plan.name}</strong> subscription.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Left Side: Bank Details & Instructions */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 md:p-8 rounded-3xl border border-[#FF6600]/20 bg-[#FF6600]/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <University className="h-24 w-24 text-[#FF6600]" />
                            </div>

                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#FF6600]">
                                <University className="h-5 w-5" />
                                Bank Account Details
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-1">
                                    <div className="text-xs text-zinc-400 uppercase tracking-widest">Bank Name</div>
                                    <div className="text-xl font-bold">{BANK_DETAILS.bankName}</div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs text-zinc-400 uppercase tracking-widest">Account Number</div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-widest font-mono">
                                            {BANK_DETAILS.accountNumber}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(BANK_DETAILS.accountNumber)}
                                            className="h-10 w-10 text-[#FF6600] hover:bg-[#FF6600]/20 rounded-full"
                                        >
                                            <Copy className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs text-zinc-400 uppercase tracking-widest">Account Name</div>
                                    <div className="text-lg font-medium text-zinc-300">{BANK_DETAILS.accountName}</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-white/10 bg-zinc-900/50">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-[#00FF85] h-5 w-5" />
                                Important Instructions
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex gap-2">
                                    <span className="text-[#FF6600] font-bold">1.</span>
                                    Transfer exactly <span className="text-white font-bold">{formatCurrency(amount)}</span>.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#FF6600] font-bold">2.</span>
                                    Use your registered name as the sender if possible.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#FF6600] font-bold">3.</span>
                                    After transfer, fill the form on the right to notify us.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#FF6600] font-bold">4.</span>
                                    Activation takes 15-30 mins after we confirm receipt.
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Side: Payment Verification Form */}
                    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-zinc-900">
                        <div className="flex justify-between items-start mb-8 pb-8 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-bold text-white">{plan.name} Plan</h3>
                                <p className="text-sm text-zinc-500 capitalize">{billingCycle} Billing</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-[#FF6600]">{formatCurrency(amount)}</div>
                            </div>
                        </div>

                        <form onSubmit={handleManualPaymentSubmit} className="space-y-6">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="senderName">Sender Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="senderName"
                                    placeholder="e.g. John Doe (Name on Bank Acct)"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    required
                                    className="bg-zinc-800/50 border-white/10 focus:border-[#FF6600]"
                                />
                                <p className="text-[10px] text-zinc-500">The name that will appear on our bank statement.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transactionRef">Transaction Reference (Optional)</Label>
                                <Input
                                    id="transactionRef"
                                    placeholder="Enter bank transaction ref/ID"
                                    value={transactionRef}
                                    onChange={(e) => setTransactionRef(e.target.value)}
                                    className="bg-zinc-800/50 border-white/10 focus:border-[#FF6600]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date of Transfer</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                    className="bg-zinc-800/50 border-white/10 focus:border-[#FF6600]"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting || !senderName}
                                className="w-full h-14 bg-[#00FF85] hover:bg-[#00CC6A] text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,133,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        I Have Made Payment <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
