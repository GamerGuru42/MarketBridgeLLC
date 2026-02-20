'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { GraduationCap, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function HomePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isAbuja, loading: locationLoading, nearestUniversity } = useLocation();
    const [isMounted, setIsMounted] = useState(false);

    // Both the environment variable AND a potential DB check are used for the hard lock
    const isPublicEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SECTION === 'true';

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-redirect logged-in users to the right area based on role
    useEffect(() => {
        if (!isMounted || authLoading || !user) return;

        if (['student_seller', 'dealer'].includes(user.role)) {
            router.push('/seller/dashboard');
        } else if (['ceo', 'technical_admin', 'operations_admin'].includes(user.role)) {
            router.push('/admin');
        } else if (user.role === 'student_buyer') {
            router.push('/listings');
        } else if (user.role === 'customer' && isPublicEnabled) {
            router.push('/public');
        }
    }, [isMounted, authLoading, user, router, isPublicEnabled]);

    if (!isMounted || authLoading || locationLoading) {
        return <HomeSkeleton />;
    }

    // High fidelity detection: if within 10km of a campus or Geolocation says Abuja
    const isInAbujaCampus = isAbuja || (nearestUniversity && nearestUniversity.distance < 10);

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#FF6200] selection:text-black">

            {/* ── Minimal Header ── */}
            <header className="flex items-center justify-between px-6 py-6 border-b border-white/5 bg-black">
                <Logo />
                <div className="flex items-center gap-8">
                    <a href="mailto:support@marketbridge.com.ng" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:text-white transition-all">
                        Technical Support
                    </a>
                    <a href="mailto:ops-support@marketbridge.com.ng" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:text-white transition-all">
                        Operations Support
                    </a>
                </div>
            </header>

            {/* ── Main Choice Screen ── */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">

                <div className="text-center mb-16 max-w-4xl">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#FF6200] leading-[1.0] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        WHERE DO YOU WANT<br />TO TRADE TODAY?
                    </h1>
                </div>

                {/* ── Choice Cards Container ── */}
                <div className={`grid grid-cols-1 ${isPublicEnabled ? 'md:grid-cols-2' : 'max-w-xl'} gap-8 w-full max-w-5xl px-4`}>

                    {/* ── Campus Marketplace Card ── */}
                    <div
                        className={`
                            group relative flex flex-col bg-[#000000] border-4 rounded-[2.5rem] overflow-hidden transition-all duration-500 p-8 sm:p-12
                            ${isInAbujaCampus ? 'border-[#FF6200] shadow-[0_0_60px_rgba(255,98,0,0.15)]' : 'border-white/10 hover:border-[#FF6200]/50'}
                        `}
                    >
                        <div className="mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center mb-6">
                                <GraduationCap className="h-10 w-10 text-[#FF6200]" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-4">
                                Campus <span className="text-[#FF6200]">Marketplace</span>
                            </h2>
                            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wide leading-relaxed">
                                Buy, sell & trade safely within Abuja universities – verified students only
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/listings')}
                            className="mt-auto w-full h-20 bg-[#FF6200] text-black font-black uppercase tracking-[0.2em] rounded-3xl shadow-[0_20px_40px_rgba(255,98,0,0.2)] hover:bg-white hover:shadow-white/10 transition-all flex items-center justify-center gap-3 group text-base border-none"
                        >
                            ENTER CAMPUS
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* ── Public Marketplace Card (Locked) ── */}
                    {isPublicEnabled && (
                        <div
                            className="group relative flex flex-col bg-[#000000] border-4 border-white/10 hover:border-[#FF6200]/50 rounded-[2.5rem] overflow-hidden transition-all duration-500 p-8 sm:p-12"
                        >
                            <div className="mb-8">
                                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                    <ShoppingBag className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-4">
                                    Public <span className="text-white/40">Marketplace</span>
                                </h2>
                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-wide leading-relaxed">
                                    Open to all Nigerians. General electronics, fashion, and services across the country.
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/public')}
                                className="mt-auto w-full h-20 bg-white text-black font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-[#FF6200] transition-all flex items-center justify-center gap-3 group text-base"
                            >
                                ENTER PUBLIC
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                </div>
            </main>

            {/* ── Minimal Shared Footer ── */}
            <footer className="w-full border-t border-white/5 px-6 py-10 bg-black">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600">Tech Support:</span>
                            <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors underline decoration-[#FF6200]/20 underline-offset-4">
                                support@marketbridge.com.ng
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600">Ops Support:</span>
                            <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors underline decoration-[#FF6200]/20 underline-offset-4">
                                ops-support@marketbridge.com.ng
                            </a>
                        </div>
                    </div>
                </div>
                <div className="mt-10 text-center">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">
                        MarketBridge Beta Protocol © 2026
                    </p>
                </div>
            </footer>
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center space-y-12 p-6">
            <div className="h-24 w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin" />
            </div>
            <div className="space-y-6 w-full max-w-2xl text-center">
                <div className="h-10 bg-white/5 rounded-2xl animate-pulse w-3/4 mx-auto" />
                <div className="h-10 bg-white/5 rounded-2xl animate-pulse w-1/2 mx-auto" />
            </div>
        </div>
    );
}
