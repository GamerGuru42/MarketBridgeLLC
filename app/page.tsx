'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, MapPin, Zap, CheckCircle2, QrCode } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-[#FF6200] selection:text-white">
            <Header />
            <main className="flex-1 w-full flex flex-col items-center pt-16">

                {/* ─── Hero Section ─── */}
                <section className="w-full max-w-6xl mx-auto px-6 md:px-10 lg:px-16 pt-24 pb-32 flex flex-col md:flex-row items-center gap-12 lg:gap-24 relative">
                    <div className="flex-1 flex flex-col space-y-8 z-10 relative">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[12px] font-bold tracking-widest text-[#FF6200] uppercase">Live in Abuja</span>
                        </div>
                        <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
                            Abuja's Trusted<br />
                            Campus<br />
                            <span className="text-[#FF6200]">Marketplace.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-600 font-medium max-w-lg leading-relaxed">
                            Buy and sell fast within your uni. Order fresh food, textbooks, and services from verified students. Zero middlemen. Zero delays.
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link
                                href="/seller-onboard"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03] shadow-[0_8px_30px_rgba(255,98,0,0.3)] group"
                            >
                                START SELLING <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/marketplace"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground border border-zinc-200 dark:border-zinc-700 font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03]"
                            >
                                Browse Listings
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

                    <div className="flex-1 w-full relative h-[450px] lg:h-[550px] rounded-[3rem] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6200]/10 to-transparent" />
                        <div className="relative z-10 space-y-6">
                            {/* Food Card */}
                            <div className="bg-white dark:bg-zinc-950 p-4 rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 w-[280px] hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-16 h-16 bg-[#FF6200]/10 rounded-2xl flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8 text-[#FF6200]" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Delivering</p>
                                    <h4 className="font-bold text-foreground leading-none">Jollof Rice & Chicken</h4>
                                    <p className="text-[#FF6200] font-black mt-1">₦3,500</p>
                                </div>
                            </div>
                            {/* Service Card */}
                            <div className="bg-white dark:bg-zinc-950 p-4 rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 w-[280px] ml-12 hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                                    <Store className="w-8 h-8 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Service</p>
                                    <h4 className="font-bold text-foreground leading-none">MacBook Repair</h4>
                                    <p className="text-zinc-600 font-black mt-1">Nile Uni Campus</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Why MarketBridge ─── */}
                <section className="w-full bg-card border-y border-zinc-100 dark:border-zinc-900 py-24">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-16">
                            How it works on <span className="text-[#FF6200]">campus</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Students Only", icon: MapPin, color: "text-foreground", bg: "bg-zinc-100 dark:bg-zinc-900", desc: "Every user passes strict ID verification. Ensure you're trading with real, safe peers." },
                                { title: "Fast Delivery", icon: Zap, color: "text-[#FF6200]", bg: "bg-[#FF6200]/10", desc: "Sellers are in your hostels or faculty. From ordering to eating in minutes, not hours." },
                                { title: "Grow Your Hustle", icon: Store, color: "text-foreground", bg: "bg-zinc-100 dark:bg-zinc-900", desc: "Easily set up a storefront, list products (food, gadgets, fashion), and start taking orders today." }
                            ].map((feat, i) => (
                                <div key={i} className="flex flex-col items-center p-8 bg-background rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                                    <div className={`w-20 h-20 rounded-3xl ${feat.bg} flex items-center justify-center mb-6`}>
                                        <feat.icon className={`w-10 h-10 ${feat.color}`} />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-3">{feat.title}</h3>
                                    <p className="text-zinc-600 font-medium leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Open Access CTA ─── */}
                <section className="w-full max-w-5xl mx-auto px-6 py-32">
                    <div className="bg-[#111111] p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6200]/20 rounded-full blur-[80px]" />
                        <div className="relative z-10 flex-1 flex flex-col items-start text-left">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">
                                Join The <span className="text-[#FF6200]">Community.</span>
                            </h2>
                            <p className="text-white/60 font-medium text-lg max-w-xl mb-10">
                                Experience a vibrant marketplace for all your campus needs. Open for browsing and buying immediately—no waitlist, no delays.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <Link
                                    href="/signup"
                                    className="px-8 py-4 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.03] flex items-center justify-center shrink-0"
                                >
                                    Sign Up Now
                                </Link>
                                <Link
                                    href="/marketplace"
                                    className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold uppercase tracking-widest text-sm transition-all hover:scale-[1.03] flex items-center justify-center shrink-0"
                                >
                                    Browse Marketplace
                                </Link>
                            </div>
                        </div>

                        <div className="relative z-10 hidden md:flex flex-col items-center bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
                            <div className="bg-white p-4 rounded-2xl mb-4 text-[#111111] flex items-center justify-center shadow-lg">
                                <QrCode className="h-24 w-24" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-black uppercase tracking-widest text-xs">Scan to Sell Fast</p>
                            <p className="text-[#FF6200] text-[10px] uppercase font-bold tracking-widest mt-1">Open Camera App</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
