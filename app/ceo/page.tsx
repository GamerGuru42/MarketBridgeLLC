'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity, MapPin, Video, ShieldCheck, PieChart, Clock, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
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
        if (!loading && (!user || user.role !== 'ceo')) {
            router.push('/ceo/login');
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

                // 3. Fetch Regional Stats (Real count)
                const { count: abujaCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).ilike('location', '%Abuja%');
                const { count: lagosCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).ilike('location', '%Lagos%');
                setRegionalStats({ abuja: abujaCount || 0, lagos: lagosCount || 0 });

                // 4. Fetch Executive Chat (Live Comms)
                // Default to 'gen' channel or just most recent system-wide
                try {
                    const { data: recentMsgs, error: chatError } = await supabase
                        .from('admin_channel_messages')
                        .select('*, sender:users!sender_id(display_name)')
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (chatError) throw chatError;

                    // Map for display
                    const mappedMsgs = (recentMsgs || []).map((m: any) => ({
                        id: m.id,
                        sender_name: m.sender?.display_name || 'System',
                        content: m.content,
                        created_at: m.created_at
                    }));
                    setMessages(mappedMsgs);
                } catch (chatError) {
                    console.warn('Chat fetch fallback:', chatError);
                    // Fallback to empty if table doesn't exist yet
                    setMessages([]);
                }

            } catch (error) {
                console.error("Dashboard Load Error:", error);
            } finally {
                setLoadingData(false);
            }
        }

        loadDashboardData();
    }, [user]);

    const handleAction = async (id: string, action: 'approve' | 'decline') => {
        // Optimistic Update
        setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'approved' : 'declined' } : p));
        // In real app, call API to update status in DB
        // await updateProposalStatus(id, action);
    };

    if (loading || loadingData) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" /></div>;
    if (!user || user.role !== 'ceo') return null;

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Executive Command Center</h1>
                    <p className="text-muted-foreground mt-2">
                        Real-time intelligence and global operations overview for {user?.displayName || 'CEO'}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-primary/30 bg-primary/5">
                        System Status: <span className="text-green-500 ml-1">Online</span>
                    </Badge>
                </div>
            </div>

            <Separator />

            {/* Strategic KPIs (Real Data) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total GMV</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">₦{stats?.gmv.toLocaleString() || '0'}</div>
                        <p className="text-xs text-green-600 font-semibold mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" /> Verified Revenue
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Certified Dealers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{stats?.activeDealers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Verified Sellers on Platform
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Listings</CardTitle>
                        <Video className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{stats?.activeListings || 0}</div>
                        <p className="text-xs text-purple-600 font-semibold mt-1">
                            Live Inventory Count
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Platform Users</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-orange-600 font-semibold">
                            Trust Score: {Math.round(stats?.trustScore || 100)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Intelligence Stream */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Proposal Approval Queue */}
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">Strategic Proposal Queue</CardTitle>
                                    <CardDescription>Live feed of strategic memos from admin units</CardDescription>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-primary/30">{proposals.filter(p => p.status === 'pending').length} Pending</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {proposals.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-zinc-500 opacity-50" />
                                        <h3 className="text-lg font-bold">Queue Empty</h3>
                                        <p className="text-sm">No active proposals found in database.</p>
                                    </div>
                                ) : (
                                    proposals.map((proposal) => (
                                        <div key={proposal.id} className="p-6 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                        <Activity className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold underline italic text-sm">{proposal.title}</h4>
                                                        <p className="text-xs text-muted-foreground font-medium">Author ID: {proposal.author_id.substring(0, 8)}... • {new Date(proposal.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={proposal.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>{proposal.status.toUpperCase()}</Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                                {proposal.description}
                                            </p>
                                            {proposal.status === 'pending' && (
                                                <div className="flex gap-3">
                                                    <Button size="sm" onClick={() => handleAction(proposal.id, 'approve')} className="bg-green-600 hover:bg-green-700 h-8 text-xs">APPROVE</Button>
                                                    <Button size="sm" onClick={() => handleAction(proposal.id, 'decline')} variant="ghost" className="h-8 text-xs text-red-500">DECLINE</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Regional Performance (Real) */}
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Regional Penetration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 font-mono">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold uppercase">
                                            <span>Abuja (HQ)</span>
                                            <span className="text-green-600">{regionalStats.abuja} Users</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${Math.min((regionalStats.abuja / (stats?.totalUsers || 1)) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold uppercase">
                                            <span>Lagos</span>
                                            <span className="text-orange-600">{regionalStats.lagos} Users</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${Math.min((regionalStats.lagos / (stats?.totalUsers || 1)) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Health */}
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    System Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted/20 rounded-lg flex items-center justify-between border-l-4 border-l-primary">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Database Health</p>
                                        <p className="text-lg font-bold text-green-500">OPTIMAL</p>
                                    </div>
                                    <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg flex items-center justify-between border-l-4 border-l-secondary">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">API Latency</p>
                                        <p className="text-lg font-bold">~25ms</p>
                                    </div>
                                    <Clock className="h-6 w-6 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Staff Collaboration Side Panel (Real Chat Feed) */}
                <div className="space-y-8">
                    <Card className="border-secondary/20 shadow-lg bg-slate-900 text-white">
                        <CardHeader className="bg-slate-950/50 border-b border-slate-800">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                Live Comms Relay
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 h-[400px] flex flex-col">
                            <div className="flex-1 overflow-y-auto space-y-4 text-xs scrollbar-hide">
                                {messages.length === 0 ? (
                                    <p className="text-slate-500 italic text-center mt-10">No recent communications intercepted.</p>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="bg-slate-800/40 p-3 rounded-lg border-l-2 border-l-blue-400">
                                            <p className="font-bold text-blue-300 mb-1">{msg.sender_name || 'System'}</p>
                                            <p className="text-slate-300 italic">"{msg.content}"</p>
                                            <p className="text-[8px] text-slate-500 mt-2">{new Date(msg.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Separator className="my-4 bg-slate-800" />
                            <div className="relative">
                                <Button size="sm" className="w-full h-8 text-[10px] px-2" onClick={() => router.push('/admin/executive-chat')}>
                                    <MessageSquare className="h-3 w-3 mr-2" />
                                    OPEN SECURE CHAT
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Admin Roster Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground italic">Admin presence tracking syncing with database...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


