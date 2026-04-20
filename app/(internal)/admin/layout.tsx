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
    LogOut,
    TrendingUp,
    Target,
    Headphones,
    Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { FeedbackLink } from '@/components/FloatingFeedbackWidget';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup');
    const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo'];
    const router = useRouter();

    if (isAuthPage) return <>{children}</>;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    const isAuthorized = user && ADMIN_ROLES.includes(user.role);

    if (!isAuthorized) {
        // If not authorized AND not loading, we bounce, but we give it a tiny grace period 
        // in case a parallel 'refreshUser' is about to fire.
        router.replace('/portal/login');
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground flex-col gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Syncing Permissions...</p>
            </div>
        );
    }

    const getSidebarItems = () => {
        const isExec = role === 'ceo' || role === 'cofounder';
        const isOnExecPath = pathname?.startsWith('/admin/ceo');

        // Full Suite (Operations, Marketing, Financials, etc.)
        const fullSuite = [
            mainDashboard,
            { label: 'System Health', href: '/admin/technical', icon: Server },
            { label: 'Operations hub', href: '/admin/operations', icon: Activity },
            { label: 'Marketing hub', href: '/admin/marketing', icon: Target },
            { label: 'User Registry', href: '/admin/users', icon: Users },
            { label: 'Product Registry', href: '/admin/listings', icon: ShoppingBag },
            { label: 'Financials', href: '/admin/payouts', icon: Banknote },
            messages
        ];

        // Executive Suite (High-level summary, Live help, Team chat)
        const execSuite = [
            { label: 'CEO Dashboard', href: '/admin/ceo', icon: LayoutDashboard },
            { label: 'Live Support', href: '/admin/live-chat', icon: Headphones },
            messages,
        ];

        if (role === 'marketing_admin') {
            return [
                mainDashboard,
                { label: 'Marketing Stats', href: '/admin/marketing', icon: Target },
                { label: 'Product Manager', href: '/admin/listings', icon: ShoppingBag },
                messages
            ];
        }
        if (role === 'operations_admin') {
            return [
                mainDashboard,
                { label: 'Operations Panel', href: '/admin/operations', icon: Activity },
                { label: 'Support Center', href: '/admin/operations/support', icon: Headphones },
                { label: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
                { label: 'User Directory', href: '/admin/users', icon: Users },
                { label: 'Product Registry', href: '/admin/listings', icon: ShoppingBag },
                { label: 'Order History', href: '/admin/orders', icon: ClipboardCheck },
                { label: 'Payouts', href: '/admin/payouts', icon: Banknote },
                messages
            ];
        }
        if (role === 'technical_admin') {
            return [
                mainDashboard,
                { label: 'Technical Health', href: '/admin/technical', icon: Server },
                { label: 'Account Registry', href: '/admin/users', icon: Users },
                messages
            ];
        }

        // Executives see the Hub they are currently visiting
        if (isExec) {
            return isOnExecPath ? execSuite : fullSuite;
        }

        return fullSuite;
    };

    const sidebarItems = getSidebarItems();

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Sidebar with only ONE logout button inside it (at the bottom) */}
            <div className="hidden md:block w-72 fixed h-full z-20 border-r border-border">
                <Sidebar 
                    items={sidebarItems} 
                    title="MARKETBRIDGE ADMIN" 
                />
                <div className="px-6 py-4 space-y-2">
                    <FeedbackLink />
                    <Button 
                        onClick={logout}
                        variant="outline"
                        className="w-full h-12 border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-3"
                    >
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </div>

            <div className="flex-1 md:ml-72 flex flex-col relative overflow-hidden">
                {/* Global Background (Subtle) */}
                <div className="fixed top-[-5%] right-[-5%] w-[40%] h-[40%] bg-primary/[0.03] blur-[150px] rounded-full pointer-events-none -z-10" />
                
                <DashboardHeader title="ADMIN PANEL" sidebarItems={sidebarItems} />
                
                <main className="flex-1 p-4 md:p-10 relative z-10 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}