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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="h-12 w-12 animate-spin text-[#FFB800]" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-black">
            <div className="hidden md:block w-72 fixed h-full z-20">
                <Sidebar items={adminItems} title="VISION COMMAND" />
            </div>
            <div className="flex-1 md:ml-72 flex flex-col relative">
                {/* Global Background Blobs */}
                <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />

                <DashboardHeader title="MISSION CONTROL" sidebarItems={adminItems} />
                <main className="flex-1 p-6 md:p-10 relative z-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
