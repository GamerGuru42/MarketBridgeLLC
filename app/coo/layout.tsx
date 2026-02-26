'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, Users, AlertTriangle, ShieldCheck, Truck } from 'lucide-react';

const cooItems = [
    { label: 'Operations Root', href: '/coo', icon: LayoutDashboard },
    { label: 'Real-time Analytics', href: '/admin/operations', icon: LayoutDashboard },
    { label: 'Verifications', href: '/admin/operations/verifications', icon: ShieldCheck },
    { label: 'Logistics Control', href: '/coo/logistics', icon: Truck },
    { label: 'Active Disputes', href: '/admin/disputes', icon: AlertTriangle },
    { label: 'Executive Dashboard', href: '/admin/executive-chat', icon: Users },
];

export default function COOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={cooItems} title="COO Dashboard" />
            </div>
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
