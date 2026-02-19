'use client';

import React from 'react';
import { MapPin, Shield, Navigation, X } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';

export function LocationConsentModal() {
    const { consentStatus, giveConsent, denyConsent } = useLocation();

    if (consentStatus !== 'prompt') return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={denyConsent} />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full" />

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                        <MapPin className="h-10 w-10 text-emerald-500" />
                        <div className="absolute inset-0 rounded-3xl border border-emerald-500/30 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                            Verify <span className="text-emerald-500">Sector</span> Proximity
                        </h2>
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                            Allow location access to show nearby campus listings and highlight Abuja marketplaces.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                            <Navigation className="h-5 w-5 text-emerald-500 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Precision</p>
                                <p className="text-xs text-white font-bold italic">Nearby-first results</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                            <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Privacy</p>
                                <p className="text-xs text-white font-bold italic">NDPA Compliant (City only)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full pt-4">
                        <Button
                            onClick={giveConsent}
                            className="w-full h-16 bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                        >
                            Allow Location Access
                        </Button>
                        <Button
                            onClick={denyConsent}
                            variant="ghost"
                            className="w-full h-12 text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-[10px] rounded-xl"
                        >
                            Not now, use manual entry
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
