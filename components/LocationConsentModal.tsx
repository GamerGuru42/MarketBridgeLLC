'use client';

import React from 'react';
import { MapPin, Shield, Navigation, Globe, ChevronDown } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { ABUJA_UNIVERSITIES } from '@/lib/location';

export function LocationConsentModal() {
    const { consentStatus, giveConsent, denyConsent, setManualLocation } = useLocation();

    if (consentStatus !== 'prompt') return null;

    const handleSkipBrowseAll = () => {
        setManualLocation('global');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={handleSkipBrowseAll} />

            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-[#FF6200]" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                            Enable <span className="text-[#FF6200]">Location</span>?
                        </h2>
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                            Show nearby campus listings or browse all items across Abuja.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                            <Navigation className="h-5 w-5 text-[#FF6200] shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GPS Precision</p>
                                <p className="text-xs text-white font-bold italic">Nearby-first results</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                            <Shield className="h-5 w-5 text-[#FF6200] shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Privacy</p>
                                <p className="text-xs text-white font-bold italic">NDPA Compliant (City only)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full pt-4">
                        <Button
                            onClick={giveConsent}
                            className="w-full h-16 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(255,98,0,0.2)]"
                        >
                            Allow Location Access
                        </Button>

                        <select
                            onChange={(e) => {
                                if (e.target.value && e.target.value !== 'skip') {
                                    const uni = ABUJA_UNIVERSITIES.find(u => u.id === e.target.value);
                                    if (uni) setManualLocation(uni);
                                }
                                if (e.target.value === 'skip') {
                                    handleSkipBrowseAll();
                                }
                            }}
                            className="w-full h-14 px-6 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 hover:text-white focus:text-white font-bold uppercase tracking-widest text-[10px] cursor-pointer appearance-none"
                            defaultValue=""
                        >
                            <option value="" disabled>Select University</option>
                            <option value="skip" className="bg-zinc-900 text-white uppercase">Skip, Browse All</option>
                            {ABUJA_UNIVERSITIES.map(u => (
                                <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}