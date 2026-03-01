'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { Activity, Users, ShieldAlert, MessageSquare, LayoutDashboard } from 'lucide-react';

const cofounderItems = [
    { label: 'Strategic Root', href: '/cofounder', icon: LayoutDashboard },
    { label: 'Operational Hub', href: '/admin/operations', icon: Activity },
    { label: 'User Statistics', href: '/admin/users', icon: Users },
    { label: 'Executive Pulse', href: '/admin/ceo', icon: Activity },
    { label: 'Secure Terminal', href: '/admin/executive-chat', icon: MessageSquare },
];

export default function CofounderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={cofounderItems} title="Co-founder Dashboard" />
            </div>
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
