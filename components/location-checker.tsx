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

// Expanded list of supported cities/locations with "Health" status
const SUPPORTED_LOCATIONS = [
    { name: 'Abuja', health: 'Peak', hub: true },
    { name: 'Lagos', health: 'High', hub: false },
    { name: 'Port Harcourt', health: 'Mid', hub: false },
    { name: 'Kano', health: 'Mid', hub: false },
    { name: 'Ibadan', health: 'Active', hub: false },
    { name: 'Enugu', health: 'Active', hub: false },
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
        // Check if user has already acknowledged or selected a hub
        const savedLocation = localStorage.getItem('mb-preferred-node');
        if (savedLocation) {
            setLoading(false);
            return;
        }

        checkLocation();
    }, []);

    const checkLocation = async () => {
        try {
            setLoading(true);

            // Strategy 1: Browser Geolocation (Actual Device)
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            // Reverse Geocode using a free service (bigdatacloud is usually free for client-side)
                            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                            const geoData = await geoResponse.json();
                            const city = geoData.city || geoData.locality || geoData.principalSubdivision;
                            processLocationResult(city);
                        } catch (e) {
                            fallbackToIp();
                        }
                    },
                    () => fallbackToIp(), // Permission denied or error
                    { timeout: 5000 }
                );
            } else {
                fallbackToIp();
            }
        } catch (error) {
            console.error("Location check failed", error);
            setIsLocationSupported(true);
            setLoading(false);
        }
    };

    const fallbackToIp = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            processLocationResult(data.city);
        } catch (error) {
            setIsLocationSupported(true);
            setLoading(false);
        }
    };

    const processLocationResult = (city: string) => {
        if (!city) {
            setIsLocationSupported(true);
            setLoading(false);
            return;
        }

        setUserLocation(city);
        const supported = SUPPORTED_LOCATIONS.some(loc =>
            city.toLowerCase().includes(loc.name.toLowerCase()) ||
            loc.name.toLowerCase().includes(city.toLowerCase())
        );

        setIsLocationSupported(supported);
        if (!supported) {
            setShowDialog(true);
        }
        setLoading(false);
    };

    const handleBrowseAnyway = () => {
        localStorage.setItem('mb-preferred-node', 'global');
        setShowDialog(false);
    };

    const handleTeleportToHub = (targetHub = 'Abuja') => {
        localStorage.setItem('mb-preferred-node', targetHub);
        setShowDialog(false);
        // In a real app, this might trigger a redirect or a state update in a LocationContext
        // window.location.href = `/listings?location=${targetHub}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-1 w-32 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFB800] animate-progress-loading" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">Syncing Local Node...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md bg-black border-white/5 text-white rounded-[2rem] p-8 overflow-hidden shadow-[0_0_100px_rgba(255,184,0,0.1)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFB800]/50 to-transparent" />

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
                            onClick={handleBrowseAnyway}
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
