'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Expanded list of supported hubs with "Physical" alignment
const SUPPORTED_LOCATIONS = [
    { name: 'FCT - Abuja', state: 'Federal Capital Territory', health: 'Peak', hub: true },
    { name: 'Lagos', state: 'Lagos', health: 'High', hub: false },
    { name: 'Rivers', state: 'Rivers', health: 'Mid', hub: false },
    { name: 'Kano', state: 'Kano', health: 'Mid', hub: false },
    { name: 'Oyo', state: 'Oyo', health: 'Active', hub: false },
    { name: 'Enugu', state: 'Enugu', health: 'Active', hub: false },
    { name: 'Edo', state: 'Edo', health: 'Stable', hub: false },
    { name: 'Kaduna', state: 'Kaduna', health: 'Stable', hub: false }
];

interface LocationCheckerProps {
    children: React.ReactNode;
}

export function LocationChecker({ children }: LocationCheckerProps) {
    const [userLocation, setUserLocation] = useState<string | null>(null);
    const [isLocationSupported, setIsLocationSupported] = useState<boolean>(true);
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Force re-check if user explicitly requests it or if it's the first time
        const savedLocation = localStorage.getItem('mb-preferred-node');
        const sessionChecked = sessionStorage.getItem('mb-location-checked');

        if (savedLocation && sessionChecked) {
            setLoading(false);
            return;
        }

        checkLocation();
    }, []);

    const checkLocation = async () => {
        try {
            setLoading(true);

            // Strategy 1: Browser Geolocation (Highly Precise)
            if ("geolocation" in navigator) {
                const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                };

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                            const geoData = await geoResponse.json();

                            // Extract intelligence from multiple layers
                            const locationInfo = {
                                city: geoData.city,
                                locality: geoData.locality,
                                state: geoData.principalSubdivision,
                                country: geoData.countryName
                            };

                            processLocationIntelligence(locationInfo);
                        } catch (e) {
                            fallbackToIp();
                        }
                    },
                    (error) => {
                        console.warn("Geolocation denied/failed, falling back to IP", error.message);
                        fallbackToIp();
                    },
                    options
                );
            } else {
                fallbackToIp();
            }
        } catch (error) {
            console.error("Critical Location Exception", error);
            setIsLocationSupported(true);
            setLoading(false);
        }
    };

    const fallbackToIp = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            processLocationIntelligence({
                city: data.city,
                state: data.region,
                country: data.country_name
            });
        } catch (error) {
            console.error("IP Fallback failed", error);
            setIsLocationSupported(true);
            setLoading(false);
        }
    };

    const [notifyForm, setNotifyForm] = useState({ email: '', state: '' });
    const [notified, setNotified] = useState(false);

    const processLocationIntelligence = (info: any) => {
        const { city, locality, state, country } = info;
        const fullString = `${city || ''} ${locality || ''} ${state || ''}`.toLowerCase();

        // Strict Abuja Pilot Logic
        const isAbuja = fullString.includes('abuja') || fullString.includes('federal capital territory');
        const displayName = city || locality || state || 'Unknown Node';
        setUserLocation(displayName);
        sessionStorage.setItem('mb-location-checked', 'true');

        if (isAbuja) {
            setIsLocationSupported(true);
            localStorage.setItem('mb-preferred-node', 'FCT - Abuja');
            setShowDialog(false);
        } else {
            setIsLocationSupported(false);
            const currentPref = localStorage.getItem('mb-preferred-node');
            if (!currentPref) {
                localStorage.setItem('mb-preferred-node', 'global');
            }
            // For the pilot, we show a non-blocking dialog/banner if they aren't in Abuja
            setShowDialog(true);
        }
        setLoading(false);
    };

    const handleNotifyMe = async (e: React.FormEvent) => {
        e.preventDefault();
        // Send to admin (simulated for MVP)
        console.log("Notify Me Request:", notifyForm);
        setNotified(true);
        setTimeout(() => setShowDialog(false), 2000);
    };

    const handleBrowseAnyway = (node = 'global') => {
        localStorage.setItem('mb-preferred-node', node);
        setShowDialog(false);
    };

    const handleTeleportToHub = (targetHub = 'Abuja') => {
        localStorage.setItem('mb-preferred-node', targetHub);
        setShowDialog(false);
        window.location.reload(); // Refresh to update node context globally
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-t-2 border-[#FFB800] animate-spin" />
                        <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#FFB800]" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-1 w-32 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FFB800] animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Syncing Node...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md bg-black border border-white/5 text-white rounded-[2.5rem] p-10 overflow-hidden shadow-[0_0_150px_rgba(255,184,0,0.15)]">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent" />

                    <DialogHeader>
                        <div className="mx-auto h-20 w-20 rounded-full bg-[#FFB800]/10 flex items-center justify-center mb-6 border border-[#FFB800]/20 relative">
                            <MapPin className="h-8 w-8 text-[#FFB800]" />
                            <div className="absolute inset-0 rounded-full border border-[#FFB800] animate-ping opacity-20" />
                        </div>
                        <DialogTitle className="text-center text-3xl font-black uppercase italic tracking-tighter leading-none">
                            Bridge <span className="text-[#FFB800]">Pilot</span> Active
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-4 font-medium leading-relaxed">
                            MarketBridge is currently live in <span className="text-white font-bold">Abuja (FCT)</span>.
                            We detected your signal in <span className="text-white font-bold uppercase">{userLocation || 'Unknown Sector'}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    {!notified ? (
                        <div className="flex flex-col gap-6 py-6">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] text-center">Get notified on launch</p>
                                <form onSubmit={handleNotifyMe} className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="STUDENT EMAIL"
                                        required
                                        className="w-full h-12 bg-black border border-white/10 rounded-xl px-4 text-[10px] font-bold uppercase focus:border-[#FFB800] outline-none transition-colors"
                                        value={notifyForm.email}
                                        onChange={(e) => setNotifyForm({ ...notifyForm, email: e.target.value })}
                                    />
                                    <select
                                        required
                                        className="w-full h-12 bg-black border border-white/10 rounded-xl px-4 text-[10px] font-bold uppercase focus:border-[#FFB800] outline-none transition-colors appearance-none"
                                        value={notifyForm.state}
                                        onChange={(e) => setNotifyForm({ ...notifyForm, state: e.target.value })}
                                    >
                                        <option value="">SELECT YOUR STATE</option>
                                        <option value="Lagos">LAGOS HUB</option>
                                        <option value="Rivers">RIVERS HUB</option>
                                        <option value="Oyo">OYO HUB</option>
                                        <option value="Enugu">ENUGU HUB</option>
                                        <option value="Kano">KANO HUB</option>
                                    </select>
                                    <Button type="submit" className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">
                                        Monitor Sector
                                    </Button>
                                </form>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => handleTeleportToHub('FCT - Abuja')}
                                    className="w-full h-16 bg-[#FFB800] text-black hover:bg-[#FFD700] font-black uppercase tracking-[0.1em] rounded-2xl shadow-[0_10px_30px_rgba(255,184,0,0.2)] group"
                                >
                                    Teleport to Abuja
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button
                                    onClick={() => handleBrowseAnyway()}
                                    variant="outline"
                                    className="w-full h-14 border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] rounded-2xl"
                                >
                                    I'm just browsing
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                            <div className="h-16 w-16 rounded-full bg-[#00FF85]/10 flex items-center justify-center border border-[#00FF85]/20">
                                <CheckCircle className="h-8 w-8 text-[#00FF85]" />
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
