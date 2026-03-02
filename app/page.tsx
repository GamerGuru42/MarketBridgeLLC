'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, MapPin, Zap, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

                    <div className="flex-1 w-full relative h-[500px] lg:h-[600px] flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-500">
                        {/* Soft Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#FF6200]/10 dark:bg-[#FF6200]/20 rounded-full blur-[100px] pointer-events-none" />

                        {/* Phone Mockup Frame */}
                        <div className="relative z-10 w-[280px] h-[560px] bg-zinc-50 dark:bg-zinc-950 border-[8px] border-zinc-200 dark:border-zinc-800 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col items-center">
                            {/* Notch */}
                            <div className="absolute top-0 w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-b-2xl z-20" />

                            <div className="flex-1 w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-4 pt-12 space-y-4">
                                {/* Simulated App Header */}
                                <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 mt-2" />

                                {/* Food Card inside Phone */}
                                <div className="bg-white dark:bg-black p-4 rounded-[1.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800/50 w-full hover:-translate-y-1 transition-transform cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-[#FF6200]/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <ShoppingBag className="w-6 h-6 text-[#FF6200]" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Delivering</p>
                                            <h4 className="font-bold text-foreground text-sm leading-tight">Jollof & Chicken</h4>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                                        <p className="text-[#FF6200] font-black">₦3,500</p>
                                        <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Service Card inside Phone */}
                                <div className="bg-white dark:bg-black p-4 rounded-[1.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800/50 w-full hover:-translate-y-1 transition-transform cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                                            <Store className="w-6 h-6 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Fixed Cost</p>
                                            <h4 className="font-bold text-foreground text-sm leading-tight">MacBook Repair</h4>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                                        <p className="text-zinc-500 font-bold text-xs truncate">Campus A</p>
                                        <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <div className="absolute right-0 bottom-24 z-20 bg-[#111111] dark:bg-zinc-800 text-white dark:text-zinc-100 px-6 py-4 rounded-3xl shadow-2xl rotate-[4deg] animate-float border border-white/10 dark:border-white/5 hidden sm:block">
                            <div className="flex items-center gap-3">
                                <Zap className="w-6 h-6 text-[#FF6200]" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">ETA To Hostel</p>
                                    <p className="font-black text-xl leading-none mt-0.5">15 Mins</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-4 top-40 z-20 bg-white dark:bg-zinc-900 text-foreground px-5 py-3.5 rounded-2xl shadow-xl -rotate-[5deg] animate-float [animation-delay:1s] border border-zinc-100 dark:border-zinc-800 hidden sm:flex items-center gap-2.5">
                            <div className="h-6 w-6 rounded-full bg-[#FF6200]/10 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" />
                            </div>
                            <p className="font-black text-sm tracking-tight text-zinc-800 dark:text-zinc-200">Verified Seller</p>
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
                            <div className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
                                <QRCodeSVG
                                    value="https://marketbridge.com.ng/seller-onboard"
                                    size={120}
                                    bgColor="#FFFFFF"
                                    fgColor="#111111"
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-white font-black uppercase tracking-widest text-xs">Scan to Sell Fast</p>
                            <p className="text-[#FF6200] text-[10px] uppercase font-bold tracking-widest mt-1">Opens Seller Form</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
