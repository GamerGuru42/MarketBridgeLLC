'use client';

import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center bg-black text-white w-full">
            <Loader2 className="h-12 w-12 animate-spin text-[#FF6200] mb-4" />
            <p className="text-[#FF6200] text-xs font-black uppercase tracking-[0.2em] animate-pulse">Loading MarketBridge...</p>
        </div>
    );
}
