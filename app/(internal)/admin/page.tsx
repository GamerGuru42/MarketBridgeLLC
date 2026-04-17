'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, ShieldCheck, UserCheck, AlertTriangle, ChevronRight, Activity, Users, ShoppingBag, Zap, MessageSquare, ArrowUpRight, Power, MapPin, TrendingUp, Search, Terminal, Globe, Rocket
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

// Ascension Components
import { SystemTicker } from '@/components/admin/system-ticker';
import { AdminMap } from '@/components/admin/admin-map';

interface Application {
    id: string;
    user_id: string;
    full_name?: string;
    name?: string;
    email?: string;
    student_email?: string;
    campus?: string;
    university?: string;
    business_type: string;
    id_card_url: string;
    status: string;
    created_at: string;
}

export default function MissionControlPage() {
    const { user, loading: authLoading } = useAuth();
    const { isDemoMode, daysLeft } = useSystem();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [recentSignups, setRecentSignups] = useState<any[]>([]);
    
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingSellers: 0,
        activeSellers: 0,
        activeListings: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    // Role-specific focus
    const isOpsAdmin = user?.role === 'operations_admin' || user?.role === 'ceo' || user?.role === 'admin';
    const isTechAdmin = user?.role === 'technical_admin';
    const isMarketingAdmin = user?.role === 'marketing_admin';

    useEffect(() => {
        const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];
        if (!authLoading && (!user || !ADMIN_ROLES.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Shared Stats
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: sellersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student_seller');
            const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');

            // 2. Role-Engineered Data Fetching
            if (isOpsAdmin) {
                const { data: apps, count: pendCount } = await supabase
                    .from('seller_applications')
                    .select('*', { count: 'exact' })
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(5);
                setApplications(apps || []);
                setStats(prev => ({ ...prev, pendingSellers: pendCount || 0 }));
            }

            if (isTechAdmin) {
                const { data: logs } = await supabase
                    .from('system_audit_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(6);
                setAuditLogs(logs || []);
            }

            if (isMarketingAdmin) {
                const { data: signups } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(6);
                setRecentSignups(signups || []);
            }

            // 3. Shared Intel Relay
            try {
                const { data: recentMsgs } = await supabase
                    .from('admin_channel_messages')
                    .select('*, sender:users!sender_id(display_name)')
                    .order('created_at', { ascending: false })
                    .limit(6);
                setMessages(recentMsgs || []);
            } catch (e) { setMessages([]); }

            setStats(prev => ({
                ...prev,
                totalUsers: usersCount || 0,
                activeSellers: sellersCount || 0,
                activeListings: listingsCount || 0,
            }));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (app: Application, act: 'approve' | 'reject') => {
        setActioningId(app.id);
        try {
            const res = await fetch(act === 'approve' ? '/api/admin/approve-seller' : '/api/admin/decline-seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id })
            });

            if (!res.ok) throw new Error('Action failed');

            toast(`Application ${act}ed successfully!`, 'success');
            setApplications(prev => prev.filter(a => a.id !== app.id));
            setStats(prev => ({
                ...prev,
                pendingSellers: prev.pendingSellers - 1,
                activeSellers: act === 'approve' ? prev.activeSellers + 1 : prev.activeSellers
            }));
        } catch (error: any) {
            toast(error.message || 'Operation failed', 'error');
        } finally {
            setActioningId(null);
        }
    };

    if (authLoading || loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300 pt-0 pb-20 overflow-x-hidden">
            
            {/* Live System Ticker */}
            <SystemTicker />

            <div className="container px-4 mx-auto max-w-7xl pt-16 space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-border pb-12 relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Operational Command</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Mission <span className="text-primary">Control</span>
                        </h1>
                        <p className="text-muted-foreground font-medium italic flex items-center gap-3">
                             {isTechAdmin ? 'Infra Status: NOMINAL' : isMarketingAdmin ? 'Growth Velocity: HIGH' : 'Ops State: SYNCHRONIZED'} // <span className="text-foreground font-black uppercase tracking-tight">{stats.totalUsers.toLocaleString()} Nodes Monitored</span>
                             <span className="hidden md:inline text-white/10">//</span>
                             <span className="hidden md:flex items-center gap-1.5 text-primary text-[10px] uppercase font-black cursor-pointer hover:opacity-80 transition-opacity"><Search className="h-3 w-3" /> Cmd+K Search</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 relative z-10">
                        <Link href="/admin/executive-chat">
                            <Button variant="outline" className="h-14 px-8 border-border text-foreground hover:bg-muted rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm">
                                <MessageSquare className="h-4 w-4 mr-3 text-primary" /> Secure Relay
                            </Button>
                        </Link>
                        <Link href={isTechAdmin ? '/admin/technical' : isMarketingAdmin ? '/admin/marketing' : '/admin/operations'}>
                            <Button className="h-14 px-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-2xl font-black uppercase text-[10px] tracking-widest border shadow-xl shadow-primary/5">
                                <Activity className="h-4 w-4 mr-3" /> Role Hub
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Network Population', value: stats.totalUsers, icon: Users, sub: 'Total User Nodes', color: 'text-blue-500' },
                        { label: 'Validated Entities', value: stats.activeSellers, icon: UserCheck, sub: 'Verified Dealers', color: 'text-green-500' },
                        { label: 'Live Inventory', value: stats.activeListings, icon: ShoppingBag, sub: 'Active Assets', color: 'text-orange-500' },
                        { label: 'Queue Pressure', value: stats.pendingSellers, icon: AlertTriangle, sub: 'Pending Verifications', color: 'text-primary' },
                    ].map((kpi, i) => (
                        <Card key={i} className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden transition-all hover:border-primary/20 group">
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${kpi.color}`}>
                                <kpi.icon className="h-24 w-24" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{kpi.label}</p>
                            <div className="text-4xl font-black text-foreground italic font-heading tracking-tighter mb-2">{kpi.value.toLocaleString()}</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">{kpi.sub}</p>
                        </Card>
                    ))}
                </div>

                {/* Ascension: Geospatial Pulse & System Protocols */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <AdminMap />
                    
                    <div className="flex flex-col gap-10">
                        {/* Role-Engineered Secondary Card */}
                        {isTechAdmin ? (
                            <Card className="bg-card border-border shadow-sm rounded-[3rem] p-10 h-full flex flex-col justify-between group hover:border-primary/20 transition-all">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Live Telemetry</h4>
                                    <h3 className="text-3xl font-black uppercase italic tracking-tighter font-heading">Infrastructure Pulse</h3>
                                    <div className="grid grid-cols-2 gap-6 mt-8">
                                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">DB Connectivity</p>
                                            <p className="text-2xl font-black italic text-green-500">NOMINAL</p>
                                        </div>
                                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Auth Latency</p>
                                            <p className="text-2xl font-black italic text-primary">32ms</p>
                                        </div>
                                    </div>
                                </div>
                                <Link href="/admin/technical" className="mt-8">
                                    <Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Open Backend Console</Button>
                                </Link>
                            </Card>
                        ) : isMarketingAdmin ? (
                            <Card className="bg-card border-border shadow-sm rounded-[3rem] p-10 h-full flex flex-col justify-between group hover:border-primary/20 transition-all">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Growth Forecast</h4>
                                    <h3 className="text-3xl font-black uppercase italic tracking-tighter font-heading">Conversion Vector</h3>
                                    <div className="mt-8 flex items-end gap-2 h-24">
                                        {[40, 60, 45, 90, 65, 80, 55].map((h, i) => (
                                            <div key={i} className="flex-1 bg-primary/20 hover:bg-primary transition-colors rounded-t-lg" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4 italic">+18% Weekly Retention Growth</p>
                                </div>
                                <Link href="/admin/marketing" className="mt-8">
                                    <Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Analyze Trajectory</Button>
                                </Link>
                            </Card>
                        ) : (
                            <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-colors duration-300 h-full flex items-center p-8">
                                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`flex items-center justify-center h-20 w-20 rounded-3xl ${isDemoMode ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary shadow-lg shadow-primary/5'}`}>
                                            <Power className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">System Protocols</h3>
                                            <p className="text-sm text-muted-foreground font-medium italic">Environment state Monitoring</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {isDemoMode ? (
                                            <div className="space-y-1">
                                                <Badge className="bg-orange-500/20 text-orange-500 border-none font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-full">BETA DEMO ACTIVE</Badge>
                                                <p className="text-[10px] text-muted-foreground uppercase opacity-80 italic mt-2">Expires in {daysLeft} Days</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                 <Badge className="bg-green-500/20 text-green-500 border-none font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-full">PRODUCTION LIVE</Badge>
                                                 <p className="text-[10px] text-muted-foreground uppercase opacity-80 italic mt-2">Core Synchronized</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}

                        <Card className="bg-primary text-primary-foreground border-none shadow-[0_20px_60px_rgba(255,98,0,0.15)] rounded-[3rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-60">Operations Alert</h4>
                            <p className="text-2xl font-black italic tracking-tighter font-heading mb-4">Verification Spike Detected</p>
                            <p className="text-xs opacity-80 leading-relaxed mb-6 italic max-w-sm">
                                System reporting {applications.length || 'active'} incoming seller signals from Campus Hubs. Immediate validation priority.
                            </p>
                            <Link href="/admin/operations">
                                <Button className="bg-white text-primary hover:bg-white/90 font-black h-12 px-8 rounded-xl uppercase text-[10px] tracking-widest border-none">
                                    Resolve Queue
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* Role-Specific Main Section */}
                    {isTechAdmin ? (
                         <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">Event <span className="text-primary">Audit Stream</span></h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Real-time Backend Intelligence</p>
                                </div>
                                <Terminal className="h-6 w-6 text-primary" />
                            </CardHeader>
                            <div className="divide-y divide-border">
                                {auditLogs.length === 0 ? (
                                    <div className="p-32 text-center">
                                        <Activity className="h-16 w-16 text-muted-foreground/10 mx-auto mb-6" />
                                        <h4 className="text-muted-foreground font-black uppercase tracking-widest text-[10px] opacity-30 italic">No Events Logged</h4>
                                    </div>
                                ) : (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="p-8 hover:bg-muted/5 transition-all group flex items-start gap-6 font-mono">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[11px] font-black text-foreground uppercase tracking-wider">{log.action_type || 'SYSTEM_EVENT'}</p>
                                                    <span className="text-[8px] text-muted-foreground italic font-sans">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[9px] text-muted-foreground/80 lowercase italic break-all max-w-2xl">{JSON.stringify(log.details)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <Link href="/admin/technical" className="block text-center p-6 text-[10px] font-black uppercase tracking-[0.6em] text-primary hover:bg-primary/5 transition-all">
                                    Deep System Audit
                                </Link>
                            </div>
                         </Card>
                    ) : isMarketingAdmin ? (
                        <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">Onboarding <span className="text-primary">Registry</span></h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Recent User Acquisitions</p>
                                </div>
                                <Rocket className="h-6 w-6 text-primary" />
                            </CardHeader>
                            <div className="divide-y divide-border">
                                {recentSignups.map((s, i) => (
                                    <div key={s.id} className="p-8 hover:bg-muted/5 transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-foreground italic tracking-tight">{s.email}</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 italic">{s.role} // CID-{s.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-border text-[9px] font-black uppercase h-8 px-4">New Signal</Badge>
                                    </div>
                                ))}
                                <Link href="/admin/marketing" className="block text-center p-6 text-[10px] font-black uppercase tracking-[0.6em] text-primary hover:bg-primary/5 transition-all">
                                    Growth Trajectory Overview
                                </Link>
                            </div>
                        </Card>
                    ) : (
                        <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-all duration-500 ring-2 ring-primary/20 shadow-xl shadow-primary/5">
                            <CardHeader className="p-10 border-b border-border bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">
                                            Action <span className="text-primary">Required</span>
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Critical Entity Verifications</p>
                                    </div>
                                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black h-8 px-4 rounded-full">
                                        {stats.pendingSellers} Pending
                                    </Badge>
                                </div>
                            </CardHeader>
                            <div className="divide-y divide-border">
                                {applications.length === 0 ? (
                                    <div className="p-32 text-center">
                                        <UserCheck className="h-16 w-16 text-muted-foreground/10 mx-auto mb-6" />
                                        <h4 className="text-muted-foreground font-black uppercase tracking-widest text-[10px] opacity-30 italic">Queue Cleared</h4>
                                    </div>
                                ) : (
                                    applications.map(app => (
                                        <div key={app.id} className="p-10 hover:bg-muted/5 transition-colors group flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                            <div className="flex gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                                                    <UserCheck className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-foreground italic tracking-tighter uppercase text-lg group-hover:text-primary transition-colors font-heading">{app.full_name || app.name || 'Unknown Node'}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1 opacity-60 italic">
                                                        {app.student_email || app.email} // {app.university || app.campus}
                                                    </p>
                                                    <div className="flex gap-4 mt-4">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border bg-background h-6 px-3">{app.business_type}</Badge>
                                                        {app.id_card_url && (
                                                            <a href={app.id_card_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2">
                                                                Ingest ID Data <ArrowUpRight className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 w-full md:w-auto">
                                                <Button
                                                    size="lg"
                                                    onClick={() => handleAction(app, 'approve')}
                                                    disabled={actioningId === app.id}
                                                    className="bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-14 px-8 rounded-2xl border-none shadow-lg shadow-primary/10 flex-1 md:flex-initial"
                                                >
                                                    {actioningId === app.id ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Authorize'}
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    onClick={() => handleAction(app, 'reject')}
                                                    disabled={actioningId === app.id}
                                                    className="border-red-500/20 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-2xl flex-1 md:flex-initial"
                                                >
                                                    Veto
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <Link href="/admin/operations" className="block text-center p-6 text-[10px] font-black uppercase tracking-[0.6em] text-primary hover:bg-primary/5 transition-all">
                                    Full Operations Hub
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Shared Intel Relay */}
                    <div className="space-y-10">
                        <Card className={`bg-card dark:bg-black text-foreground dark:text-white border-border dark:border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[520px] transition-all duration-500 ${isTechAdmin || isMarketingAdmin ? 'ring-2 ring-primary/20' : ''}`}>
                            <div className="p-8 bg-muted/50 dark:bg-zinc-950/50 flex items-center justify-between border-b border-border dark:border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/50 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Intel Relay
                                </h3>
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div className="p-8 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 dark:opacity-20">
                                        <Activity className="h-10 w-10 mb-4" />
                                        <p className="italic text-[10px] uppercase font-black tracking-widest text-center">No Signals Detected</p>
                                    </div>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="bg-muted/30 dark:bg-white/5 p-6 rounded-3xl border border-border/50 dark:border-white/10 hover:bg-muted/60 dark:hover:bg-white/10 transition-all group">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="font-black text-primary group-hover:scale-105 transition-transform text-[10px] uppercase tracking-widest">{msg.sender?.display_name || 'ENCRYPTED'}</p>
                                                <span className="text-[8px] font-bold text-muted-foreground dark:text-white/30">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-foreground/80 dark:text-white/70 italic text-xs leading-relaxed">"{msg.content}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link href="/admin/executive-chat" className="p-6 bg-primary text-primary-foreground text-center font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all shadow-inner">
                                Open Comm Terminal
                            </Link>
                        </Card>

                        {/* Node Repositories */}
                        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-10 space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                                <ShieldCheck className="h-4 w-4 text-primary" /> System Nodes
                            </h3>
                            <div className="grid gap-3">
                                {[
                                    { label: 'Technical Flow', href: '/admin/technical', icon: ShieldCheck, desc: 'Infrastructure telemetry' },
                                    { label: 'Operations Hub', href: '/admin/operations', icon: Activity, desc: 'Transactional control' },
                                    { label: 'Marketing Vector', href: '/admin/marketing', icon: Zap, desc: 'Growth trajectory' },
                                ].map((hub, i) => (
                                    <Link key={i} href={hub.href} className="group flex items-center gap-6 p-5 rounded-2xl bg-muted/40 border border-border hover:border-primary/40 hover:bg-muted/60 transition-all">
                                        <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-border/50">
                                            <hub.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase text-foreground italic font-heading tracking-tight">{hub.label}</p>
                                            <p className="text-[9px] font-medium text-muted-foreground uppercase opacity-40 italic">{hub.desc}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="text-center py-20 opacity-20 hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Strategic Ingress // Nigeria Node Prime Active // MMXXVI</p>
                </div>
            </div>
        </div>
    );
}
