'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    MessageSquare,
    ShieldAlert,
    BarChart3,
    Banknote,
    ClipboardCheck,
    Server,
    Activity,
    Zap,
    TrendingUp,
    Headphones
} from 'lucide-react';
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
    const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];
    const router = useRouter();

    if (isAuthPage) return <>{children}</>;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    // CENTRALIZED SECURITY ENFORCEMENT
    if (!user || !ADMIN_ROLES.includes(user.role)) {
        router.replace('/portal/login');
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const getSidebarItems = () => {
        const role = user.role;
        const missionControl = { label: 'Mission Control', href: '/admin', icon: LayoutDashboard };
        const secureRelay = { label: 'Secure Relay', href: '/admin/executive-chat', icon: MessageSquare };

        if (role === 'marketing_admin') {
            return [
                missionControl,
                { label: 'Marketing Vector', href: '/admin/marketing', icon: Zap },
                { label: 'Asset Manager', href: '/admin/listings', icon: ShoppingBag },
                secureRelay
            ];
        }
        if (role === 'operations_admin') {
            return [
                missionControl,
                { label: 'Operations Hub', href: '/admin/operations', icon: Activity },
                { label: 'Support Relay', href: '/admin/operations/support', icon: Headphones },
                { label: 'Dispute Center', href: '/admin/disputes', icon: ShieldAlert },
                { label: 'Node Registry', href: '/admin/users', icon: Users },
                { label: 'Asset Registry', href: '/admin/listings', icon: ShoppingBag },
                { label: 'Order Nexus', href: '/admin/orders', icon: ClipboardCheck },
                { label: 'Capital Flow', href: '/admin/payouts', icon: Banknote },
                secureRelay
            ];
        }
        if (role === 'technical_admin') {
            return [
                missionControl,
                { label: 'Technical Flow', href: '/admin/technical', icon: Server },
                { label: 'Node Registry', href: '/admin/users', icon: Users },
                secureRelay
            ];
        }
        if (role === 'ceo' || role === 'cofounder') {
            return [
                { label: 'Mission Control', href: '/admin/ceo', icon: LayoutDashboard },
                { label: 'Live Monitoring', href: '/admin/live-chat', icon: ShieldAlert },
                secureRelay,
            ];
        }

        // Super Admin (or fallback) gets everything
        return [
            missionControl,
            { label: 'Technical Flow', href: '/admin/technical', icon: Server },
            { label: 'Operations Hub', href: '/admin/operations', icon: Activity },
            { label: 'Support Relay', href: '/admin/operations/support', icon: Headphones },
            { label: 'Monitoring Relay', href: '/admin/live-chat', icon: ShieldAlert },
            { label: 'Marketing Vector', href: '/admin/marketing', icon: Zap },
            { label: 'Node Registry', href: '/admin/users', icon: Users },
            { label: 'Asset Registry', href: '/admin/listings', icon: ShoppingBag },
            { label: 'Dispute Center', href: '/admin/disputes', icon: ShieldAlert },
            { label: 'Order Nexus', href: '/admin/orders', icon: ClipboardCheck },
            { label: 'Capital Flow', href: '/admin/payouts', icon: Banknote },
            secureRelay
        ];
    };

    const filteredItems = getSidebarItems();

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="hidden md:block w-72 fixed h-full z-20">
                <Sidebar items={filteredItems} title="VISION COMMAND" />
            </div>
            <div className="flex-1 md:ml-72 flex flex-col relative overflow-hidden">
                {/* Global Background Blobs */}
                <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />

                <DashboardHeader title="VISION COMMAND" sidebarItems={filteredItems} />
                <main className="flex-1 p-4 md:p-8 relative z-10 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}