'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { Activity, Users, ShieldAlert } from 'lucide-react';

const cofounderItems = [
    { label: 'Operational Dashboard', href: '/cofounder/dashboard', icon: Activity },
    { label: 'User Growth', href: '/cofounder/users', icon: Users },
    { label: 'Executive Chat', href: '/admin/executive-chat', icon: ShieldAlert },
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
