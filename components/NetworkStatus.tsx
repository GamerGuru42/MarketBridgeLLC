'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
    const isOnline = useNetworkStatus();

    if (isOnline) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[100] bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
            <WifiOff className="h-5 w-5" />
            <div className="flex flex-col">
                <span className="font-black uppercase tracking-widest text-xs">Connection Lost</span>
                <span className="text-[10px] opacity-80 font-medium">Please check your internet connection</span>
            </div>
        </div>
    );
}
