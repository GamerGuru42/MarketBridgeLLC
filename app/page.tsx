'use client';

import React from 'react';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/landing/HeroSection';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { Footer } from '@/components/footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LocationConsentModal } from '@/components/LocationConsentModal';
import { Zap } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen bg-black">
            {/* Global Overlays */}
            <LocationConsentModal />

            {/* Top Announcement Bar */}
            <div className="bg-[#FF6200] text-black px-4 py-1.5 flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap z-[110] relative">
                <Zap className="h-3 w-3 fill-current animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">
                    MarketBridge Campus Beta – Testing Phase (Nigeria 2026)
                </span>
            </div>

            {/* Main Header */}
            <Header />

            {/* Scrollable Content */}
            <main className="flex-1 pb-16 md:pb-0">
                <HeroSection />
                <CategoryGrid />

                {/* Additional sections can go here (e.g., Featured Listings, Testimonials) */}
            </main>

            {/* Main Footer */}
            <Footer />

            {/* Mobile Navigation */}
            <MobileBottomNav />
        </div>
    );
}
