'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Activity, Globe, TrendingUp, ArrowRight,
    Zap, LayoutDashboard, Loader2, Shield, Cpu, Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [dashboardStats, setDashboardStats] = useState({
        pendingOps: 0,
        marketingGrowth: 0,
        techHealth: 99
    });
    const [publicSectionEnabled, setPublicSectionEnabled] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.role === 'marketing_admin') router.replace('/admin/marketing');
            else if (user.role === 'operations_admin') router.replace('/admin/operations');
            else if (user.role === 'technical_admin') router.replace('/admin/technical');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            const { count: pendingVerifications } = await supabase
                .from('users').select('*', { count: 'exact', head: true })
                .in('role', ['dealer', 'student_seller']).eq('is_verified', false);
            const { count: pendingOrders } = await supabase
                .from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: totalUsers, error: userError } = await supabase
                .from('users').select('*', { count: 'exact', head: true });

            setDashboardStats({
                pendingOps: (pendingVerifications || 0) + (pendingOrders || 0),
                marketingGrowth: totalUsers || 0,
                techHealth: userError ? 0 : 100
            });

            const { data: settings } = await supabase
                .from('site_settings').select('value')
                .eq('key', 'public_section_enabled').single();
            if (settings) setPublicSectionEnabled(settings.value === 'true' || settings.value === true);
        };
        fetchGlobalStats();
    }, []);

    const operationalCampuss = [
        {
            title: 'Technical',
            label: 'System Health & Logs',
            href: '/admin/technical',
            icon: Activity,
            color: 'text-[#FF6200]',
            status: dashboardStats.techHealth === 100 ? 'Status: Optimal' : 'Status: Issues Detected',
            health: dashboardStats.techHealth,
            isNew: dashboardStats.techHealth < 100
        },
        { title: 'Operations', href: '/admin/operations', icon: Activity, color: 'text-[#FF6200]', label: 'Exchange Flux', status: `${dashboardStats.pendingOps} Pending Actions`, health: 85 },
        { title: 'Marketing', href: '/admin/marketing', icon: Globe, color: 'text-white', label: 'Growth Vector', status: `${dashboardStats.marketingGrowth.toLocaleString()} Active Users`, health: 92 },
        { title: 'Revenue', href: '/admin/revenue', icon: TrendingUp, color: 'text-[#FF6200]', label: 'Fee Analytics', status: '5% Commission Active', health: 100 },
        { title: 'Proposal', href: '/admin/proposals/new', icon: Zap, color: 'text-[#FF6200]', label: 'Direct Memo', status: 'Priority Channel', health: 100, isNew: true },
    ];

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col selection:bg-[#FF6200] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="container mx-auto py-16 px-6 relative z-10 space-y-16">

                {/* Header */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Secure Administrative Uplink</span>
                    </div>
                    <div>
                        <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic">
                            Admin <span className="text-[#FF6200]">Control</span>
                        </h1>
                        <p className="text-white/40 font-medium italic lowercase mt-4 max-w-2xl">
                            Authorized Access: <span className="text-white font-bold">{user.displayName}</span> //
                            System: <span className="text-[#FF6200] font-black">{user.role.replace('_', ' ')} Dashboard</span> //
                            Status: <span className="text-white font-black">Online</span>
                        </p>
                    </div>
                </div>

                {/* Operational Campuss Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {operationalCampuss.map((Campus) => (
                        <Link key={Campus.title} href={Campus.href} className="group">
                            <div className="glass-card p-8 h-full flex flex-col space-y-8 transition-all duration-500 hover:translate-y-[-8px] hover:border-[#FF6200]/20">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#FF6200]/30 transition-colors">
                                        <Campus.icon className={cn('h-7 w-7', Campus.color)} />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                        {Campus.title}
                                    </h3>
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                                        {Campus.label}
                                    </p>
                                </div>
                                <div className="pt-4 mt-auto">
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white/60 uppercase italic tracking-widest">{Campus.status}</span>
                                            {Campus.isNew && <Badge className="bg-[#FF6200] text-black font-black text-[8px] border-none px-2 rounded-sm italic">Required</Badge>}
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#FF6200] transition-all duration-1000" style={{ width: `${Campus.health}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Access */}
                <div className="glass-card rounded-[3rem] p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#FF6200]/5 to-transparent pointer-events-none" />
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 relative z-10">
                        <div className="space-y-8 flex-1">
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 italic">// Strategic Subsystems</h3>
                                <p className="text-white/40 text-sm italic lowercase">High-priority Dashboard routes for core asset management.</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { label: 'User Index', href: '/admin/users' },
                                    { label: 'Asset Ledger', href: '/admin/listings' },
                                    { label: 'Order Verification', href: '/admin/orders' },
                                    { label: 'Seller Payouts', href: '/admin/payouts' },
                                    { label: 'Resolution Campus', href: '/admin/disputes' },
                                    { label: 'System Logs', href: '/admin/logs' }
                                ].map(link => (
                                    <Button key={link.label} asChild variant="outline" className="border-white/10 text-white rounded-xl uppercase text-[10px] font-black tracking-widest h-14 px-8 hover:bg-white/5 hover:border-[#FF6200]/30 transition-all whitespace-nowrap bg-black/20">
                                        <Link href={link.href}>{link.label}</Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-6 items-end shrink-0">
                            <div className="text-right space-y-1">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Encryption Status</p>
                                <div className="text-white font-black italic text-sm tracking-tighter">MIL-SPEC AES-256 / SHA-3</div>
                            </div>
                            <div className="flex flex-col gap-2 text-right">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">System Status</p>
                                <div className="flex items-center gap-2 text-[#FF6200] font-black italic tracking-tighter">
                                    <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-ping" />
                                    CORE NETWORK ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kill-Switch Control */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-gradient-to-br from-[#FF6200]/10 to-transparent border-[#FF6200]/20 rounded-[3rem] overflow-hidden p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="space-y-4 max-w-xl">
                                <div className="flex items-center gap-2 text-[#FF6200]">
                                    <Shield className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Security System 7</span>
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                                    Public Expansion <span className="text-[#FF6200]">Kill-Switch</span>
                                </h3>
                                <p className="text-white/40 text-sm leading-relaxed italic">
                                    Emergency override for the national marketplace. Disabling this instantly locks the <span className="text-white">/public</span> route. Use during maintenance or security events.
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-4 bg-black/40 p-8 rounded-3xl border border-white/5 shrink-0 min-w-[200px]">
                                <button
                                    className={cn(
                                        'w-20 h-10 rounded-full p-1 cursor-pointer transition-all duration-500 relative',
                                        publicSectionEnabled ? 'bg-[#FF6200]' : 'bg-zinc-800'
                                    )}
                                    onClick={async () => {
                                        if (isThinking) return;
                                        if (!confirm(`Are you sure you want to ${publicSectionEnabled ? 'DISABLE' : 'ENABLE'} the public marketplace?`)) return;
                                        setIsThinking(true);
                                        try {
                                            const { error } = await supabase.from('site_settings').upsert({
                                                key: 'public_section_enabled',
                                                value: String(!publicSectionEnabled),
                                                updated_at: new Date().toISOString()
                                            }, { onConflict: 'key' });
                                            if (error) throw error;
                                            setPublicSectionEnabled(!publicSectionEnabled);
                                        } catch (e) {
                                            alert('Override Failed: Check system logs.');
                                        } finally {
                                            setIsThinking(false);
                                        }
                                    }}
                                >
                                    <div className={cn(
                                        'h-8 w-8 rounded-full bg-white shadow-xl transition-all duration-500 flex items-center justify-center',
                                        publicSectionEnabled ? 'translate-x-10' : 'translate-x-0'
                                    )}>
                                        {isThinking ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-black" />
                                        ) : (
                                            <Globe className={cn('h-4 w-4', publicSectionEnabled ? 'text-[#FF6200]' : 'text-white/60')} />
                                        )}
                                    </div>
                                </button>
                                <span className={cn(
                                    'text-[10px] font-black uppercase tracking-[0.2em]',
                                    publicSectionEnabled ? 'text-[#FF6200]' : 'text-white/40'
                                )}>
                                    {publicSectionEnabled ? 'Public Access Enabled' : 'Service Unavailable'}
                                </span>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-black/40 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between">
                        <div className="space-y-4">
                            <Cpu className="h-8 w-8 text-[#FF6200]" />
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">Handshake Logic</h3>
                            <p className="text-white/40 text-[10px] leading-relaxed uppercase tracking-widest font-bold">
                                Middleware checks <span className="text-[#FF6200]">ENABLE_PUBLIC_SECTION</span> env first,
                                then falls back to this DB-level switch.
                            </p>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                            <Link href="/admin/technical" className="text-[10px] font-black uppercase text-[#FF6200] flex items-center gap-2 hover:gap-4 transition-all">
                                View Technical Audit <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
                    <div>MarketBridge Technical Division // 2026</div>
                    <div className="flex items-center gap-4">
                        <span>Latency: 14ms</span>
                        <span>Uptime: 99.99%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}