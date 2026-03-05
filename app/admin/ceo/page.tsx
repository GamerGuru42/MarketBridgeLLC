'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity, MapPin, ShieldCheck, MessageSquare, AlertTriangle, Loader2, Store, Crown, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { fetchCEOStats, fetchProposals, Proposal, CEOStats } from '@/lib/analytics';


export default function CEOPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [stats, setStats] = useState<CEOStats | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [regionalStats, setRegionalStats] = useState({ abuja: 0, lagos: 0 });

    React.useEffect(() => {
        if (!loading && (!user || (user.role !== 'ceo' && user.role !== 'cofounder'))) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function loadDashboardData() {
            if (!user) return;
            try {
                // 1. Fetch KPI Metrics
                const kpis = await fetchCEOStats();
                setStats(kpis);

                // 2. Fetch Proposals
                const activeProposals = await fetchProposals();
                setProposals(activeProposals || []);

                // 3. Fetch Regional Stats
                const { count: abujaCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).ilike('location', '%Abuja%');
                const { count: lagosCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).ilike('location', '%Lagos%');
                setRegionalStats({ abuja: abujaCount || 0, lagos: lagosCount || 0 });

                // 4. Fetch Live Comms (Fallback to general admin channel)
                try {
                    const { data: recentMsgs } = await supabase
                        .from('admin_channel_messages')
                        .select('*, sender:users!sender_id(display_name)')
                        .order('created_at', { ascending: false })
                        .limit(6);
                    setMessages(recentMsgs || []);
                } catch (e) { setMessages([]); }

            } catch (error) {
                console.error("Dashboard Load Error:", error);
            } finally {
                setLoadingData(false);
            }
        }

        loadDashboardData();
    }, [user]);

    const handleAction = async (id: string, action: 'approve' | 'decline') => {
        // Optimistic UI Update
        setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'approved' : 'declined' } : p));
        // Real app would patch the Supabase proposal table here
    };

    if (loading || loadingData) return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" />
        </div>
    );
    if (!user || (user.role !== 'ceo' && user.role !== 'cofounder')) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-[#FF6200] selection:text-white pt-28 pb-20">
            <div className="container px-6 mx-auto max-w-7xl space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-zinc-200 pb-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Executive Node</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                            CEO <span className="text-[#FF6200]">Command</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic">
                            Global operations active. Logged in as <span className="text-zinc-900 font-bold">{user.displayName}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:mb-2">
                        {[
                            { label: 'Subscriptions', href: '/admin/subscriptions', icon: Crown },
                            { label: 'Verify Sellers', href: '/admin/verify-sellers', icon: ShieldCheck },
                            { label: 'Payouts', href: '/admin/payouts', icon: DollarSign },
                            { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
                        ].map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className="h-12 px-6 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-black uppercase tracking-widest text-[9px] hover:bg-[#FF6200]/5 hover:border-[#FF6200]/20 transition-all shadow-sm"
                            >
                                <link.icon className="h-3.5 w-3.5 mr-2 text-[#FF6200]" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Strategic KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><DollarSign className="h-20 w-20 text-[#00A355]" /></div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Total Liquid Volume</p>
                        <div className="text-4xl font-black text-zinc-900 dark:text-white italic font-heading tracking-tighter">₦{stats?.gmv.toLocaleString() || '0'}</div>
                        <p className="text-xs text-[#00A355] font-bold mt-2 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> Verified Revenue</p>
                    </Card>
                    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Store className="h-20 w-20 text-[#FF6200]" /></div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Certified Dealers</p>
                        <div className="text-4xl font-black text-zinc-900 dark:text-white italic font-heading tracking-tighter">{stats?.activeDealers || 0}</div>
                        <p className="text-xs text-[#FF6200] font-bold mt-2">Verified Sellers Mapped</p>
                    </Card>
                    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Activity className="h-20 w-20 text-blue-500" /></div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Active Listings</p>
                        <div className="text-4xl font-black text-zinc-900 dark:text-white italic font-heading tracking-tighter">{stats?.activeListings || 0}</div>
                        <p className="text-xs text-blue-500 font-bold mt-2">Live Inventory Count</p>
                    </Card>
                    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldCheck className="h-20 w-20 text-purple-500" /></div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Platform Users</p>
                        <div className="text-4xl font-black text-zinc-900 dark:text-white italic font-heading tracking-tighter">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-purple-500 font-bold mt-2">Trust Score: {Math.round(stats?.trustScore || 100)}%</p>
                    </Card>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Proposal Queue */}
                    <Card className="lg:col-span-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-[2rem] overflow-hidden">
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Strategic Proposals</h3>
                                <p className="text-xs text-zinc-500 font-medium">Live memos from operational divisions.</p>
                            </div>
                            <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-none shadow-none text-xs font-black uppercase">{proposals.filter(p => p.status === 'pending').length} Actionable</Badge>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {proposals.length === 0 ? (
                                <div className="p-16 text-center">
                                    <AlertTriangle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                    <h4 className="text-zinc-500 font-black uppercase tracking-widest text-sm">Dashboard Clear</h4>
                                </div>
                            ) : (
                                proposals.map(proposal => (
                                    <div key={proposal.id} className="p-6 hover:bg-zinc-50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-[#FF6200]/10 flex items-center justify-center text-[#FF6200]">
                                                    <Activity className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-zinc-900 italic tracking-tighter uppercase">{proposal.title}</h4>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                                        Author ID: {proposal.author_id ? proposal.author_id.substring(0, 8) : 'Sys'} // {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={
                                                proposal.status === 'pending' ? 'bg-[#FF6200]/10 text-[#FF6200] border-none shadow-none' :
                                                    proposal.status === 'approved' ? 'bg-[#00A355]/10 text-[#00A355] border-none shadow-none' :
                                                        'bg-red-50 text-red-600 border-none shadow-none'
                                            }>
                                                {proposal.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-zinc-600 italic font-medium leading-relaxed mb-6 bg-zinc-50 p-4 rounded-2xl">
                                            "{proposal.description}"
                                        </p>
                                        {proposal.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <Button size="sm" onClick={() => handleAction(proposal.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[9px] h-8 px-6">Ratify Memo</Button>
                                                <Button size="sm" onClick={() => handleAction(proposal.id, 'decline')} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest h-8 px-6">Veto Memo</Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Regional & System Sidebar */}
                    <div className="space-y-8">
                        {/* Regional Penetration */}
                        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2 mb-6">
                                <MapPin className="h-3 w-3 text-[#FF6200]" /> Regional Saturation
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase mb-2">
                                        <span className="text-zinc-900">Abuja (HQ)</span>
                                        <span className="text-[#FF6200]">{regionalStats.abuja}</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#FF6200]" style={{ width: `${Math.min((regionalStats.abuja / (stats?.totalUsers || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase mb-2">
                                        <span className="text-zinc-900">Lagos</span>
                                        <span className="text-[#00A355]">{regionalStats.lagos}</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00A355]" style={{ width: `${Math.min((regionalStats.lagos / (stats?.totalUsers || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Live Comms Relay */}
                        <Card className="bg-zinc-900 text-white border-none shadow-xl shadow-[#FF6200]/10 rounded-3xl overflow-hidden flex flex-col h-[350px]">
                            <div className="p-4 bg-zinc-950 flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" /> Live Relay
                                </h3>
                                <MessageSquare className="h-3 w-3 text-white/40" />
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                {messages.length === 0 ? (
                                    <p className="text-white/40 italic text-center text-[10px] uppercase font-bold mt-10 tracking-widest">No Transmissions</p>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="bg-white/5 p-3 rounded-xl border-l-[3px] border-[#FF6200]">
                                            <p className="font-bold text-white mb-1 text-xs">{msg.sender?.display_name || msg.sender_name || 'System'}</p>
                                            <p className="text-white/60 italic text-xs leading-relaxed">"{msg.content}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

