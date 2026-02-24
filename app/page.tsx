"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { GraduationCap, ShoppingBag, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { Logo } from '@/components/logo';
import { createClient } from '@/lib/supabase/client';
import { ABUJA_UNIVERSITIES } from '@/lib/location';

export default function HomePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const {
        isAbuja,
        loading: locationLoading,
        nearestUniversity,
        consentStatus,
        requestLocation,
        denyConsent,
        setManualLocation,
        city,
        region
    } = useLocation();

    const [isMounted, setIsMounted] = useState(false);
    const [isPublicEnabled, setIsPublicEnabled] = useState(false);
    const [dbLoading, setDbLoading] = useState(true);
    const [showManualDropdown, setShowManualDropdown] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setIsMounted(true);
        checkPublicStatus();
    }, []);

    const checkPublicStatus = async () => {
        const envEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SECTION === 'true';
        if (!envEnabled) {
            setIsPublicEnabled(false);
            setDbLoading(false);
            return;
        }

        try {
            const { data } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'public_section_enabled')
                .single();

            const dbEnabled = data?.value === 'true' || data?.value === true;
            setIsPublicEnabled(envEnabled && dbEnabled);
        } catch (e) {
            setIsPublicEnabled(false);
        } finally {
            setDbLoading(false);
        }
    };

    // Auto-redirect logged-in users
    useEffect(() => {
        if (!isMounted || authLoading || dbLoading || !user) return;

        if (['student_seller', 'dealer'].includes(user.role)) {
            router.push('/seller/dashboard');
        } else if (['ceo', 'technical_admin', 'operations_admin'].includes(user.role)) {
            router.push('/admin');
        } else if (user.role === 'student_buyer' || user.role === 'customer') {
            // General logged in users go to campus section unless public is enabled and they're explicitly designated as 'customer'
            if (user.role === 'customer' && isPublicEnabled) {
                router.push('/public');
            } else {
                router.push('/campus');
            }
        }
    }, [isMounted, authLoading, dbLoading, user, router, isPublicEnabled]);

    useEffect(() => {
        if (!locationLoading && consentStatus === 'denied') {
            setShowManualDropdown(true);
        }
    }, [consentStatus, locationLoading]);

    if (!isMounted || authLoading || dbLoading) {
        return <HomeSkeleton />;
    }

    const isInAbujaCampus = isAbuja || (nearestUniversity && nearestUniversity.distance < 15);

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#FF6200] selection:text-black relative overflow-hidden">
            {/* Ambient Background Blur */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6200]/10 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* ── Minimal Header ── */}
            <header className="flex items-center justify-center sm:justify-start px-6 py-8 z-10 shrink-0">
                <div className="text-[#FF6200] font-black text-2xl uppercase tracking-tighter">MarketBridge</div>
            </header>

            {/* ── Main Choice Screen ── */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">

                <div className="text-center mb-10 max-w-4xl">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#FF6200] leading-[1.0] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        CHOOSE YOUR MARKETPLACE
                    </h1>
                </div>

                {/* ── Location Context Area ── */}
                <div className="w-full max-w-xl mx-auto mb-12 flex flex-col items-center justify-center min-h-[60px]">
                    {locationLoading ? (
                        <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full animate-in fade-in zoom-in duration-300">
                            <Loader2 className="h-4 w-4 text-[#FF6200] animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#FF6200]">Detecting Location...</span>
                        </div>
                    ) : consentStatus === 'prompt' ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-black/60 backdrop-blur-md border border-[#FF6200]/30 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 w-full max-w-md shadow-[0_0_30px_rgba(255,98,0,0.1)]">
                            <p className="text-xs font-medium text-white text-center sm:text-left leading-relaxed">Allow location to show nearby campus listings? <br /><span className="text-white/40">(Deny = manual entry)</span></p>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => { denyConsent(); setShowManualDropdown(true); }} className="px-5 py-2.5 rounded-xl bg-transparent border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Deny</button>
                                <button onClick={requestLocation} className="px-5 py-2.5 rounded-xl bg-[#FF6200] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(255,98,0,0.4)]">Allow</button>
                            </div>
                        </div>
                    ) : (city || region) ? (
                        <div className="flex items-center justify-center gap-2 bg-black/40 backdrop-blur-sm border border-[#FF6200]/30 px-6 py-3 rounded-full animate-in fade-in zoom-in shadow-[0_0_20px_rgba(255,98,0,0.1)]">
                            <MapPin className="h-4 w-4 text-[#FF6200]" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/60">
                                <span className="text-white/60 ml-2">{city ? `${city}, ` : ''}{region}</span>
                            </span>
                        </div>
                    ) : showManualDropdown ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md bg-black/60 backdrop-blur-md border border-white/10 p-5 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 shrink-0">
                                <MapPin className="h-4 w-4 text-[#FF6200]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Select Region:</span>
                            </div>
                            <select
                                className="w-full bg-white/5 border border-white/20 text-white p-3 rounded-xl outline-none focus:border-[#FF6200] transition-colors appearance-none text-center sm:text-left cursor-pointer font-bold text-sm"
                                onChange={(e) => {
                                    if (e.target.value === 'public') {
                                        setManualLocation('global');
                                    } else {
                                        const uni = ABUJA_UNIVERSITIES.find(u => u.id === e.target.value);
                                        if (uni) setManualLocation(uni);
                                    }
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Select your nearest area</option>
                                <optgroup label="Abuja Campuses">
                                    {ABUJA_UNIVERSITIES.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other Regions">
                                    <option value="public">Other / Nationwide</option>
                                </optgroup>
                            </select>
                        </div>
                    ) : null}
                </div>

                {/* ── Choice Cards Container ── */}
                <div className={`grid grid-cols-1 ${isPublicEnabled ? 'md:grid-cols-2' : 'max-w-xl'} gap-6 sm:gap-8 w-full max-w-5xl px-4`}>

                    {/* ── Campus Marketplace Card ── */}
                    <div
                        className={`
                            group relative flex flex-col bg-black/40 backdrop-blur-xl border-2 rounded-[2.5rem] overflow-hidden transition-all duration-500 p-8 sm:p-12
                            ${isInAbujaCampus ? 'border-[#FF6200] shadow-[0_0_50px_rgba(255,98,0,0.15)]' : 'border-white/10 hover:border-[#FF6200]/40'}
                        `}
                    >
                        <div className="mb-8 relative z-10 flex-1 flex flex-col justify-center">
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center mb-8 border border-[#FF6200]/20 group-hover:scale-110 transition-transform duration-500">
                                <GraduationCap className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-4">
                                Campus Marketplace
                            </h2>
                            <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs">
                                Buy & sell safely with verified student sellers in Abuja universities
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/campus')}
                            className="mt-auto w-full h-16 bg-[#FF6200] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(255,98,0,0.2)] hover:bg-white hover:text-black hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center gap-3 group/btn text-xs sm:text-sm border-none relative z-10"
                        >
                            ENTER CAMPUS
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* ── Public Marketplace Card (Locked) ── */}
                    {isPublicEnabled && (
                        <div
                            className="group relative flex flex-col bg-black/40 backdrop-blur-xl border-2 border-white/10 hover:border-[#FF6200]/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 p-8 sm:p-12 hover:shadow-[0_0_40px_rgba(255,98,0,0.1)]"
                        >
                            <div className="mb-8 relative z-10 flex-1 flex flex-col justify-center">
                                <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center mb-8 border border-[#FF6200]/20 group-hover:scale-110 transition-transform duration-500">
                                    <ShoppingBag className="h-8 w-8 text-[#FF6200]" />
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-4">
                                    Public Marketplace
                                </h2>
                                <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs">
                                    Buy & sell anything in Nigeria – open to everyone
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/public')}
                                className="mt-auto w-full h-16 bg-[#FF6200] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-3 group/btn text-xs sm:text-sm shadow-[0_10px_30px_rgba(255,98,0,0.2)] hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)] relative z-10"
                            >
                                ENTER PUBLIC
                                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Minimal Shared Footer ── */}
            <footer className="w-full border-t border-white/5 py-8 bg-transparent shrink-0 relative z-10 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-center px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[10px] font-black uppercase tracking-widest mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-white/40">Tech Support:</span>
                            <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors">
                                support@marketbridge.com.ng
                            </a>
                        </div>
                        <span className="hidden sm:inline text-white/10">|</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white/40">Ops Support:</span>
                            <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors">
                                ops-support@marketbridge.com.ng
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center space-y-12 p-6">
            <div className="h-24 w-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin" />
            </div>
            <div className="space-y-6 w-full max-w-sm text-center">
                <div className="h-12 bg-white/5 rounded-2xl animate-pulse w-full" />
                <div className="h-8 bg-white/5 rounded-2xl animate-pulse w-2/3 mx-auto" />
            </div>
        </div>
    );
}
