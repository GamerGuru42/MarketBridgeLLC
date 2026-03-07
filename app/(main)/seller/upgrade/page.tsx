'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, Crown, Sparkles, ArrowLeft, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PLANS = [
    {
        id: 'campus_starter',
        name: 'Starter',
        price: 0,
        period: 'Free forever',
        icon: Star,
        color: 'zinc',
        iconBg: 'bg-zinc-100 dark:bg-zinc-900',
        iconColor: 'text-zinc-500',
        borderActive: 'border-zinc-400',
        description: 'Perfect for students just getting started.',
        features: [
            'Up to 5 active listings',
            'Basic seller profile',
            'Buyer messaging',
            'Sales dashboard',
            'Manual approval verification',
        ],
        cta: 'Current Plan',
        highlight: false,
    },
    {
        id: 'campus_pro',
        name: 'Pro Seller',
        price: 2500,
        period: 'per month',
        icon: Zap,
        color: 'orange',
        iconBg: 'bg-[#FF6200]/10',
        iconColor: 'text-[#FF6200]',
        borderActive: 'border-[#FF6200]',
        description: 'For serious sellers growing their campus business.',
        features: [
            'Up to 30 active listings',
            'Priority listing in search',
            'Verified badge on profile',
            'Analytics & insights',
            'Offer / negotiation tools',
            'WhatsApp order notifications',
        ],
        cta: 'Upgrade to Pro',
        highlight: true,
    },
    {
        id: 'elite',
        name: 'Elite Store',
        price: 6000,
        period: 'per month',
        icon: Crown,
        color: 'amber',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        borderActive: 'border-amber-500',
        description: 'Full campus store with maximum exposure and features.',
        features: [
            'Unlimited active listings',
            'Homepage featured slot (1×/month)',
            'Store banner & custom URL',
            'Sponsored listing credits (3×/month)',
            'Dedicated account manager',
            'Priority support & faster approval',
            'All Pro features included',
        ],
        cta: 'Go Elite',
        highlight: false,
    },
];

export default function SellerUpgradePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [billingAnnual, setBillingAnnual] = useState(false);

    const handleSelectPlan = async (planId: string) => {
        if (planId === 'campus_starter') return; // Already free

        if (!user) {
            router.push('/login?next=/seller/upgrade');
            return;
        }

        setLoadingPlan(planId);

        try {
            // Log the upgrade request — admin manually processes payment (manual-first model)
            const { error } = await supabase.from('subscription_requests').insert({
                user_id: user.id,
                plan_id: planId,
                billing_cycle: billingAnnual ? 'annual' : 'monthly',
                status: 'pending',
            });

            if (error) throw error;

            toast(
                `Your ${planId === 'pro' ? 'Pro Seller' : 'Elite Store'} request has been sent! Our team will contact you within 24 hours to complete payment.`,
                'success'
            );
            router.push('/seller/dashboard');
        } catch (err: any) {
            console.error(err);
            // Gracefully degrade — even if table doesn't exist yet, guide user to WhatsApp
            toast(
                'Request noted! WhatsApp us on +234 800 000 0000 to activate your plan instantly.',
                'info'
            );
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white pt-24 pb-32 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-5 dark:opacity-10 pointer-events-none z-0" />
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="container px-6 mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <div className="mb-16">
                    <Link
                        href="/seller/dashboard"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="h-0.5 w-10 bg-[#FF6200]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6200]">MarketBridge Plans</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-4">
                        Grow Your <span className="text-[#FF6200]">Store</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-xl">
                        Unlock more listings, visibility, and tools as you scale your campus business.
                    </p>

                    {/* Annual toggle */}
                    <div className="mt-8 flex items-center gap-4">
                        <span className={cn('text-sm font-bold transition-colors', !billingAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400')}>Monthly</span>
                        <button
                            onClick={() => setBillingAnnual(!billingAnnual)}
                            aria-label={billingAnnual ? 'Switch to monthly billing' : 'Switch to annual billing'}
                            aria-pressed={billingAnnual ? 'true' : 'false'}
                            className={cn(
                                'relative h-6 w-12 rounded-full border-2 transition-all',
                                billingAnnual
                                    ? 'bg-[#FF6200] border-[#FF6200]'
                                    : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
                            )}
                        >
                            <span className={cn(
                                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                                billingAnnual ? 'left-6' : 'left-0.5'
                            )} />
                        </button>
                        <span className={cn('text-sm font-bold transition-colors', billingAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400')}>
                            Annual
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FF6200]/10 text-[#FF6200]">Save 20%</span>
                        </span>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const price = billingAnnual && plan.price > 0
                            ? Math.round(plan.price * 12 * 0.8)
                            : plan.price;
                        const isCurrentPlan = user?.subscriptionPlan === plan.id || (plan.id === 'campus_starter' && !user?.subscriptionPlan);

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    'relative rounded-[2.5rem] border-2 p-8 flex flex-col transition-all duration-300',
                                    plan.highlight
                                        ? 'bg-zinc-950 border-[#FF6200] shadow-[0_20px_60px_rgba(255,98,0,0.15)]'
                                        : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                )}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#FF6200] text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        Most Popular
                                    </div>
                                )}

                                <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center mb-6', plan.iconBg)}>
                                    <Icon className={cn('h-6 w-6', plan.iconColor)} />
                                </div>

                                <h3 className={cn('text-xl font-black uppercase tracking-tight mb-1', plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white')}>
                                    {plan.name}
                                </h3>
                                <p className={cn('text-xs font-medium mb-6', plan.highlight ? 'text-white/50' : 'text-zinc-500')}>
                                    {plan.description}
                                </p>

                                <div className="mb-8">
                                    {plan.price === 0 ? (
                                        <span className={cn('text-4xl font-black tracking-tighter', plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white')}>Free</span>
                                    ) : (
                                        <>
                                            <span className={cn('text-4xl font-black tracking-tighter', plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white')}>
                                                ₦{price.toLocaleString()}
                                            </span>
                                            <span className={cn('text-xs font-bold ml-1', plan.highlight ? 'text-white/50' : 'text-zinc-500')}>
                                                /{billingAnnual ? 'year' : 'month'}
                                            </span>
                                        </>
                                    )}
                                </div>

                                <ul className="space-y-3 flex-1 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <CheckCircle2 className={cn('h-4 w-4 shrink-0 mt-0.5', plan.highlight ? 'text-[#FF6200]' : 'text-[#FF6200]')} />
                                            <span className={cn('text-xs font-medium', plan.highlight ? 'text-white/80' : 'text-zinc-600 dark:text-zinc-400')}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={isCurrentPlan || loadingPlan === plan.id}
                                    className={cn(
                                        'w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs transition-all',
                                        plan.id === 'starter'
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default border-0'
                                            : plan.highlight
                                                ? 'bg-[#FF6200] hover:bg-[#FF7A29] text-black border-0 hover:scale-105 shadow-[0_8px_24px_rgba(255,98,0,0.3)]'
                                                : 'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 border-0'
                                    )}
                                >
                                    {loadingPlan === plan.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isCurrentPlan ? (
                                        '✓ Current Plan'
                                    ) : (
                                        plan.cta
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Note */}
                <p className="mt-12 text-center text-xs text-zinc-400 font-medium">
                    All plans require manual activation by the MarketBridge team within 24 hours.
                    Payments accepted via bank transfer.{' '}
                    <Link href="/about" className="text-[#FF6200] hover:underline">Learn more</Link>
                </p>
            </div>
        </div>
    );
}
