'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, MapPin, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function HomePage() {
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleJoinWaitlist = (e: React.FormEvent) => {
        e.preventDefault();
        setWaitlistStatus('loading');
        // Simulate API call for waitlist
        setTimeout(() => {
            setWaitlistStatus('success');
            setWaitlistEmail('');
        }, 800);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-[#FF6200] selection:text-white">
            <Header />
            <main className="flex-1 w-full flex flex-col items-center pt-16">

                {/* ─── Hero Section ─── */}
                <section className="w-full max-w-6xl mx-auto px-6 md:px-10 lg:px-16 pt-24 pb-32 flex flex-col md:flex-row items-center gap-12 lg:gap-24 relative">
                    <div className="flex-1 flex flex-col space-y-8 z-10 relative">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[#00A355] animate-pulse" />
                            <span className="text-[12px] font-bold tracking-widest text-[#00A355] uppercase">Live in Abuja</span>
                        </div>
                        <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.9] tracking-tighter text-zinc-950">
                            Abuja's Trusted<br />
                            Campus<br />
                            <span className="text-[#FF6200]">Marketplace.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-600 font-medium max-w-lg leading-relaxed">
                            Buy and sell fast within your uni. Order fresh food, textbooks, and services from verified students. Zero middlemen. Zero delays.
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link
                                href="/signup?role=student_seller"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03] shadow-[0_8px_30px_rgba(255,98,0,0.3)] group"
                            >
                                Start Selling <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#buyer-waitlist"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03]"
                            >
                                Join Buyer Waitlist
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 pt-6 opacity-70">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" /> Verified Users
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" /> Secure Payments
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative h-[450px] lg:h-[550px] rounded-[3rem] bg-zinc-100 border border-zinc-200 shadow-2xl overflow-hidden flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-500">
                        {/* Abstract delightful layout or image placeholder reflecting Chowdeck style */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6200]/10 to-transparent" />
                        <div className="relative z-10 space-y-6">
                            {/* Food Card */}
                            <div className="bg-white p-4 rounded-3xl shadow-lg border border-zinc-100 flex items-center gap-4 w-[280px] hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-16 h-16 bg-[#FF6200]/10 rounded-2xl flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8 text-[#FF6200]" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Delivering</p>
                                    <h4 className="font-bold text-zinc-900 leading-none">Jollof Rice & Chicken</h4>
                                    <p className="text-[#FF6200] font-black mt-1">₦3,500</p>
                                </div>
                            </div>
                            {/* Service Card */}
                            <div className="bg-white p-4 rounded-3xl shadow-lg border border-zinc-100 flex items-center gap-4 w-[280px] ml-12 hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                    <Store className="w-8 h-8 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Service</p>
                                    <h4 className="font-bold text-zinc-900 leading-none">MacBook Repair</h4>
                                    <p className="text-blue-500 font-black mt-1">Nile Uni Campus</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Why MarketBridge ─── */}
                <section className="w-full bg-white border-y border-zinc-100 py-24">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900 mb-16">
                            How it works on <span className="text-[#FF6200]">campus</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Students Only", icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Every user passes strict ID verification. Ensure you're trading with real, safe peers." },
                                { title: "Fast Delivery", icon: Zap, color: "text-[#FF6200]", bg: "bg-[#FF6200]/10", desc: "Sellers are in your hostels or faculty. From ordering to eating in minutes, not hours." },
                                { title: "Grow Your Hustle", icon: Store, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Easily set up a storefront, list products (food, gadgets, fashion), and start taking orders today." }
                            ].map((feat, i) => (
                                <div key={i} className="flex flex-col items-center p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-zinc-200 transition-colors">
                                    <div className={`w-20 h-20 rounded-3xl ${feat.bg} flex items-center justify-center mb-6`}>
                                        <feat.icon className={`w-10 h-10 ${feat.color}`} />
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900 mb-3">{feat.title}</h3>
                                    <p className="text-zinc-600 font-medium leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Buyer Waitlist ─── */}
                <section id="buyer-waitlist" className="w-full max-w-4xl mx-auto px-6 py-32 text-center">
                    <div className="bg-[#1A1A1A] p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6200]/20 rounded-full blur-[80px]" />
                        <div className="relative z-10 flex flex-col items-center">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">
                                Buyers, <span className="text-[#FF6200]">Get Ready.</span>
                            </h2>
                            <p className="text-white/60 font-medium text-lg max-w-xl mx-auto mb-10">
                                We are currently onboarding sellers. The full buying experience opens soon. Drop your email to get early access and free MarketCoins when we launch.
                            </p>

                            <form onSubmit={handleJoinWaitlist} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your university email..."
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    className="flex-1 h-16 px-6 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FF6200] transition-colors font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={waitlistStatus === 'loading' || waitlistStatus === 'success'}
                                    className="h-16 px-8 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.03] flex items-center justify-center shrink-0"
                                >
                                    {waitlistStatus === 'loading' ? 'Joining...' : waitlistStatus === 'success' ? 'Joined!' : 'Join Waitlist'}
                                </button>
                            </form>
                            {waitlistStatus === 'success' && (
                                <p className="text-emerald-400 font-bold mt-4 text-sm bg-emerald-400/10 px-4 py-2 rounded-xl">
                                    You're on the list! Check your email soon.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
