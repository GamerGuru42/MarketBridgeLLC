'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    MessageSquare,
    ShieldAlert,
    BarChart3
} from 'lucide-react';

const adminItems = [
    { label: 'Operations', href: '/admin/operations', icon: LayoutDashboard },
    { label: 'Marketing', href: '/admin/dashboard', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Listings', href: '/admin/listings', icon: ShoppingBag },
    { label: 'Chats', href: '/admin/chats', icon: MessageSquare },
    { label: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
    { label: 'Executive Chat', href: '/admin/executive-chat', icon: ShieldAlert },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={adminItems} title="Admin Portal" />
            </div>
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
