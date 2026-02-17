'use client';

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BetaBanner } from '@/components/BetaBanner';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dealer') || pathname?.startsWith('/settings');

    return (
        <>
            {!isDashboard && <BetaBanner />}
            {!isDashboard && <Header />}
            <main className={`flex-1 ${!isDashboard ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
            {!isDashboard && <Footer />}
            {!isDashboard && <MobileBottomNav />}
        </>
    );
}
