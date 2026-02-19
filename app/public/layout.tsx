'use client';

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
            <Header />
            <main className="pt-20">
                {children}
            </main>
            <Footer />
        </div>
    );
}
