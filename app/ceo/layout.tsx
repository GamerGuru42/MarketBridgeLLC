'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { BarChart, TrendingUp, ShieldAlert } from 'lucide-react';

const ceoItems = [
    { label: 'Strategic Dashboard', href: '/ceo/dashboard', icon: BarChart },
    { label: 'Growth Metrics', href: '/ceo/growth', icon: TrendingUp },
    { label: 'Executive Chat', href: '/admin/executive-chat', icon: ShieldAlert },
];

export default function CEOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={ceoItems} title="CEO Dashboard" />
            </div>
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
