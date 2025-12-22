'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BetaBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('betaBannerDismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('betaBannerDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="relative bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <Sparkles className="h-5 w-5 flex-shrink-0 animate-pulse" />
                        <p className="text-sm md:text-base font-medium">
                            <span className="font-bold">BETA VERSION:</span> You're experiencing MarketBridge early! 
                            <span className="hidden sm:inline"> The full version with enhanced features launches soon.</span>
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDismiss}
                        className="h-8 w-8 flex-shrink-0 hover:bg-primary-foreground/20"
                        aria-label="Dismiss banner"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
