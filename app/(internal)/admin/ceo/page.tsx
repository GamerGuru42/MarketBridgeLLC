'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity, MapPin, ShieldCheck, MessageSquare, AlertTriangle, Loader2, Store, Crown, ShoppingBag, ArrowUpRight, ShieldAlert, Power } from 'lucide-react';
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
    const { isDemoMode, daysLeft } = useSystem();
    const [togglingDemo, setTogglingDemo] = useState(false);

    React.useEffect(() => {
        if (!loading && (!user || !['ceo', 'cofounder'].includes(user.role))) {
            router.replace('/login');
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

                // 4. Fetch Live Comms
                try {
                    const { data: recentMsgs } = await supabase
                        .from('admin_channel_messages')
                        .select('*, sender:users!sender_id(display_name)')
                        .order('created_at', { ascending: false })
                        .limit(8);
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
        setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'approved' : 'declined' } : p));
        // Real logic would update database
    };

    const handleToggleDemoMode = async () => {
        const proceed = confirm(`Are you sure you want to ${isDemoMode ? 'DEACTIVATE' : 'ACTIVATE (Starts 30-day clock)'} the Private Beta Demo Mode?`);
        if (!proceed) return;

        setTogglingDemo(true);
        try {
            const newState = !isDemoMode;
            const newDate = newState ? new Date().toISOString() : null;

            const { error } = await supabase
                .from('system_settings')
                .upsert({ id: 'global', is_demo_mode: newState, demo_start_date: newDate }, { onConflict: 'id' });

            if (error) throw error;
            window.location.reload();
        } catch (e: any) {
            alert('Failed to toggle Demo Mode: ' + e.message);
        } finally {
            setTogglingDemo(false);
        }
    };

    if (loading || loadingData) return (
        <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    if (!user || !['ceo', 'cofounder'].includes(user.role)) return null;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300 pt-32 pb-20">
            <div className="container px-4 mx-auto max-w-7xl space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-border pb-12 relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Command Center</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
                            Vision <span className="text-primary">Command</span>
                        </h1>
                        <p className="text-muted-foreground font-medium italic flex items-center gap-2">
                            Welcome back, <span className="text-foreground font-black uppercase tracking-tight">{user.displayName}</span> — CEO Dashboard
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 relative z-10">
                        {[
                            { label: 'Market Insights', href: '/admin/operations', icon: TrendingUp },
                            { label: 'Security Protocols', href: '/admin/technical', icon: ShieldCheck },
                            { label: 'Direct Relay', href: '/admin/executive-chat', icon: MessageSquare },
                        ].map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className="h-14 px-8 flex items-center justify-center bg-card border border-border rounded-[1.25rem] text-foreground font-black uppercase tracking-widest text-[10px] hover:border-primary/30 hover:bg-muted/50 transition-all shadow-sm group"
                            >
                                <link.icon className="h-4 w-4 mr-3 text-primary group-hover:scale-110 transition-transform" />
                                {link.label}
                                <ArrowUpRight className="h-3 w-3 ml-2 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Liquid Volume', value: `₦${stats?.gmv.toLocaleString() || '0'}`, icon: DollarSign, sub: 'Verified Revenue', color: 'text-green-500' },
                        { label: 'Certified Entities', value: stats?.activeDealers || 0, icon: Store, sub: 'Dealers Mapped', color: 'text-primary' },
                        { label: 'Active Assets', value: stats?.activeListings || 0, icon: ShoppingBag, sub: 'Inventory Count', color: 'text-orange-500' },
                        { label: 'Trust Index', value: `${Math.round(stats?.trustScore || 100)}%`, icon: ShieldCheck, sub: 'Platform Stability', color: 'text-purple-500' },
                    ].map((card, i) => (
                        <Card key={i} className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden hover:border-primary/20 transition-all group">
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${card.color}`}>
                                <card.icon className="h-24 w-24" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{card.label}</p>
                            <div className="text-4xl font-black text-foreground italic font-heading tracking-tighter mb-2">{card.value}</div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${card.color} flex items-center`}>
                                <TrendingUp className="h-3 w-3 mr-2" /> {card.sub}
                            </p>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Card className="lg:col-span-3 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-colors duration-300">
                        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${isDemoMode ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'}`}>
                                    <Power className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic">System Protocols</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Currently governing the live environment state.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                {isDemoMode ? (
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-1">Demo Expires in: {daysLeft} Days</p>
                                        <p className="text-[10px] text-muted-foreground uppercase opacity-80">Test mode active</p>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-green-500 mb-1">Production Live</p>
                                        <p className="text-[10px] text-muted-foreground uppercase opacity-80">All systems nominal</p>
                                    </div>
                                )}
                                <Button 
                                    onClick={handleToggleDemoMode} 
                                    disabled={togglingDemo}
                                    variant={isDemoMode ? 'destructive' : 'default'}
                                    className="h-14 px-8 font-black uppercase tracking-widest text-xs rounded-2xl"
                                >
                                    {togglingDemo ? <Loader2 className="animate-spin h-5 w-5" /> : (isDemoMode ? 'Deactivate Demo' : 'Engage Demo Beta')}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Proposal Nexus */}
                    <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-colors duration-300">
                        <CardHeader className="p-10 border-b border-border bg-muted/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Strategic Proposals</h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">Operations & Strategy Memos</p>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black h-8 px-4 rounded-full">
                                    {proposals.filter(p => p.status === 'pending').length} Pending
                                </Badge>
                            </div>
                        </CardHeader>
                        <div className="divide-y divide-border">
                            {proposals.length === 0 ? (
                                <div className="p-32 text-center">
                                    <Activity className="h-16 w-16 text-muted-foreground/10 mx-auto mb-6" />
                                    <h4 className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-30 italic">No proposals in queue</h4>
                                </div>
                            ) : (
                                proposals.map(proposal => (
                                    <div key={proposal.id} className="p-10 hover:bg-muted/5 transition-colors group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <Crown className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-foreground italic tracking-tighter uppercase text-lg group-hover:text-primary transition-colors">{proposal.title}</h4>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1 opacity-60">
                                                        Auth-Signature: {proposal.author_id ? proposal.author_id.substring(0, 8).toUpperCase() : 'SYSTEM'} // {new Date().toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={
                                                proposal.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                                                    proposal.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                        'bg-red-500/10 text-red-500'
                                            }>
                                                {proposal.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="p-6 bg-muted/40 rounded-2xl mb-8 border border-border/50">
                                            <p className="text-sm text-foreground/80 italic font-medium leading-relaxed">
                                                "{proposal.description}"
                                            </p>
                                        </div>
                                        {proposal.status === 'pending' && (
                                            <div className="flex gap-4">
                                                <Button size="sm" onClick={() => handleAction(proposal.id, 'approve')} className="bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-11 px-8 rounded-xl border-none shadow-lg shadow-primary/10">Ratify Proposal</Button>
                                                <Button size="sm" onClick={() => handleAction(proposal.id, 'decline')} variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest h-11 px-8 rounded-xl">Veto Memo</Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Regional & Intel */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Market Penetration */}
                        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-10 transition-colors duration-300">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3 mb-10">
                                <MapPin className="h-4 w-4 text-primary" /> Regional Saturation
                            </h3>
                            <div className="space-y-10">
                                {[
                                    { label: 'Abuja (HQ)', value: regionalStats.abuja, color: 'bg-primary' },
                                    { label: 'Lagos Island', value: regionalStats.lagos, color: 'bg-green-500' },
                                ].map((reg, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-sm font-black uppercase tracking-tighter italic">{reg.label}</span>
                                            <span className="text-xl font-black text-primary font-mono">{reg.value}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                                            <div className={`h-full ${reg.color} transition-all duration-1000 ease-out`} style={{ width: `${Math.min((reg.value / (stats?.totalUsers || 1)) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Intelligence Relay */}
                        <Card className="bg-card dark:bg-black text-foreground dark:text-white border-border dark:border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[500px]">
                            <div className="p-6 bg-muted/50 dark:bg-zinc-950/50 flex items-center justify-between border-b border-border dark:border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/50 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Live Intel Relay
                                </h3>
                                <MessageSquare className="h-4 w-4 text-muted-foreground/50 dark:text-white/20" />
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 dark:opacity-20">
                                        <Activity className="h-10 w-10 mb-4" />
                                        <p className="italic text-[10px] uppercase font-black tracking-widest text-center">Zero Signal Detected</p>
                                    </div>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="bg-muted/30 dark:bg-white/5 p-5 rounded-2xl border border-border/50 dark:border-white/10 hover:bg-muted/60 dark:hover:bg-white/10 transition-colors group">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-black text-primary group-hover:scale-105 transition-transform text-[10px] uppercase tracking-widest">{msg.sender?.display_name || 'CO-PILOT'}</p>
                                                <span className="text-[8px] font-bold text-muted-foreground dark:text-white/30">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-foreground/80 dark:text-white/70 italic text-xs leading-relaxed">"{msg.content}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link href="/admin/executive-chat" className="p-4 bg-primary text-primary-foreground text-center font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all">
                                Open Secure Terminal
                            </Link>
                        </Card>
                    </div>
                </div>

                <div className="text-center py-20 opacity-20 hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-black uppercase tracking-[0.6em] text-muted-foreground">MarketBridge Intelligence Network // Echelon Zero Verified</p>
                </div>
            </div>
        </div>
    );
}
