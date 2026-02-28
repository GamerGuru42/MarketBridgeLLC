'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console
        console.error('Global Error Boundary caught:', error);
        // Placeholder for Sentry or LogRocket integration
        // Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
            <h2 className="text-2xl md:text-3xl font-black uppercase text-[#FF6200] mb-4 text-center">
                Something went wrong
            </h2>
            <p className="text-zinc-400 text-center mb-8 max-w-md">
                We encountered an unexpected error. Please refresh the page or contact support@marketbridge.com.ng if the issue persists.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-[#FF6200] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-[#ff7a29] transition-all"
                >
                    Refresh
                </button>
                <a
                    href="/"
                    className="px-6 py-3 bg-white/10 text-white font-bold uppercase tracking-widest text-sm rounded-xl border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                >
                    Home
                </a>
            </div>
        </div>
    );
}
