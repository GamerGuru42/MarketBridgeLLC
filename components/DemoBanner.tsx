'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSystem } from '@/contexts/SystemContext';

export function DemoBanner() {
    const pathname = usePathname();
    const { isDemoMode, daysLeft, isExpired } = useSystem();

    const isAdminPath = pathname?.startsWith('/admin') || pathname?.startsWith('/portal') || pathname?.startsWith('/terminal');

    if (!isDemoMode || isExpired || isAdminPath) return null;

    return (
        <div className="w-full bg-[#FF6200] text-black px-4 py-2 flex items-center justify-center text-center shadow-lg relative z-[100] border-b border-black/5">
            <div className="flex items-center gap-4 max-w-7xl mx-auto flex-wrap justify-center text-black">
                <div className="flex items-center gap-2">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">MarketBridge Abuja is currently in Beta Testing mode (April 20 - May 20).</p>
                </div>
                <div className="h-5 w-px bg-black/10 hidden sm:block" />
                <p className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-3">
                    <span>Real transactions are disabled.</span>
                    <span className="opacity-30">•</span>
                    <span>Ends in <span className="font-black text-xs">{daysLeft}D</span></span>
                </p>
            </div>
        </div>
    );
}
