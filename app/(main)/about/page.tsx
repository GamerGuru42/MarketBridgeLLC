'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Users, Eye, MessageSquare, CheckCircle, Lock, Wallet, Clock, AlertTriangle, ArrowLeft, ArrowUpRight, Zap, Target, Activity, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FF6200] selection:text-black pt-28 pb-32 overflow-hidden">
            {/* Background Grid & Ambient Glow */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF6200]/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 max-w-7xl">
                {/* Header Section */}
                <div className="space-y-8 mb-32">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-[#FF6200] border border-[#FF6200]/20 bg-[#FF6200]/5 hover:bg-[#FF6200]/10 rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-[0.2em] font-heading transition-all"
                    >
                        <ArrowLeft className="mr-2 h-3 w-3" /> Return Home
                    </Button>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="h-0.5 w-12 bg-[#FF6200]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF6200]">Built for total safety</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black uppercase tracking-tight italic font-heading leading-[0.8] whitespace-pre-line">
                                The Standard <br />
                                <span className="text-[#FF6200]">for Trust.</span>
                            </h1>
                        </div>
                        <div className="max-w-xl">
                            <p className="text-zinc-400 text-lg md:text-2xl font-medium leading-relaxed italic border-l-2 border-[#FF6200] pl-8">
                                MarketBridge is a <span className="text-white">secure payment platform</span> built to protect every transaction within Nigeria's university communities.
                            </p>
                        </div>
                    </div>
                </div>

                {/* The Manifesto / Story */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-40">
                    <div className="lg:col-span-2 glass-card p-12 md:p-20 rounded-[4rem] border-white/5 relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Logo size="xl" hideText />
                        </div>

                        <div className="relative z-10 space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-4xl font-black uppercase italic font-heading tracking-tighter text-white">
                                    Our <span className="text-[#FF6200]">Story</span>
                                </h2>
                                <div className="h-1 w-20 bg-[#FF6200]" />
                            </div>

                            <div className="space-y-8 text-zinc-400 text-lg font-medium leading-relaxed max-w-2xl">
                                <p>
                                    In many online marketplaces, it's hard to know who to trust. MarketBridge was started in Abuja with a simple rule: <span className="text-white italic font-bold">"You only pay when you get exactly what you ordered."</span>
                                </p>
                                <p>
                                    We realized that safety shouldn't be a luxury. By connecting you with verified sellers and holding your payment safely until the deal is done, we've replaced doubt with total peace of mind.
                                </p>
                                <p className="text-white italic">
                                    Welcome to a safer way to buy and sell within the university community.
                                </p>
                            </div>

                            <div className="pt-8">
                                <Button asChild size="lg" className="h-16 px-10 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF7A29] hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,98,0,0.2)] border-none">
                                    <Link href="/listings" className="flex items-center gap-3">
                                        Browse the Marketplace
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="glass-card p-10 rounded-[3rem] border-white/5 hover:border-[#FF6200]/30 transition-all duration-500 bg-white/5 group h-full flex flex-col justify-center">
                            <div className="h-20 w-20 rounded-3xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Target className="h-10 w-10 text-[#FF6200]" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-4">Focused on <br />You</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed uppercase tracking-wider font-bold">
                                We focus on verified university members and campus shops, making sure everyone is checked before they can join.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Core Pillars */}
                <div className="mb-40">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
                        <div className="space-y-4">
                            <p className="text-[10px] text-[#FF6200] font-black uppercase tracking-[0.4em] font-heading">Our Safety Promise</p>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic font-heading">How it <span className="text-[#FF6200]">Works</span></h2>
                        </div>
                        <div className="h-[1px] flex-1 bg-white/5 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Safe Payments',
                                desc: 'Your money is held safely by us. The seller only gets paid after you confirm you have received your item.',
                                icon: Shield,
                                color: 'text-[#FF6200]',
                                bg: 'bg-[#FF6200]/10'
                            },
                            {
                                title: 'Verified Sellers',
                                desc: 'Every seller undergoes a multi-layer check, including university details and ID credentials.',
                                icon: ShieldCheck,
                                color: 'text-white',
                                bg: 'bg-white/10'
                            },
                            {
                                title: 'Fair Resolution',
                                desc: 'Our dedicated support team resolves conflicts fairly, making sure everyone is treated right.',
                                icon: Eye,
                                color: 'text-[#FF6200]',
                                bg: 'bg-[#FF6200]/10'
                            }
                        ].map((item, i) => (
                            <div key={i} className="glass-card p-12 rounded-[3.5rem] border-white/5 hover:border-white/10 transition-all duration-500 group relative">
                                <div className={`h-16 w-16 rounded-2xl ${item.bg} border border-white/5 flex items-center justify-center mb-10 group-hover:rotate-6 transition-transform`}>
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-6 italic font-heading leading-tight">{item.title}</h3>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                                <div className="absolute bottom-12 right-12 opacity-5 scale-150 rotate-[-15deg]">
                                    <item.icon className="h-20 w-20 text-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dispute Framework Visual */}
                <div className="relative mb-40">
                    <div className="absolute inset-0 bg-[#FF6200]/5 blur-[100px] rounded-full" />
                    <div className="glass-card p-12 md:p-20 rounded-[4rem] border-[#FF6200]/20 relative overflow-hidden border">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20">
                                        <AlertTriangle className="h-6 w-6 text-[#FF6200]" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6200]">Security Policy</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading text-white">Problem <span className="text-[#FF6200]">Solving</span></h2>
                                <p className="text-zinc-400 text-lg font-medium leading-relaxed italic border-l border-[#FF6200]/30 pl-8">
                                    If an item isn't what it was supposed to be, the payment is automatically frozen. Our team will review the details to make sure the right person gets their money back.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                {[
                                    { label: 'Payment Status', val: 'Protected', icon: Lock },
                                    { label: 'Checks', val: 'Complete', icon: CheckCircle },
                                    { label: 'Delivery State', val: 'Tracked', icon: Clock },
                                    { label: 'Help Desk', val: '24/7', icon: MessageSquare }
                                ].map((stat, s) => (
                                    <div key={s} className="bg-black/40 border border-white/5 p-6 rounded-[2rem] text-center space-y-2">
                                        <stat.icon className="h-5 w-5 text-[#FF6200] mx-auto opacity-50" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                                        <p className="text-xs font-black uppercase tracking-tighter text-white">{stat.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Conclusion (Replacing Seller CTA) */}
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-20 bg-white/5" />
                        <Logo hideText className="opacity-20 hover:opacity-100 transition-opacity duration-1000" />
                        <div className="h-[1px] w-20 bg-white/5" />
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic font-heading text-white leading-none">
                            The Future of <br />
                            <span className="text-[#FF6200]">Campus Shopping.</span>
                        </h2>
                        <p className="text-zinc-500 text-lg font-medium italic max-w-2xl mx-auto">
                            We are building more than a marketplace. We are building a safer way for the next generation of Nigerian university members and sellers to connect.
                        </p>
                    </div>

                    <div className="pt-12 flex flex-col sm:flex-row gap-6 justify-center">
                        <Button asChild size="lg" className="h-20 px-12 bg-white text-black hover:bg-zinc-200 rounded-[2rem] font-black uppercase tracking-widest text-xs italic shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all hover:scale-105 border-none">
                            <Link href="/listings">Start Shopping</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-20 px-12 border-white/10 bg-black/40 backdrop-blur-md text-white hover:bg-white/5 rounded-[2rem] font-black uppercase tracking-widest text-xs italic transition-all hover:border-white/20">
                            <Link href="mailto:support@marketbridge.com.ng">Get Support</Link>
                        </Button>
                    </div>

                    <div className="pt-20 opacity-20">
                        <p className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">ESTABLISHED IN ABUJA 2024</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
