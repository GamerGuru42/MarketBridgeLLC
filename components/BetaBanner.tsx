'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BetaBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Changed key to ensure users see this new specific message
        const dismissed = localStorage.getItem('simulationModeDismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('simulationModeDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="relative bg-[#FFB800] text-black border-b border-[#FFD700]">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="h-6 w-6 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 animate-pulse text-black" />
                        </div>
                        <p className="text-xs md:text-sm font-bold uppercase tracking-wide font-heading">
                            <span className="bg-black text-[#FFB800] px-2 py-0.5 rounded mr-2">PROTOCOL TESTNET</span>
                            Listings are currently <span className="italic">samples</span> for demonstration. Real dealer inventory initiates at MVP Launch.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDismiss}
                        className="h-8 w-8 flex-shrink-0 hover:bg-black/10 text-black"
                        aria-label="Dismiss banner"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
