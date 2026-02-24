'use client';

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function PublicLayout({
    children,
}: {
    children: React.ReactCampus;
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FF6200] selection:text-white">
            <Header />
            <main className="pt-20">
                {children}
            </main>
            <Footer />
        </div>
    );
}
