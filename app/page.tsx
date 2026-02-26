'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { HeroSection } from '@/components/landing/HeroSection';

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Auto-redirect if logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[#FF6200] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FF6200] selection:text-white">
            <header className="w-full p-6 flex justify-between items-center z-50 absolute top-0 left-0 right-0">
                <div className="text-2xl font-black italic tracking-widest text-[#FF6200] uppercase">
                    MarketBridge
                </div>
                {/* Minimal top nav if needed, or leave clean */}
            </header>

            <main className="flex-1 w-full flex flex-col items-center">
                <HeroSection />
            </main>

            <footer className="w-full p-6 border-t border-white/10 bg-[#000000] text-center flex flex-col md:flex-row items-center justify-center gap-4 text-xs z-50">
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
