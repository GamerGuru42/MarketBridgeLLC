'use client';

import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, Ghost } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black font-sans relative overflow-hidden selection:bg-[#FF6200] selection:text-black">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6200]/5 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] opacity-10" />
            </div>

            <div className="max-w-md w-full text-center space-y-10 relative z-10">
                {/* Visual Icon */}
                <div className="relative mx-auto h-44 w-44 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-[#FF6200]/5 rounded-full animate-pulse group-hover:bg-[#FF6200]/10 transition-all duration-700"></div>
                    <div className="absolute inset-0 border border-white/5 rounded-full scale-110 group-hover:scale-125 transition-all duration-700"></div>
                    <div className="relative h-32 w-32 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                        <Ghost className="h-14 w-14 text-[#FF6200]" />
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-9xl font-black tracking-tighter text-white leading-none">
                        404
                    </h1>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-[#FF6200] italic">
                            Page Not Found
                        </h2>
                        <p className="text-white/40 text-sm max-w-[280px] mx-auto leading-relaxed border-l border-[#FF6200] pl-6 text-left">
                            The destination you are trying to reach does not exist or has been moved to a new location.
                        </p>
                    </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (window.history.length > 2) {
                                router.back();
                            } else {
                                router.push('/');
                            }
                        }}
                        className="h-16 font-black uppercase tracking-widest text-[10px] border border-white/10 text-white hover:bg-white hover:text-black transition-all rounded-2xl"
                    >
                        <ArrowLeft className="mr-3 h-4 w-4" />
                        GO BACK
                    </Button>
                    <Button
                        onClick={() => {
                            // Use a relative path or a known secure route
                            router.push('/login'); // Login page will auto-redirect based on session/role
                        }}
                        className="h-16 font-black uppercase tracking-widest text-[10px] bg-[#FF6200] text-black hover:bg-white transition-all rounded-2xl shadow-[0_10px_40px_rgba(255,98,0,0.15)]"
                    >
                        <Home className="mr-3 h-4 w-4" />
                        DASHBOARD
                    </Button>
                </div>

                <div className="pt-16 flex justify-center opacity-30">
                    <p className="text-[8px] text-white uppercase font-black tracking-[0.4em] flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200]" />
                        MarketBridge Network v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
