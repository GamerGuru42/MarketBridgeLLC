'use client';

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dealer') || pathname?.startsWith('/settings');
    // Homepage manages its own minimal header/footer
    const isHome = pathname === '/';

    return (
        <>
            {!isDashboard && !isHome && <Header />}
            <main className={`flex-1 ${!isDashboard && !isHome ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
            {!isDashboard && !isHome && <Footer />}
            {!isDashboard && !isHome && <MobileBottomNav />}
        </>
    );
}
