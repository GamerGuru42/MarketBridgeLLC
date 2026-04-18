'use client';

import React, { useState } from 'react';
import { MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useLocation } from '@/contexts/LocationContext';
import { ABUJA_UNIVERSITIES } from '@/lib/location';

interface LocationCheckerProps {
    children: React.ReactNode;
}

export function LocationChecker({ children }: LocationCheckerProps) {
    const {
        isAbuja,
        loading,
        city,
        region,
        showDialog,
        setShowDialog,
        setManualLocation
    } = useLocation();
    const [notifyForm, setNotifyForm] = useState({ email: '', state: '' });
    const [notified, setNotified] = useState(false);

    const handleNotifyMe = async (e: React.FormEvent) => {
        e.preventDefault();
        // Send to admin
        console.log("Notify Me Request:", notifyForm);
        setNotified(true);
        setTimeout(() => setShowDialog(false), 2000);
    };

    const handleGoToMarket = () => {
        const defaultUni = ABUJA_UNIVERSITIES[0];
        setManualLocation(defaultUni);
    };

    const handleBrowseAnyway = () => {
        setManualLocation('global');
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-t-2 border-[#FF6200] animate-spin" />
                        <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#FF6200]" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-1 w-32 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF6200] animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Checking Location...</span>
                    </div>
                </div>
            </div>
        );
    }

    const userLocation = city ? `${city}, ${region}` : (region || 'Unknown Area');

    return (
        <>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md bg-black border border-white/5 text-white rounded-[2.5rem] p-10 overflow-hidden shadow-[0_0_150px_rgba(255,184,0,0.15)]">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF6200] to-transparent" />
                    <DialogHeader>
                        <div className="mx-auto h-20 w-20 rounded-full bg-[#FF6200]/10 flex items-center justify-center mb-6 border border-[#FF6200]/20 relative">
                            <MapPin className="h-8 w-8 text-[#FF6200]" />
                            <div className="absolute inset-0 rounded-full border border-[#FF6200] animate-ping opacity-20" />
                        </div>
                        <DialogTitle className="text-center text-3xl font-black uppercase italic tracking-tighter leading-none">
                            Location <span className="text-[#FF6200]">Verification</span>
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-4 font-medium leading-relaxed">
                            MarketBridge is currently live in <span className="text-white font-bold">Abuja (FCT)</span>.
                            We detected your location in <span className="text-white font-bold uppercase">{userLocation}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    {!notified ? (
                        <div className="flex flex-col gap-6 py-6">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] text-center">Get notified on launch</p>
                                <form onSubmit={handleNotifyMe} className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="STUDENT EMAIL"
                                        required
                                        className="w-full h-12 bg-black border border-white/10 rounded-xl px-4 text-[10px] font-bold uppercase focus:border-[#FF6200] outline-none transition-colors"
                                        value={notifyForm.email}
                                        onChange={(e) => setNotifyForm({ ...notifyForm, email: e.target.value })}
                                    />
                                    <select
                                        required
                                        className="w-full h-12 bg-black border border-white/10 rounded-xl px-4 text-[10px] font-bold uppercase focus:border-[#FF6200] outline-none transition-colors appearance-none text-zinc-400"
                                        value={notifyForm.state}
                                        onChange={(e) => setNotifyForm({ ...notifyForm, state: e.target.value })}
                                    >
                                        <option value="">SELECT YOUR STATE</option>
                                        <option value="Lagos">LAGOS MARKET</option>
                                        <option value="Rivers">RIVERS MARKET</option>
                                        <option value="Oyo">OYO MARKET</option>
                                        <option value="Enugu">ENUGU MARKET</option>
                                        <option value="Kano">KANO MARKET</option>
                                    </select>
                                    <Button type="submit" className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">
                                        Notify Me
                                    </Button>
                                </form>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleGoToMarket}
                                    className="w-full h-16 bg-[#FF6200] text-black hover:bg-[#FF6200] font-black uppercase tracking-[0.1em] rounded-2xl shadow-[0_10px_30px_rgba(255,184,0,0.2)] group"
                                >
                                    Switch to Abuja
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button
                                    onClick={handleBrowseAnyway}
                                    variant="outline"
                                    className="w-full h-14 border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] rounded-2xl"
                                >
                                    I'm just browsing
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                            <div className="h-16 w-16 rounded-full bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20">
                                <CheckCircle className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <p className="text-center font-black uppercase tracking-widest text-[10px]">Signal Locked. We will contact you.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {children}
        </>
    );
}