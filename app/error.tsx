'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white font-sans selection:bg-[#FF6200] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />

            <div className="max-w-md w-full space-y-8 text-center bg-zinc-950/40 backdrop-blur-xl border border-white/10 p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-gradient" />

                <div className="mx-auto h-24 w-24 rounded-3xl bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20 mb-8 group-hover:scale-110 transition-transform duration-500">
                    <ShieldAlert className="h-12 w-12 text-[#FF6200]" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                        Experience <span className="text-[#FF6200]">Interrupted</span>
                    </h1>
                    <p className="text-white/60 font-medium leading-relaxed">
                        We've encountered a temporary technical issue. Please refresh the page or return to the main hub.
                    </p>
                </div>

                {error.digest && (
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200]/40 mb-1 italic">Reference ID</p>
                        <p className="text-xs font-mono text-white/40">{error.digest}</p>
                    </div>
                )}

                <div className="pt-10 flex flex-col gap-4">
                    <Button
                        onClick={() => reset()}
                        className="bg-[#FF6200] hover:bg-white text-black font-black uppercase tracking-widest h-16 rounded-2xl transition-all shadow-[0_10px_30px_rgba(255,98,0,0.2)]"
                    >
                        <RefreshCcw className="mr-3 h-5 w-5" />
                        RELOAD PAGE
                    </Button>

                    <Button variant="ghost" asChild className="text-white/40 hover:text-white h-14 font-black uppercase tracking-widest">
                        <Link href="/">
                            <Home className="mr-3 h-4 w-4" />
                            RETURN HOME
                        </Link>
                    </Button>
                </div>

                <div className="pt-8 flex items-center justify-center gap-4">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <p className="text-[8px] text-white/20 uppercase font-black tracking-[0.4em] italic">
                        MarketBridge Security v2.0
                    </p>
                    <div className="h-[1px] flex-1 bg-white/5" />
                </div>
            </div>
        </div>
    );
}
