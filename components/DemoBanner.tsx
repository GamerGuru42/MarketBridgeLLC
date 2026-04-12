'use client';

import React from 'react';
import { useSystem } from '@/contexts/SystemContext';
import { AlertCircle } from 'lucide-react';

export function DemoBanner() {
    const { isDemoMode, daysLeft, isExpired } = useSystem();

    if (!isDemoMode || isExpired) return null;

    return (
        <div className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 flex items-center justify-center text-center shadow-md relative z-[100]">
            <div className="flex items-center gap-2 max-w-7xl mx-auto flex-wrap justify-center">
                <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-tight">
                    🚀 DEMO MODE – 1 Month Private Beta | <span className="opacity-80">For testing only</span> | <span className="opacity-80">No real money used</span> | Expires in <span className="text-yellow-300 font-mono text-sm">{daysLeft}</span> days
                </p>
            </div>
        </div>
    );
}
