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
    { label: 'Mission Control', href: '/admin', icon: LayoutDashboard },
    { label: 'Technical Node', href: '/admin/technical', icon: Server },
    { label: 'Operations Hub', href: '/admin/operations', icon: Activity },
    { label: 'Marketing Growth', href: '/admin/marketing', icon: BarChart3 },
    { label: 'Strategic Proposal', href: '/admin/proposals/new', icon: Zap },
    { label: 'Executive Chat', href: '/admin/executive-chat', icon: MessageSquare },
    { label: 'Users Manager', href: '/admin/users', icon: Users },
    { label: 'Listings Manager', href: '/admin/listings', icon: ShoppingBag },
    { label: 'Dispute Center', href: '/admin/disputes', icon: ShieldAlert },
];

import { Server, Activity, Zap } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard-header';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup');

    if (isAuthPage) return <>{children}</>;

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={adminItems} title="Admin Portal" />
            </div>
            <div className="flex-1 md:ml-64 flex flex-col">
                <DashboardHeader title="Admin Portal" sidebarItems={adminItems} />
                <main className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50">
                    {children}
                </main>
            </div>
        </div>
    );
}
