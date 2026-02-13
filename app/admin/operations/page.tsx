'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, ShieldCheck, AlertTriangle, Scale, History, Map, Activity, ShoppingBag, Users, Clock, Zap, ArrowRight, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils'; // Make sure this util exists or simple helper

export default function OperationsAdminPage() {
    const { user } = useAuth();
    const [stats, setStats] = React.useState({
        pendingVerifications: 0,
        activeShipments: 0,
        escrowVolume: 0,
        disputeRate: 0,
        recentActivity: [] as any[],
        pendingSubscriptions: 0
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            // 1. Pending Identity Verifications (Dealers)
            const { count: pendingCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'dealer')
                .eq('is_verified', false);

            // 2. Pending Subscription Verifications (Manual Payments)
            const { count: subCount } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 3. Active Shipments (Confirmed Orders)
            const { count: shipmentCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            // 4. Escrow Volume & Rate
            const { data: allOrders } = await supabase
                .from('orders')
                .select('amount, status');

            const escrowOrders = allOrders?.filter(o => ['pending', 'confirmed'].includes(o.status)) || [];
            const volume = escrowOrders.reduce((acc, order) => acc + order.amount, 0);
            const totalOrders = allOrders?.length || 0;

            const { count: totalDisputes } = await supabase.from('disputes').select('*', { count: 'exact', head: true });
            const realDisputeRate = totalOrders > 0 ? ((totalDisputes || 0) / totalOrders) * 100 : 0;

            // 5. Recent Activity Feed
            const { data: disputes } = await supabase
                .from('disputes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            const { data: recentDealers } = await supabase
                .from('users')
                .select('display_name, updated_at')
                .eq('role', 'dealer')
                .eq('is_verified', true)
                .order('updated_at', { ascending: false })
                .limit(3);

            const activities = [
                ...(disputes?.map(d => ({
                    type: 'dispute',
                    message: `New Dispute #${d.id.slice(0, 6).toUpperCase()}`,
                    time: d.created_at,
                    link: '/admin/disputes'
                })) || []),
                ...(recentDealers?.map(d => ({
                    type: 'verification',
                    message: `Dealer Verified: ${d.display_name}`,
                    time: d.updated_at,
                    link: '/admin/users'
                })) || [])
            ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);


            setStats({
                pendingVerifications: pendingCount || 0,
                activeShipments: shipmentCount || 0,
                escrowVolume: volume,
                disputeRate: parseFloat(realDisputeRate.toFixed(1)),
                recentActivity: activities,
                pendingSubscriptions: subCount || 0
            });
        };
        fetchStats();
    }, []);

    const opsCards = [
        {
            title: 'Identity Queue',
            value: stats.pendingVerifications,
            label: 'Dealers Pending',
            icon: Users,
            color: 'text-[#FFB800]',
            href: '/admin/users'
        },
        {
            title: 'Subscription Audit',
            value: stats.pendingSubscriptions,
            label: 'Payments Pending',
            icon: Wallet,
            color: 'text-[#00FF85]',
            href: '/admin/subscriptions'
        },
        {
            title: 'Active Logistics',
            value: stats.activeShipments,
            label: 'In Transit',
            icon: Truck,
            color: 'text-blue-400',
            href: '#' // Future: /admin/logistics
        },
        {
            title: 'Dispute Ratio',
            value: `${stats.disputeRate}%`,
            label: 'Global Defect Rate',
            icon: AlertTriangle,
            color: 'text-red-500',
            href: '/admin/disputes'
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-[#FFB800] selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-[#FFB800]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 font-heading">Central Command</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            Operations <span className="text-zinc-700">Deck</span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {opsCards.map((card) => (
                        <Link key={card.title} href={card.href} className="group">
                            <div className="glass-card p-6 h-full border border-white/10 hover:border-[#FFB800]/50 transition-all bg-zinc-900/20 group-hover:bg-zinc-900/40">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg bg-black border border-white/10 ${card.color}`}>
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white mb-1 font-heading">{card.value}</div>
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{card.title}</div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] font-mono text-zinc-400">
                                    {card.label}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 glass-card p-8 border border-white/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter font-heading">Live Feed</h3>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#00FF85] animate-pulse" />
                                <span className="text-[10px] font-bold text-[#00FF85] uppercase tracking-widest">Real-time</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {stats.recentActivity.length === 0 ? (
                                <div className="text-zinc-500 font-mono text-xs text-center py-8">No recent network activity detected.</div>
                            ) : (
                                stats.recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${activity.type === 'dispute' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-[#00FF85]/30 bg-[#00FF85]/10 text-[#00FF85]'}`}>
                                                {activity.type === 'dispute' ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-0.5">{activity.message}</div>
                                                <div className="text-[10px] text-zinc-500 font-mono uppercase">{new Date(activity.time).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        {activity.link && (
                                            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                                                <Link href={activity.link}><ArrowRight className="h-4 w-4" /></Link>
                                            </Button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Escrow Vault Status */}
                    <div className="glass-card p-8 border border-white/10 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-black">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter font-heading mb-2 text-[#00FF85]">Vault Status</h3>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-8">Secure Holdings Ledger</p>

                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-black text-white tracking-tighter">₦{(stats.escrowVolume / 1000000).toFixed(2)}</span>
                            <span className="text-sm font-bold text-zinc-500 uppercase">M</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-400 font-bold uppercase tracking-widest">Efficiency</span>
                                <span className="text-[#00FF85] font-mono">98.2%</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00FF85] w-[98.2%]" />
                            </div>

                            <div className="flex justify-between items-center text-xs mt-4">
                                <span className="text-zinc-400 font-bold uppercase tracking-widest">Risk Factor</span>
                                <span className="text-red-500 font-mono">1.2%</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[1.2%]" />
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10">
                            <Button className="w-full bg-[#00FF85] hover:bg-[#00CC6A] text-black font-black uppercase tracking-widest text-xs h-12" asChild>
                                <Link href="/admin/disputes">Manage Risks</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
