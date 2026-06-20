'use client';

import React from 'react';

export default function ClosedPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center p-6 text-center">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#FF6200] mb-4">
                MarketBridge is Closed
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-lg">
                We are currently undergoing maintenance and upgrades. Check back soon!
            </p>
        </div>
    );
}

