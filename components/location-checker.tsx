'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Globe, ArrowRight } from 'lucide-react';
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
    { name: 'Abuja', state: 'Federal Capital Territory', health: 'Peak', hub: true },
    { name: 'Lagos', state: 'Lagos', health: 'High', hub: false },
    { name: 'Port Harcourt', state: 'Rivers', health: 'Mid', hub: false },
    { name: 'Kano', state: 'Kano', health: 'Mid', hub: false },
    { name: 'Ibadan', state: 'Oyo', health: 'Active', hub: false },
    { name: 'Enugu', state: 'Enugu', health: 'Active', hub: false },
    { name: 'Benin City', health: 'Stable', hub: false },
    { name: 'Kaduna', health: 'Stable', hub: false }
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

    const processLocationIntelligence = (info: any) => {
        const { city, locality, state, country } = info;

        // Comprehensive string for matching
        const fullString = `${city || ''} ${locality || ''} ${state || ''}`.toLowerCase();

        // Smart matching logic: check for Hub name OR Hub state
        const matchedHub = SUPPORTED_LOCATIONS.find(loc =>
            fullString.includes(loc.name.toLowerCase()) ||
            (loc.state && fullString.includes(loc.state.toLowerCase()))
        );

        const displayName = city || locality || state || 'Unknown Node';
        setUserLocation(displayName);
        sessionStorage.setItem('mb-location-checked', 'true');

        if (matchedHub) {
            setIsLocationSupported(true);
            localStorage.setItem('mb-preferred-node', matchedHub.name);
            setShowDialog(false);
        } else {
            // Check if they are in Nigeria at least
            const isNigeria = country === 'Nigeria' || fullString.includes('nigeria');

            setIsLocationSupported(false);
            // If they are in Nigeria but a non-supported city (like Ede), show dialog
            // If they are already in a preferred node, don't nag them
            const currentPref = localStorage.getItem('mb-preferred-node');
            if (!currentPref || currentPref === 'global') {
                setShowDialog(true);
            }
        }
        setLoading(false);
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
                            Location Signal <span className="text-[#FFB800]">Weak</span>
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-4 font-medium leading-relaxed">
                            MarketBridge detected your signal in <span className="text-white font-bold">{userLocation || 'Unknown Sector'}</span>.
                            Our high-frequency trading infrastructure is not yet fully optimized for your current node.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Active High-Growth Hubs</span>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {SUPPORTED_LOCATIONS.slice(0, 4).map(loc => (
                                <div key={loc.name} className="flex justify-between items-center px-4 py-3 bg-white/5 border border-white/5 rounded-xl group hover:border-[#FFB800]/30 transition-all">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">{loc.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${loc.health === 'Peak' ? 'bg-[#00FF85]' : 'bg-[#FFB800]'} animate-pulse`} />
                                        <span className="text-[8px] font-bold text-zinc-600 uppercase italic">{loc.health}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => handleTeleportToHub('Abuja')}
                            className="w-full h-16 bg-[#FFB800] text-black hover:bg-[#FFD700] font-black uppercase tracking-[0.1em] rounded-2xl shadow-[0_10px_30px_rgba(255,184,0,0.2)] group"
                        >
                            Teleport to Main Hub (Abuja)
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            onClick={() => handleBrowseAnyway()}
                            variant="outline"
                            className="w-full h-14 border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] rounded-2xl"
                        >
                            Explore Global Grid Anyway
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {children}
        </>
    );
}
