'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { GraduationCap, ShoppingBag, ArrowRight, MapPin, Lock, Loader2, Info } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isAbuja, city, region, loading: locationLoading, nearestUniversity } = useLocation();
    const [isMounted, setIsMounted] = useState(false);
    const [hovered, setHovered] = useState<'campus' | 'public' | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-redirect logged-in users to the right area
    useEffect(() => {
        if (!isMounted || authLoading || !user) return;

        // Auto-redirect based on role
        if (['student_seller', 'dealer'].includes(user.role)) {
            router.push('/seller/dashboard');
        } else if (user.role === 'ceo' || user.role === 'technical_admin' || user.role === 'operations_admin') {
            router.push('/admin');
        } else if (user.role === 'student_buyer') {
            router.push('/listings');
        } else if (user.role === 'customer') {
            router.push('/public');
        }
    }, [isMounted, authLoading, user, router]);

    if (!isMounted || authLoading) {
        return <HomeSkeleton />;
    }

    const locationLabel = (() => {
        if (locationLoading) return 'Detecting location…';
        if (city && region) return `${city}, ${region}`;
        if (region) return region;
        return 'Nigeria';
    })();

    const isInAbujaCampus = isAbuja || (nearestUniversity && nearestUniversity.distance < 15);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', 'Manrope', system-ui, sans-serif" }}>

            {/* ── Minimal Header ── */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0 bg-black/50 backdrop-blur-sm sticky top-0 z-[60]">
                <Logo />
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Campus Beta
                    </span>
                    <a href="mailto:support@marketbridge.com.ng" className="hover:text-white transition-colors">
                        Support
                    </a>
                </div>
            </header>

            {/* ── Main Choice Screen ── */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">

                {/* Background ambient glows */}
                <div className="absolute top-[-20%] left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Top Label & Headline */}
                <div className="text-center mb-10 space-y-4 relative z-10 w-full max-w-2xl px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        {locationLoading ? (
                            <span className="animate-pulse">Detecting Sector...</span>
                        ) : (
                            <span>{locationLabel}</span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white italic leading-[1.1]">
                        Marketplace <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Entry Portal</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium max-w-sm mx-auto lowercase italic">
                        choose your marketplace. Campus Beta is live. Public Expansion is locked for launch.
                    </p>
                </div>

                {/* ── Choice Cards Container ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10 px-4">

                    {/* ── Card 1: Campus Marketplace ── */}
                    <div
                        onMouseEnter={() => setHovered('campus')}
                        onMouseLeave={() => setHovered(null)}
                        className={`
                            group relative flex flex-col bg-zinc-900/40 border-2 rounded-[3.5rem] overflow-hidden transition-all duration-500
                            ${isInAbujaCampus
                                ? 'border-emerald-500 shadow-[0_30px_90px_rgba(16,185,129,0.15)] scale-[1.02] z-20'
                                : 'border-white/5 hover:border-emerald-500/30'
                            }
                        `}
                    >
                        {/* Status Label */}
                        <div className="absolute top-8 right-8">
                            <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Beta</span>
                            </div>
                        </div>

                        {/* Visual Header */}
                        <div className="h-48 bg-emerald-500/5 flex items-center justify-center relative overflow-hidden border-b border-white/5">
                            <GraduationCap className={`h-24 w-24 transition-all duration-500 ${hovered === 'campus' ? 'scale-110 rotate-3 text-emerald-500' : 'text-emerald-500/40'}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                        </div>

                        {/* Description Section */}
                        <div className="p-10 space-y-8 flex-1 flex flex-col justify-between">
                            <div className="space-y-4 text-left">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Campus <span className="text-emerald-500">Hub</span></h2>
                                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                    Exclusive trade zone for Abuja university students. Verified student IDs, safe campus pickups, and student-first pricing.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {['Cosmopolitan', 'Nile', 'Baze', 'Veritas'].map(u => (
                                        <span key={u} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500">{u}</span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/listings')}
                                className="w-full h-16 bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3 group"
                            >
                                Enter Campus Beta
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* ── Card 2: Public Marketplace ── */}
                    <div
                        onMouseEnter={() => setHovered('public')}
                        onMouseLeave={() => setHovered(null)}
                        className="group relative flex flex-col bg-zinc-950/60 border-2 border-white/5 hover:border-blue-500/20 rounded-[3.5rem] overflow-hidden transition-all duration-500 grayscale opacity-80 hover:grayscale-0 hover:opacity-100"
                    >
                        {/* Status Label */}
                        <div className="absolute top-8 right-8">
                            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                                <Lock className="h-3 w-3 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Locked</span>
                            </div>
                        </div>

                        {/* Visual Header */}
                        <div className="h-48 bg-blue-500/5 flex items-center justify-center relative overflow-hidden border-b border-white/5">
                            <ShoppingBag className={`h-24 w-24 transition-all duration-500 ${hovered === 'public' ? 'scale-110 -rotate-3 text-blue-500' : 'text-blue-500/40'}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                        </div>

                        {/* Description Section */}
                        <div className="p-10 space-y-8 flex-1 flex flex-col justify-between">
                            <div className="space-y-4 text-left">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter opacity-50">Public <span className="text-blue-500">Expansion</span></h2>
                                <p className="text-zinc-600 text-sm font-medium leading-relaxed">
                                    Open to all Nigerians. General electronics, cars, fashion, and services outside the campus network. Launching Phase 2 soon.
                                </p>
                                <div className="inline-flex bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 items-center gap-2">
                                    <Info className="h-3 w-3 text-blue-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Phase 2: Feb 26 Deploy</span>
                                </div>
                            </div>

                            <button
                                disabled
                                className="w-full h-16 bg-zinc-900 text-zinc-700 font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed border border-white/5"
                            >
                                <Lock className="h-5 w-5" /> Protocol Locked
                            </button>
                        </div>
                    </div>

                </div>

                {/* Shared Simple Footer links */}
                <div className="mt-16 text-center space-y-4 relative z-10">
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-loose">
                        Federal Marketplace Protocol © 2026<br />
                        <a href="/terms" className="hover:text-white transition-colors">Terms</a> • <a href="/privacy" className="hover:text-white transition-colors">NDPA Privacy</a> • <a href="/cookies" className="hover:text-white transition-colors">Cookies</a>
                    </p>
                </div>
            </main>

            {/* Support Split Section */}
            <footer className="w-full border-t border-white/5 px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-950/80 backdrop-blur-sm">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6600]">Support Operations</p>
                    <p className="text-zinc-500 text-[10px] font-medium italic">Establishing direct links to command centers</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <a href="mailto:support@marketbridge.com.ng" className="h-14 px-6 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-white/5 transition-all">
                        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <Info className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white">Technical Help</p>
                            <p className="text-[8px] font-medium text-zinc-600">Login, Bugs, Errors</p>
                        </div>
                    </a>
                    <a href="mailto:ops-support@marketbridge.com.ng" className="h-14 px-6 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-white/5 transition-all">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white">Operational Help</p>
                            <p className="text-[8px] font-medium text-zinc-600">Refunds, Payments, Sellers</p>
                        </div>
                    </a>
                </div>
            </footer>
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 p-6">
            <div className="h-24 w-24 rounded-3xl bg-white/5 animate-pulse border border-white/5 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
            </div>
            <div className="space-y-4 w-full max-w-sm">
                <div className="h-8 bg-white/5 rounded-full animate-pulse w-3/4 mx-auto" />
                <div className="h-4 bg-white/5 rounded-full animate-pulse w-1/2 mx-auto" />
            </div>
        </div>
    );
}
