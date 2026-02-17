'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Users,
    ShoppingCart,
    AlertTriangle,
    Server,
    Database,
    BarChart,
    ArrowRight,
    Zap,
    LayoutDashboard,
    Loader2,
    Shield,
    Globe,
    Cpu,
    TrendingUp
} from 'lucide-react';
import { TourGuide } from '@/components/tour-guide';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const { user } = useAuth();

    const router = useRouter();

    useEffect(() => {
        if (user) {
            if (user.role === 'marketing_admin') router.replace('/admin/marketing');
            else if (user.role === 'operations_admin') router.replace('/admin/operations');
            else if (user.role === 'technical_admin') router.replace('/admin/technical');
        }
    }, [user, router]);

    const adminTourSteps = [
        {
            title: "Mission Control Briefing",
            description: "Welcome to the central command node. This dashboard routes you to specific operational departments.",
            icon: <LayoutDashboard size={24} />
        },
        {
            title: "Departmental Nodes",
            description: "Access specialized tools for Technical, Operations, and Marketing management from these quick-link cards.",
            icon: <Server size={24} />
        },
        {
            title: "Strategic Proposals",
            description: "Draft official memos and upgrade requests for the CEO here. All submissions are logged for audit.",
            icon: <Zap size={24} />
        }
    ];

    const [dashboardStats, setDashboardStats] = React.useState({
        pendingOps: 0,
        marketingGrowth: 0,
        techHealth: 99
    });

    useEffect(() => {
        const fetchGlobalStats = async () => {
            // Operstions: Pending Verifications + Pending Orders
            const { count: pendingVerifications } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'dealer').eq('is_verified', false);
            const { count: pendingOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            // Marketing: Total Users
            const { count: totalUsers, error: userError } = await supabase.from('users').select('*', { count: 'exact', head: true });

            // Tech Health: Simple DB Connectivity Check
            const dbStatus = userError ? 0 : 100;

            setDashboardStats({
                pendingOps: (pendingVerifications || 0) + (pendingOrders || 0),
                marketingGrowth: totalUsers || 0,
                techHealth: dbStatus
            });
        };
        fetchGlobalStats();
    }, []);

    const operationalNodes = [
        { title: "Technical", href: "/admin/technical", icon: Cpu, color: "text-blue-400", label: "Infrastructure", status: "Status: Optimal", health: dashboardStats.techHealth },
        { title: "Operations", href: "/admin/operations", icon: Activity, color: "text-[#FF6600]", label: "Exchange Flux", status: `${dashboardStats.pendingOps} Pending Actions`, health: 85 },
        { title: "Marketing", href: "/admin/marketing", icon: Globe, color: "text-emerald-400", label: "Growth Vector", status: `${dashboardStats.marketingGrowth.toLocaleString()} Active Users`, health: 92 },
        { title: "Revenue", href: "/admin/revenue", icon: TrendingUp, color: "text-green-400", label: "Fee Analytics", status: "5% Commission Active", health: 100 },
        { title: "Proposal", href: "/admin/proposals/new", icon: Zap, color: "text-orange-400", label: "Direct Memo", status: "Priority Channel", health: 100, isNew: true },
    ];

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />
            <Loader2 className="h-10 w-10 animate-spin text-[#FF6600] relative z-10" />
        </div>
    );


    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col selection:bg-[#FF6600] selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container mx-auto py-16 px-6 relative z-10 space-y-16">
                <TourGuide pageKey="admin_hub" steps={adminTourSteps} title="Admin Briefing" />

                {/* Header Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FF6600] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Secure Administrative Uplink</span>
                    </div>
                    <div>
                        <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic font-heading">
                            Admin <span className="text-[#FF6600]">Control</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic lowercase mt-4 max-w-2xl font-heading">
                            Authorized Access: <span className="text-white font-bold">{user.displayName}</span> //
                            Protocol: <span className="text-[#FF6600] font-black">{user.role.replace('_', ' ')} terminal</span> //
                            Status: <span className="text-[#00FF85] font-black">Online</span>
                        </p>
                    </div>
                </div>

                {/* Operational Nodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {operationalNodes.map((node) => (
                        <Link key={node.title} href={node.href} className="group">
                            <div className="glass-card p-8 h-full flex flex-col space-y-8 transition-all duration-500 hover:translate-y-[-8px] hover:border-[#FF6600]/20">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#FF6600]/30 transition-colors">
                                        <node.icon className={cn("h-7 w-7", node.color)} />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter font-heading">
                                        {node.title}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-heading">
                                        {node.label}
                                    </p>
                                </div>

                                <div className="pt-4 mt-auto">
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest font-heading">{node.status}</span>
                                            {node.isNew && <Badge className="bg-[#FF6600] text-black font-black text-[8px] border-none px-2 rounded-sm italic font-heading">Required</Badge>}
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={cn("h-full transition-all duration-1000", node.color.replace('text', 'bg'))} style={{ width: `${node.health}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Command Center Quick Access */}
                <div className="glass-card rounded-[3rem] p-12 overflow-hidden group relative">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#FF6600]/5 to-transparent pointer-events-none" />

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 relative z-10">
                        <div className="space-y-8 flex-1">
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 italic font-heading">// Strategic Subsystems</h3>
                                <p className="text-zinc-500 text-sm italic lowercase">High-priority terminal routes for core asset management.</p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {[
                                    { label: 'User Index', href: '/admin/users' },
                                    { label: 'Asset Ledger', href: '/admin/listings' },
                                    { label: 'Order Verification', href: '/admin/orders' },
                                    { label: 'Seller Payouts', href: '/admin/payouts' },
                                    { label: 'Resolution Node', href: '/admin/disputes' },
                                    { label: 'System Logs', href: '/admin/logs' }
                                ].map(link => (
                                    <Button key={link.label} asChild variant="outline" className="border-white/10 text-white rounded-xl uppercase text-[10px] font-black tracking-widest h-14 px-8 hover:bg-white/5 hover:border-[#FF6600]/30 font-heading transition-all whitespace-nowrap bg-black/20">
                                        <Link href={link.href}>{link.label}</Link>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 items-end shrink-0">
                            <div className="text-right space-y-1">
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-heading">Encryption Status</p>
                                <div className="text-white font-black italic text-sm font-heading tracking-tighter">MIL-SPEC AES-256 / SHA-3</div>
                            </div>

                            <div className="flex flex-col gap-2 text-right">
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-heading">Protocol Status</p>
                                <div className="flex items-center gap-2 text-[#00FF85] font-black italic font-heading tracking-tighter">
                                    <span className="h-2 w-2 rounded-full bg-[#00FF85] animate-ping" />
                                    CORE NETWORK ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 font-heading italic">
                    <div>Marketbridge Technical Division // 2024</div>
                    <div className="flex items-center gap-4">
                        <span>Latency: 14ms</span>
                        <span>Uptime: 99.99%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
