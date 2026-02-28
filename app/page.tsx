'use client';

import React from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FF6200] selection:text-white">
            <header className="w-full p-6 md:p-8 flex items-center justify-between absolute top-0 z-50">
                <Logo size="lg" />
                <div className="hidden sm:flex items-center gap-6">
                    <Link href="/login" className="text-white/80 hover:text-white font-bold text-sm tracking-wider uppercase transition-colors">
                        Log In
                    </Link>
                    <Link href="/signup" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-sm tracking-wider uppercase transition-all backdrop-blur-md">
                        Sign Up
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-24 pb-20 relative overflow-hidden">
                {/* Subtle Orange Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF6200]/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]"></span>
                        </span>
                        Campus Beta is Open
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.9] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        MarketBridge <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6200] to-[#FF8533]">
                            Campus Marketplace
                        </span>
                    </h1>

                    <p className="text-lg md:text-2xl font-medium text-white/70 mx-auto leading-relaxed max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Buy, sell & trade safely with verified student sellers. Textbooks, laptops, wigs, food delivery & more.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link 
                            href="/signup" 
                            className="w-full sm:w-auto px-10 py-5 bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest text-lg rounded-2xl transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,98,0,0.3)] flex items-center justify-center gap-3 group"
                        >
                            Get Started
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            href="/login" 
                            className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-lg rounded-2xl border border-white/10 transition-all backdrop-blur-md flex items-center justify-center"
                        >
                            Log In
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl pt-16 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
                        <div className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <ShoppingBag className="h-8 w-8 text-[#FF6200] mb-4" />
                            <h3 className="font-bold text-white mb-2">Buy Locally</h3>
                            <p className="text-sm text-white/50">Find exactly what you need right on your campus without high shipping fees.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <ShieldCheck className="h-8 w-8 text-[#FF6200] mb-4" />
                            <h3 className="font-bold text-white mb-2">Verified Sellers</h3>
                            <p className="text-sm text-white/50">Deal with confidence. Sellers go through mandatory student ID verification.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <Zap className="h-8 w-8 text-[#FF6200] mb-4" />
                            <h3 className="font-bold text-white mb-2">Start Earning</h3>
                            <p className="text-sm text-white/50">Turn your extra items into cash or start your student-run business today.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

