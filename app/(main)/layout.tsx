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
import { useEffect } from 'react';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    
    const isDashboard = pathname?.startsWith('/dealer') || pathname?.startsWith('/settings');
    const isHome = pathname === '/';

    useEffect(() => {
        if (!loading && user) {
            if (['student_buyer', 'student_seller'].includes(user.role) && !user.email_verified) {
                router.push('/verify-email');
            }
        }
    }, [user, loading, router]);

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
            {!isDashboard && <Header />}
            <main className={`flex-1 pt-16 ${!isDashboard ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
            {!isDashboard && <Footer />}
            {!isDashboard && <MobileBottomNav />}
            <FeedbackModal />
        </div>
    );
}
