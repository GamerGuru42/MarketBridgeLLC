'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, Shield, Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PLANS = [
    {
        name: "Starter",
        desc: "Individual specialized trading",
        price: "Free",
        period: "/month",
        fee: "5% transaction fee",
        features: [
            "Up to 5 active listings",
            "Basic analytics terminal",
            "Standard verification node",
            "Basic support channel"
        ],
        icon: Rocket,
        buttonText: "Join Network",
        highlight: false
    },
    {
        name: "Professional",
        desc: "Strategic dealer expansion",
        price: "₦5,000",
        period: "/month",
        fee: "2.5% transaction fee",
        features: [
            "Up to 50 active listings",
            "Advanced analytics stream",
            "Priority verification node",
            "Verified Dealer Badge",
            "Dedicated support node"
        ],
        icon: Zap,
        buttonText: "Start Protocol",
        highlight: true,
        tag: "MOST REDUNDANT"
    },
    {
        name: "Enterprise",
        desc: "Fleet-scale operations",
        price: "₦20,000",
        period: "/month",
        fee: "1% transaction fee",
        features: [
            "Unlimited listing capacity",
            "Custom intelligence reports",
            "API deployment access",
            "Dedicated account module",
            "White-label verification"
        ],
        icon: Shield,
        buttonText: "Contact Sales",
        highlight: false
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FFB800] selection:text-black pt-32 pb-24">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 max-w-7xl space-y-20">
                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Financial Protocol v1.0</span>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic font-heading">
                            Plan <span className="text-[#FFB800]">Optimization</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic lowercase max-w-2xl mx-auto">
                            Scale your marketplace operations with high-fidelity asset management tiers.
                            No hidden cycles. Total transparency.
                        </p>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan, i) => (
                        <div key={plan.name} className={cn(
                            "glass-card rounded-[3rem] p-10 flex flex-col relative group transition-all duration-500 hover:translate-y-[-10px]",
                            plan.highlight ? "border-[#FFB800]/20 bg-[#FFB800]/5 shadow-[0_0_50px_rgba(255,184,0,0.05)]" : "border-white/5"
                        )}>
                            {plan.tag && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFB800] text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full font-heading italic shadow-xl shadow-[#FFB800]/20">
                                    {plan.tag}
                                </div>
                            )}

                            <div className="space-y-8 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "h-16 w-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500",
                                        plan.highlight ? "bg-[#FFB800] text-black border-[#FFB800]" : "bg-white/5 text-white border-white/10"
                                    )}>
                                        <plan.icon className="h-8 w-8" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black italic font-heading tracking-tighter">{plan.price}</p>
                                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest font-heading">{plan.period}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">{plan.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-heading">{plan.desc}</p>
                                </div>

                                <div className="pt-8 space-y-4">
                                    <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.2em] font-heading mb-6">{plan.fee}</p>
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3 text-zinc-400">
                                            <Check className={cn("h-4 w-4 shrink-0", plan.highlight ? "text-[#FFB800]" : "text-zinc-600")} />
                                            <span className="text-xs font-medium lowercase italic">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <CardFooter className="pt-12 px-0">
                                <Button asChild className={cn(
                                    "w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] font-heading transition-all italic",
                                    plan.highlight
                                        ? "bg-[#FFB800] text-black hover:bg-[#FFD700] shadow-xl shadow-[#FFB800]/10"
                                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-[#FFB800]/30"
                                )}>
                                    <Link href="/signup">{plan.buttonText}</Link>
                                </Button>
                            </CardFooter>
                        </div>
                    ))}
                </div>

                {/* Footer Insight */}
                <div className="text-center pt-12 space-y-8">
                    <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] font-heading max-w-lg mx-auto leading-relaxed">
                        Security Notice: All transactions are processed through encrypted channels.
                        Taxes and local agency fees may apply depending on jurisdiction.
                    </p>
                    <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-[#FFB800] transition-colors text-[10px] font-black uppercase tracking-widest font-heading italic">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to Core
                    </Link>
                </div>
            </div>
        </div>
    );
}
