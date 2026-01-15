'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('System Failure:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
            <div className="max-w-md w-full space-y-8 text-center bg-slate-900 border border-red-500/20 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>

                <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 mb-6">
                    <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Critical System Error</h1>
                    <p className="text-slate-400 font-mono text-sm leading-relaxed">
                        A foundational script has encountered an unhandled exception. The secure connection has been throttled.
                    </p>
                </div>

                {error.digest && (
                    <div className="bg-black/40 rounded-lg p-3 mt-4">
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Error Digest</p>
                        <p className="text-xs font-mono text-red-400">{error.digest}</p>
                    </div>
                )}

                <div className="pt-8 flex flex-col gap-3">
                    <Button
                        onClick={() => reset()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold italic tracking-widest h-12"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        REBOOT SYSTEM
                    </Button>

                    <Button variant="ghost" asChild className="text-slate-400 hover:text-white">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            ABANDON TERMINAL
                        </Link>
                    </Button>
                </div>

                <p className="pt-6 text-[10px] text-slate-600 uppercase font-bold tracking-widest italic">
                    MarketBridge Secure Layer x86_64
                </p>
            </div>
        </div>
    );
}
