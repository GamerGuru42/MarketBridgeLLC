'use client';

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LocationConsentModal } from '@/components/LocationConsentModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, sessionUser, loading } = useAuth();
    
    const isDashboard = pathname?.startsWith('/dealer') || pathname?.startsWith('/settings');
    const isHome = pathname === '/';

    useEffect(() => {
        if (!loading && user) {
            // Social login users (Google/Facebook) are considered pre-verified or will be updated by the callback upsert.
            // Only redirect manual email signups to the verify-email page.
            const isSocialLogin = sessionUser?.app_metadata?.provider !== 'email';
            
    // Allow temporary sellers to bypass email verification gate
            const isTemp = (user as any).is_temporary_seller === true;
            if (['student_buyer', 'student_seller'].includes(user.role) && !user.email_verified && !isSocialLogin && !isTemp) {
                router.push('/verify-email');
            }
        }
    }, [user, loading, router, sessionUser, pathname]);

    return (
        <div className="flex flex-col min-h-screen">
            <LocationConsentModal />
            {!isDashboard && !isHome && (
                <div className="bg-[#FF6200] text-black px-4 py-1.5 flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap">
                    <Zap className="h-3 w-3 fill-current animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">
                        MarketBridge Campus Beta – Testing Phase (Nigeria 2026)
                    </span>
                </div>
            )}
            
            {user && (user as any).is_temporary_seller && !user.email_verified && (
                <div className="bg-yellow-500 text-black px-4 py-2 flex items-center justify-center gap-2 z-50 overflow-hidden relative border-b border-yellow-600 shadow-sm">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] text-center z-10 leading-tight">
                        Your account is temporarily active for 48 hours. Please complete verification or contact support.
                    </span>
                </div>
            )}

            {!isDashboard && <Header />}
            <main className={`flex-1 pt-16 ${!isDashboard ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
            {!isDashboard && <Footer />}
            {!isDashboard && <MobileBottomNav />}
            <FeedbackModal />
        </div>
    );
}
