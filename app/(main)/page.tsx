'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { GraduationCap, ShoppingBag, ArrowRight, MapPin, Lock, AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import { ABUJA_UNIVERSITIES } from '@/lib/location';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

export default function HomePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isAbuja, city, region, loading: locationLoading, error: locationError, nearestUniversity, setManualLocation, requestLocation } = useLocation();
    const [isMounted, setIsMounted] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [hovered, setHovered] = useState<'campus' | 'public' | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-redirect logged-in users to the right area
    useEffect(() => {
        if (!isMounted || authLoading || !user) return;
        // All users go to campus listings by default (public is locked)
        // Future: check user role and redirect accordingly
    }, [isMounted, authLoading, user, router]);

    if (!isMounted || authLoading) {
        return <HomeSkeleton />;
    }

    const locationLabel = (() => {
        if (locationLoading) return 'Detecting location…';
        if (locationError) return 'Location access denied';
        if (city && region) return `${city}, ${region}`;
        if (region) return region;
        return 'Location unknown';
    })();

    const isInAbujaCampus = isAbuja && nearestUniversity;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', 'Manrope', system-ui, sans-serif" }}>

            {/* ── Minimal Header ── */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                <Logo />
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span className="hidden sm:flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Campus Beta Live
                    </span>
                    <a href="mailto:support@marketbridge.com.ng" className="text-zinc-600 hover:text-zinc-400 transition-colors hidden md:block">
                        Support
                    </a>
                </div>
            </header>

            {/* ── Main Choice Screen ── */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

                {/* Background ambient glows */}
                <div className="absolute top-[-20%] left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Top label */}
                <div className="text-center mb-10 space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <span>MarketBridge</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        <span>Campus Beta</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        <span>February 2026</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                        Where do you want to<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">trade today?</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium max-w-sm mx-auto">
                        Choose your marketplace. Campus is live. Public launches Phase 2.
                    </p>
                </div>

                {/* ── Location Signal ── */}
                <div className="mb-8 relative z-10 w-full max-w-xs mx-auto">
                    <button
                        onClick={() => setShowManual(v => !v)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs font-bold text-zinc-400 hover:text-white"
                    >
                        <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            {locationLoading ? (
                                <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Locating…</span>
                            ) : (
                                <span>{locationLabel}</span>
                            )}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showManual ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Manual location picker */}
                    {showManual && (
                        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-4 pt-3 pb-1">Select Campus Node</p>
                            {ABUJA_UNIVERSITIES.map((uni) => (
                                <button
                                    key={uni.id}
                                    onClick={() => { setManualLocation(uni); setShowManual(false); }}
                                    className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-white/5 transition-colors text-zinc-300 hover:text-white flex items-center gap-3"
                                >
                                    <GraduationCap className="h-4 w-4 text-emerald-500 shrink-0" />
                                    {uni.name}
                                </button>
                            ))}
                            <button
                                onClick={() => { setManualLocation('global'); setShowManual(false); }}
                                className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-300 flex items-center gap-3 border-t border-white/5"
                            >
                                <ShoppingBag className="h-4 w-4 text-blue-400 shrink-0" />
                                Somewhere else in Nigeria
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Two Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl relative z-10">

                    {/* ── Card 1: Campus Marketplace ── */}
                    <button
                        id="btn-campus-marketplace"
                        onClick={() => router.push('/listings')}
                        onMouseEnter={() => setHovered('campus')}
                        onMouseLeave={() => setHovered(null)}
                        className={`
                            group relative text-left rounded-3xl border-2 p-8 transition-all duration-300 overflow-hidden
                            ${isInAbujaCampus
                                ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/60 shadow-[0_0_60px_rgba(52,211,153,0.1)]'
                                : 'bg-zinc-900/60 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20'
                            }
                        `}
                    >
                        {/* Status badge */}
                        <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live Beta</span>
                        </div>

                        {/* Background glow on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent transition-opacity duration-300 ${hovered === 'campus' ? 'opacity-100' : 'opacity-0'}`} />

                        <div className="relative z-10 space-y-5">
                            {/* Icon */}
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isInAbujaCampus ? 'bg-emerald-500 shadow-[0_0_30px_rgba(52,211,153,0.3)]' : 'bg-emerald-900/40 border border-emerald-500/20 group-hover:bg-emerald-500/30'}`}>
                                <GraduationCap className={`h-7 w-7 ${isInAbujaCampus ? 'text-black' : 'text-emerald-400'}`} />
                            </div>

                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                                    Campus Marketplace
                                </h2>
                                <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mt-1">Students Only</p>
                            </div>

                            {/* Description */}
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Buy, sell &amp; trade safely within Abuja universities – verified students only.
                            </p>

                            {/* Campus indicator */}
                            {isInAbujaCampus && nearestUniversity && (
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Near {nearestUniversity.node.name}
                                </div>
                            )}

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-2">
                                {['Verified Students', 'Safe Payments', 'Local Pickup'].map(f => (
                                    <span key={f} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                        {f}
                                    </span>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className={`w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${isInAbujaCampus ? 'bg-emerald-500 text-black group-hover:bg-emerald-400' : 'bg-white/5 text-zinc-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 border border-white/10'}`}>
                                Enter Campus
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* ── Card 2: Public Marketplace ── */}
                    <button
                        id="btn-public-marketplace"
                        onClick={() => router.push('/public')}
                        onMouseEnter={() => setHovered('public')}
                        onMouseLeave={() => setHovered(null)}
                        className="group relative text-left rounded-3xl border-2 bg-zinc-900/40 border-white/5 hover:border-blue-500/30 p-8 transition-all duration-300 overflow-hidden"
                    >
                        {/* Status badge */}
                        <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10">
                            <Lock className="h-2.5 w-2.5 text-zinc-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Phase 2</span>
                        </div>

                        {/* Background glow on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent transition-opacity duration-300 ${hovered === 'public' ? 'opacity-100' : 'opacity-0'}`} />

                        <div className="relative z-10 space-y-5">
                            {/* Icon */}
                            <div className="h-14 w-14 rounded-2xl bg-blue-900/20 border border-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all duration-300">
                                <ShoppingBag className="h-7 w-7 text-blue-500/60 group-hover:text-blue-400 transition-colors" />
                            </div>

                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-400 group-hover:text-blue-300 transition-colors">
                                    Public Marketplace
                                </h2>
                                <p className="text-blue-700/60 text-xs font-bold uppercase tracking-widest mt-1 group-hover:text-blue-500/70 transition-colors">Open to All Nigerians</p>
                            </div>

                            {/* Description */}
                            <p className="text-zinc-600 text-sm leading-relaxed">
                                Buy &amp; sell anything in Nigeria – open to everyone. Coming soon – currently locked for protocol testing.
                            </p>

                            {/* Lock notice */}
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                <AlertCircle className="h-3 w-3" />
                                Launching Phase 2 – join the waitlist
                            </div>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-2">
                                {['Electronics', 'Fashion', 'Vehicles', 'Services'].map(f => (
                                    <span key={f} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                        {f}
                                    </span>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-widest text-xs bg-white/[0.03] text-zinc-600 group-hover:bg-blue-500/10 group-hover:text-blue-400 border border-white/5 group-hover:border-blue-500/20 transition-all duration-300">
                                <Lock className="h-3.5 w-3.5" />
                                Coming Soon
                            </div>
                        </div>
                    </button>
                </div>

                {/* ── Bottom support strip ── */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 relative z-10">
                    <a href="mailto:support@marketbridge.com.ng" className="hover:text-zinc-400 transition-colors flex items-center gap-1.5">
                        Tech Issue? support@marketbridge.com.ng
                    </a>
                    <span className="h-3 w-px bg-zinc-800 hidden sm:block" />
                    <a href="mailto:ops-support@marketbridge.com.ng" className="hover:text-zinc-400 transition-colors flex items-center gap-1.5">
                        Refund / Account? ops-support@marketbridge.com.ng
                    </a>
                </div>
            </main>

            {/* ── Minimal Footer ── */}
            <footer className="border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">
                    © {new Date().getFullYear()} MarketBridge Campus Beta · Abuja, Nigeria
                </p>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-700">
                    <a href="/terms" className="hover:text-zinc-400 transition-colors">Terms</a>
                    <a href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</a>
                    <a href="/disclaimer" className="hover:text-zinc-400 transition-colors">Beta Disclaimer</a>
                </div>
            </footer>
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header skeleton */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                <Skeleton className="h-8 w-32 bg-zinc-900 rounded-xl" />
                <Skeleton className="h-5 w-24 bg-zinc-900 rounded-full" />
            </div>
            {/* Main skeleton */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8">
                <div className="space-y-3 text-center">
                    <Skeleton className="h-6 w-64 bg-zinc-900 rounded-full mx-auto" />
                    <Skeleton className="h-12 w-80 bg-zinc-900 rounded-xl mx-auto" />
                    <Skeleton className="h-4 w-60 bg-zinc-900 rounded-lg mx-auto" />
                </div>
                <Skeleton className="h-12 w-72 bg-zinc-900 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
                    <Skeleton className="h-[380px] w-full bg-zinc-900 rounded-3xl" />
                    <Skeleton className="h-[380px] w-full bg-zinc-900 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
