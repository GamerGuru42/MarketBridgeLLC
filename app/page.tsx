"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { GraduationCap, Loader2, MapPin } from 'lucide-react';
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
    const [showManualDropdown, setShowManualDropdown] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-redirect logged-in users
    useEffect(() => {
        if (!isMounted || authLoading || !user) return;

        if (['student_seller', 'dealer'].includes(user.role)) {
            router.push('/seller/dashboard');
        } else if (['ceo', 'technical_admin', 'operations_admin'].includes(user.role)) {
            router.push('/admin');
        } else {
            router.push('/campus');
        }
    }, [isMounted, authLoading, user, router]);

    useEffect(() => {
        if (!locationLoading && consentStatus === 'denied') {
            setShowManualDropdown(true);
        }
    }, [consentStatus, locationLoading]);

    if (!isMounted || authLoading) {
        return <HomeSkeleton />;
    }

    const isInAbujaCampus = isAbuja || (nearestUniversity && nearestUniversity.distance < 15);

    return (
        <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#FF6200] selection:text-[#000000] relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6200]/10 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* ── Minimal Header ── */}
            <header className="flex items-center justify-center sm:justify-start px-6 py-8 z-10 shrink-0">
                <div className="text-[#FF6200] font-black text-2xl uppercase tracking-tighter">MarketBridge</div>
            </header>

            {/* ── Main Screen ── */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">

                <div className="text-center mb-10 max-w-4xl">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#FF6200] leading-[1.0] animate-in fade-in slide-in-from-bottom-4 duration-1000 bg-[#000000] px-4 py-2">
                        MarketBridge Campus Marketplace
                    </h1>
                </div>

                {/* ── Location Context Area ── */}
                <div className="w-full max-w-xl mx-auto mb-12 flex flex-col items-center justify-center min-h-[60px]">
                    {locationLoading ? (
                        <div className="flex items-center justify-center gap-3 bg-[#FFFFFF]/5 border border-[#FFFFFF]/10 px-6 py-3 rounded-full animate-in fade-in zoom-in duration-300">
                            <Loader2 className="h-4 w-4 text-[#FF6200] animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#FF6200]">Detecting Location...</span>
                        </div>
                    ) : consentStatus === 'prompt' ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-[#000000]/60 backdrop-blur-md border border-[#FF6200]/30 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 w-full max-w-md shadow-[0_0_30px_rgba(255,98,0,0.1)]">
                            <p className="text-xs font-medium text-[#FFFFFF] text-center sm:text-left leading-relaxed">Allow location to show nearby campus listings? <br /><span className="text-[#FFFFFF]/40">(Deny = manual entry)</span></p>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => { denyConsent(); setShowManualDropdown(true); }} className="px-5 py-2.5 rounded-xl bg-transparent border border-[#FFFFFF]/20 text-[#FFFFFF] text-[10px] font-black uppercase tracking-widest hover:bg-[#FFFFFF]/5 transition-all">Deny</button>
                                <button onClick={requestLocation} className="px-5 py-2.5 rounded-xl bg-[#FF6200] text-[#000000] text-[10px] font-black uppercase tracking-widest hover:bg-[#FFFFFF] transition-all shadow-[0_0_15px_rgba(255,98,0,0.4)]">Allow</button>
                            </div>
                        </div>
                    ) : (city || region) ? (
                        <div className="flex items-center justify-center gap-2 bg-[#000000]/40 backdrop-blur-sm border border-[#FF6200]/30 px-6 py-3 rounded-full animate-in fade-in zoom-in shadow-[0_0_20px_rgba(255,98,0,0.1)]">
                            <MapPin className="h-4 w-4 text-[#FF6200]" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#FFFFFF]/60">
                                <span className="text-[#FFFFFF]/60 ml-2">{city ? `${city}, ` : ''}{region}</span>
                            </span>
                        </div>
                    ) : showManualDropdown ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md bg-[#000000]/60 backdrop-blur-md border border-[#FFFFFF]/10 p-5 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 shrink-0">
                                <MapPin className="h-4 w-4 text-[#FF6200]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFFFFF]/60">Select Region:</span>
                            </div>
                            <select
                                className="w-full bg-[#FFFFFF]/5 border border-[#FFFFFF]/20 text-[#FFFFFF] p-3 rounded-xl outline-none focus:border-[#FF6200] transition-colors appearance-none text-center sm:text-left cursor-pointer font-bold text-sm"
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
                                <option value="" disabled className="bg-[#000000] text-[#FFFFFF]">Select your nearest area</option>
                                <optgroup label="Abuja Campuses" className="bg-[#000000] text-[#FFFFFF]">
                                    {ABUJA_UNIVERSITIES.map(u => (
                                        <option key={u.id} value={u.id} className="bg-[#000000] text-[#FFFFFF]">{u.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other Regions" className="bg-[#000000] text-[#FFFFFF]">
                                    <option value="public" className="bg-[#000000] text-[#FFFFFF]">Other / Nationwide</option>
                                </optgroup>
                            </select>
                        </div>
                    ) : null}
                </div>

                {/* ── Single Choice Card Container ── */}
                <div className="w-full max-w-xl px-4 flex justify-center">
                    {/* ── Campus Marketplace Card ── */}
                    <div
                        className={`
                            group relative flex flex-col bg-[#000000]/40 backdrop-blur-xl border-2 rounded-[2.5rem] overflow-hidden transition-all duration-500 p-8 sm:p-12 w-full
                            ${isInAbujaCampus ? 'border-[#FF6200] shadow-[0_0_50px_rgba(255,98,0,0.15)]' : 'border-[#FFFFFF]/10 hover:border-[#FF6200]/40'}
                        `}
                    >
                        <div className="mb-8 relative z-10 flex-1 flex flex-col justify-center text-center items-center">
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center mb-4 border border-[#FF6200]/20 transition-transform duration-500">
                                <GraduationCap className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <h2 className="text-[#FFFFFF] text-2xl font-black uppercase tracking-tighter mb-4">
                                Enter Campus Marketplace
                            </h2>
                            <p className="text-[#FFFFFF]/60 text-sm font-medium leading-relaxed max-w-sm mx-auto mb-8">
                                Buy & sell safely with verified student sellers in Abuja universities
                            </p>
                            <button
                                onClick={() => router.push('/campus')}
                                className="mt-auto w-full h-16 bg-[#FF6200] text-[#FFFFFF] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(255,98,0,0.2)] hover:bg-[#FFFFFF] hover:text-[#000000] hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center gap-3 text-sm sm:text-base border-none relative z-10"
                            >
                                ENTER CAMPUS
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Minimal Shared Footer ── */}
            <footer className="w-full border-t border-[#FFFFFF]/5 py-8 bg-transparent shrink-0 relative z-10 mt-12 text-center">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-[#FFFFFF]/40 text-xs mb-4 font-bold uppercase tracking-widest">MarketBridge Campus Beta – Testing Phase</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[10px] font-black uppercase tracking-widest mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[#FFFFFF]/40">Tech Support:</span>
                            <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:text-[#FFFFFF] transition-colors">
                                support@marketbridge.com.ng
                            </a>
                        </div>
                        <span className="hidden sm:inline text-[#FFFFFF]/10">|</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[#FFFFFF]/40">Ops Support:</span>
                            <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:text-[#FFFFFF] transition-colors">
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
            <div className="h-24 w-24 rounded-[2rem] bg-[#FFFFFF]/5 border border-[#FFFFFF]/10 flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin" />
            </div>
            <div className="space-y-6 w-full max-w-sm text-center">
                <div className="h-12 bg-[#FFFFFF]/5 rounded-2xl animate-pulse w-full" />
                <div className="h-8 bg-[#FFFFFF]/5 rounded-2xl animate-pulse w-2/3 mx-auto" />
            </div>
        </div>
    );
}
