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
    Settings,
    Bug,
    Wrench,
    Database,
    Shield,
    FileText,
    Rocket,
    Coins,
    Flag,
    Eye,
    Crown
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
    const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];
    const router = useRouter();

    if (isAuthPage) return <>{children}</>;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    const isAuthorized = user && ADMIN_ROLES.includes(user.role);

    // Session Resilience Check
    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };
    const hasAdminSession = !!getCookie('mb-admin-session');
    const [syncTimeout, setSyncTimeout] = React.useState(false);

    React.useEffect(() => {
        if (!isAuthorized && hasAdminSession && !loading) {
            const timer = setTimeout(() => {
                setSyncTimeout(true);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [isAuthorized, hasAdminSession, loading]);

    if (!isAuthorized) {
        if ((hasAdminSession && !syncTimeout) || loading) {
             return (
                <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground flex-col gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Syncing Permissions...</p>
                </div>
            );
        }
        
        if (typeof document !== 'undefined') {
             document.cookie = 'mb-admin-session=; path=/; max-age=0;';
        }
        router.replace('/portal/login');
        return null;
    }

    const getSidebarItems = () => {
        const role = user.role;
        const messages = { label: 'Team Messages', href: '/admin/executive-chat', icon: MessageSquare };

        // ─── Operations Admin: ISOLATED ───
        if (role === 'operations_admin') {
            return [
                { label: 'Operations Hub', href: '/admin/operations', icon: Activity },
                { label: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
                { label: 'Seller Management', href: '/admin/users', icon: Users },
                { label: 'Product Registry', href: '/admin/listings', icon: ShoppingBag },
                { label: 'Support Tickets', href: '/admin/operations/support', icon: Headphones },
                { label: 'Feedback', href: '/admin/operations/feedback', icon: Flag },
                { label: 'Escrow Overview', href: '/admin/orders', icon: ClipboardCheck },
                messages
            ];
        }

        // ─── Marketing Admin: ISOLATED ───
        if (role === 'marketing_admin') {
            return [
                { label: 'Marketing Hub', href: '/admin/marketing', icon: Target },
                { label: 'User Acquisition', href: '/admin/marketing', icon: TrendingUp },
                { label: 'Product Manager', href: '/admin/listings', icon: ShoppingBag },
                messages
            ];
        }

        // ─── Systems Admin: ISOLATED ───
        if (role === 'systems_admin' || role === 'technical_admin') {
            return [
                { label: 'Systems Hub', href: '/admin/systems', icon: Server },
                { label: 'Database', href: '/admin/systems', icon: Database },
                { label: 'Security Logs', href: '/admin/systems', icon: Shield },
                { label: 'Admin Accounts', href: '/admin/systems', icon: Users },
                messages
            ];
        }

        // ─── IT Support: ISOLATED ───
        if (role === 'it_support') {
            return [
                { label: 'IT Support Hub', href: '/admin/it-support', icon: Wrench },
                { label: 'Bug Reports', href: '/admin/it-support', icon: Bug },
                { label: 'Integrations', href: '/admin/it-support', icon: Rocket },
                { label: 'Tech Docs', href: '/admin/it-support', icon: FileText },
                messages
            ];
        }

        // ─── CEO / Executive: FULL ACCESS ───
        if (role === 'ceo' || role === 'cofounder' || role === 'cto' || role === 'coo') {
            const isOnExecPath = pathname?.startsWith('/admin/ceo');
            if (isOnExecPath) {
                return [
                    { label: 'Executive Hub', href: '/admin/ceo', icon: Crown },
                    { label: 'Live Support', href: '/admin/live-chat', icon: Headphones },
                    messages,
                ];
            }
            return [
                { label: 'Executive Hub', href: '/admin/ceo', icon: Crown },
                { label: 'Systems', href: '/admin/systems', icon: Server },
                { label: 'Operations', href: '/admin/operations', icon: Activity },
                { label: 'Marketing', href: '/admin/marketing', icon: Target },
                { label: 'IT Support', href: '/admin/it-support', icon: Wrench },
                { label: 'User Registry', href: '/admin/users', icon: Users },
                { label: 'Product Registry', href: '/admin/listings', icon: ShoppingBag },
                { label: 'Financials', href: '/admin/payouts', icon: Banknote },
                messages
            ];
        }

        // Fallback (admin role)
        return [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            messages
        ];
    };

    const sidebarItems = getSidebarItems();

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
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
                <div className="fixed top-[-5%] right-[-5%] w-[40%] h-[40%] bg-primary/[0.03] blur-[150px] rounded-full pointer-events-none -z-10" />
                
                <DashboardHeader title="ADMIN PANEL" sidebarItems={sidebarItems} />
                
                <main className="flex-1 p-4 md:p-10 relative z-10 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}