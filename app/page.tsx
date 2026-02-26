'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, MapPin, Loader2 } from 'lucide-react';

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [requestingLocation, setRequestingLocation] = useState(false);

    // Auto-redirect if logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/listings');
        }
    }, [user, authLoading, router]);

    const handleEnterCampus = () => {
        setRequestingLocation(true);
        // Location Intelligence implementation
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success case (could save to context/storage)
                    sessionStorage.setItem('campus_location_lat', position.coords.latitude.toString());
                    sessionStorage.setItem('campus_location_lon', position.coords.longitude.toString());
                    router.push('/listings');
                },
                (error) => {
                    // Fallback to manual selection or just proceed
                    console.warn('Location access denied or failed:', error);
                    router.push('/listings');
                },
                { timeout: 10000 }
            );
        } else {
            router.push('/listings');
        }
    };

    if (authLoading || (user && !authLoading)) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[#FF6200] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FF6200] selection:text-white">
            {/* Minimal Header */}
            <header className="w-full p-6 flex justify-center md:justify-start border-b border-white/10">
                <div className="text-2xl font-black italic tracking-widest text-[#FF6200] uppercase">
                    MarketBridge
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
                {/* Background aesthetic */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6200]/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-12">

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight text-[#FF6200] bg-black inline-block p-2">
                        MarketBridge<br />Campus Marketplace
                    </h1>

                    {/* Prominent Entry Card */}
                    <div className="w-full bg-[#000000] border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center gap-6 hover:border-[#FF6200]/50 transition-colors duration-500">
                        <div className="h-20 w-20 rounded-full bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/30">
                            <GraduationCap className="h-10 w-10 text-[#FF6200]" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Enter Campus Marketplace</h2>
                            <p className="text-zinc-400 max-w-md mx-auto">
                                Buy & sell safely with verified student sellers in Abuja universities
                            </p>
                        </div>

                        <button
                            onClick={handleEnterCampus}
                            disabled={requestingLocation}
                            className="w-full md:w-auto mt-4 bg-[#FF6200] hover:bg-[#ff7a29] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {requestingLocation ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Locating...</>
                            ) : (
                                <>ENTER CAMPUS <MapPin className="h-5 w-5" /></>
                            )}
                        </button>
                    </div>

                    {/* Beta Label */}
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 border border-zinc-800 px-4 py-2 rounded-full">
                        MarketBridge Campus Beta – Testing Phase
                    </div>

                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="w-full p-6 border-t border-white/10 bg-[#000000] text-center flex flex-col md:flex-row items-center justify-center gap-4 text-xs">
                <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:underline font-bold transition-all">
                    Tech Support: support@marketbridge.com.ng
                </a>
                <span className="hidden md:inline text-zinc-700">|</span>
                <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:underline font-bold transition-all">
                    Ops Support: ops-support@marketbridge.com.ng
                </a>
            </footer>
        </div>
    );
}
