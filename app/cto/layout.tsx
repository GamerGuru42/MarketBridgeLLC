'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, Database, ShieldAlert, Cpu, HardDrive, Zap } from 'lucide-react';

const ctoItems = [
    { label: 'System Root', href: '/cto', icon: LayoutDashboard },
    { label: 'Infrastructure', href: '/cto/infrastructure', icon: Cpu },
    { label: 'Storage & Media', href: '/cto/storage', icon: HardDrive },
    { label: 'DB Performance', href: '/admin/page', icon: Database },
    { label: 'Security Center', href: '/cto/security', icon: ShieldAlert },
    { label: 'API Latency', href: '/cto/api', icon: Zap },
    { label: 'Executive Dashboard', href: '/admin/executive-chat', icon: LayoutDashboard },
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
