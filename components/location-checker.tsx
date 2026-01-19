'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Expanded list of supported cities/locations
const SUPPORTED_LOCATIONS = [
    'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Benin City', 'Kaduna'
];

interface LocationCheckerProps {
    children: React.ReactNode;
}

export function LocationChecker({ children }: LocationCheckerProps) {
    const [userLocation, setUserLocation] = useState<string | null>(null);
    const [isLocationSupported, setIsLocationSupported] = useState<boolean>(true); // Default to true while checking
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Attempt to get user location via IP API first (more reliable for "city" level than GPS sometimes without permission)
        // Or try Geolocation API
        checkLocation();
    }, []);

    const checkLocation = async () => {
        try {
            setLoading(true);
            // Using a free IP geolocation service (e.g., ipapi.co)
            // In production, you might want to use a more robust service or edge middleware
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            if (data.city) {
                setUserLocation(data.city);
                // loose check
                const isSupported = SUPPORTED_LOCATIONS.some(loc =>
                    data.city.toLowerCase().includes(loc.toLowerCase()) ||
                    loc.toLowerCase().includes(data.city.toLowerCase())
                );

                setIsLocationSupported(isSupported);
                if (!isSupported) {
                    setShowDialog(true);
                }
            } else {
                // Fallback: unable to detect, assume supported or prompt manually?
                // For UX, we'll assume supported so we don't block them unnecessarily
                setIsLocationSupported(true);
            }
        } catch (error) {
            console.error("Location check failed", error);
            setIsLocationSupported(true); // Fail gracefully
        } finally {
            setLoading(false);
        }
    };

    const handleBrowseAnyway = () => {
        setShowDialog(false);
    };

    const handleViewSupportedCities = () => {
        // Logic to filter view or redirect could go here
        // For now, we just close dialog and let them browse, but maybe with a filter preset?
        setShowDialog(false);
        // Ideally, you might redirect to a "Select Location" page or filter the listings to a popular city like Lagos
        // window.location.href = '/listings?location=Lagos'; 
    };

    if (loading) {
        return <>{children}</>; // Or a subtle loading state if critical
    }

    // If location is NOT supported, we want to show the content BUT maybe obscured? 
    // User asked: "it should show nothing in lagos or it should be empty... but it should tell the user... to browse niches in other locations"

    // Implementation: We show the dialog overlay. If they choose to browse anyway, they see the content.
    // Or we could return a placeholder "Empty State" component instead of children if hard-blocking is desired.
    // The user said: "give the user an option that will show like this or better: check the host city..."

    return (
        <>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md bg-black border-white/10 text-white">
                    <DialogHeader>
                        <div className="mx-auto h-12 w-12 rounded-full bg-[#FFB800]/20 flex items-center justify-center mb-4">
                            <MapPin className="h-6 w-6 text-[#FFB800]" />
                        </div>
                        <DialogTitle className="text-center text-xl font-black uppercase italic tracking-tighter">
                            Location Signal Weak
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-2">
                            It seems you are in <span className="text-white font-bold">{userLocation}</span>.
                            MarketBridge is currently not fully active in your node.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        <p className="text-center text-xs text-zinc-400">
                            However, high-frequency trading is active in these major hubs:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {SUPPORTED_LOCATIONS.slice(0, 5).map(city => (
                                <span key={city} className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                    {city}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleViewSupportedCities}
                            className="w-full bg-[#FFB800] text-black hover:bg-[#FFD700] font-black uppercase tracking-widest"
                        >
                            Teleport to Main Hub (Lagos)
                        </Button>
                        <Button
                            onClick={handleBrowseAnyway}
                            variant="outline"
                            className="w-full border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                        >
                            Explore Global Grid Anyway
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 
        If we strictly wanted to show "nothing", we would render null here if showDialog is true.
        But checking user requirements: "give the user an option... check host city... or browse niches in other locations"
        So rendering children (the app) underneath the dialog allows them to continue after acknowledgement.
      */}
            {children}
        </>
    );
}
