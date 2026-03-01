'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, Users, AlertTriangle, ShieldCheck, Truck, MessageSquare } from 'lucide-react';

const cooItems = [
    { label: 'Operations Root', href: '/coo', icon: LayoutDashboard },
    { label: 'Exchange Intelligence', href: '/admin/operations', icon: LayoutDashboard },
    { label: 'Entity Validations', href: '/admin/operations/verifications', icon: ShieldCheck },
    { label: 'Order Hub', href: '/admin/orders', icon: Truck },
    { label: 'Conflict Resolution', href: '/admin/disputes', icon: AlertTriangle },
    { label: 'Vision Control', href: '/admin/ceo', icon: Users },
    { label: 'Management Uplink', href: '/admin/executive-chat', icon: MessageSquare },
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
