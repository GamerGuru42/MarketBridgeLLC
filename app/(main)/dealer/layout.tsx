'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import {
    LayoutDashboard,
    PlusCircle,
    Package,
    MessageSquare,
    DollarSign,
    Settings,
    CreditCard
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';

const dealerItems = [
    { label: 'Overview', href: '/dealer/dashboard', icon: LayoutDashboard },
    { label: 'New Listing', href: '/dealer/listings/new', icon: PlusCircle },
    { label: 'My Inventory', href: '/dealer/listings', icon: Package },
    { label: 'Buyer Messages', href: '/chats', icon: MessageSquare },
    { label: 'Sales & Orders', href: '/orders', icon: DollarSign },
    { label: 'Subscription', href: '/pricing', icon: CreditCard },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export default function DealerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    // The middleware handles protection, but we add an extra layer here
    if (!user || user.role !== 'dealer') {
        // We don't redirect here to avoid race conditions with middleware
        // But we don't show the dealer sidebar either
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={dealerItems} title="Dealer Portal" />
            </div>
            <div className="flex-1 md:ml-64 flex flex-col">
                <DashboardHeader title="Dealer Portal" sidebarItems={dealerItems} />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
