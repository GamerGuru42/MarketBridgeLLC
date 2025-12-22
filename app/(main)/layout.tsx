import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BetaBanner } from '@/components/BetaBanner';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <BetaBanner />
            <Header />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
        </>
    );
}
