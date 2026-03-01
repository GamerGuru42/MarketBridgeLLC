'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, Database, ShieldAlert, Cpu, HardDrive, Zap, MessageSquare } from 'lucide-react';

const ctoItems = [
    { label: 'System Root', href: '/cto', icon: LayoutDashboard },
    { label: 'Cloud Infrastructure', href: '/admin/technical', icon: Cpu },
    { label: 'Asset Diagnostics', href: '/admin/listings', icon: HardDrive },
    { label: 'Platform Performance', href: '/admin', icon: Database },
    { label: 'System Guard', href: '/admin/technical', icon: ShieldAlert },
    { label: 'Vision Control', href: '/admin/ceo', icon: LayoutDashboard },
    { label: 'Executive Pulse', href: '/admin/executive-chat', icon: MessageSquare },
];

export default function CTOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={ctoItems} title="CTO Hub" />
            </div>
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
