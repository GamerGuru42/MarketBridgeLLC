'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, ShieldCheck, UserCheck, AlertTriangle, ChevronRight, Activity, Users, ShoppingBag, Zap, MessageSquare, ArrowUpRight, Power, MapPin, TrendingUp, Search, Terminal, Globe, Rocket, HelpCircle, RefreshCw
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

// Component names remain technical, but UI text is simplified
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
        buyerCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    // Role-specific check
    const isOpsAdmin = user?.role === 'operations_admin' || user?.role === 'ceo' || user?.role === 'admin';
    const isTechAdmin = user?.role === 'technical_admin';
    const isMarketingAdmin = user?.role === 'marketing_admin';

    const [campusStats, setCampusStats] = useState<Record<string, number>>({});

    useEffect(() => {
        const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];
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
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { data: allUsers } = await supabase.from('users').select('email, role');
            
            const sellers = allUsers?.filter(u => u.role === 'student_seller' || u.role === 'seller') || [];
            const buyers = allUsers?.filter(u => u.role === 'student_buyer' || u.role === 'buyer') || [];
            
            const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');

            // Aggregate sellers by campus (via email domain)
            const distribution: Record<string, number> = {};
            sellers.forEach(s => {
                const email = s.email?.toLowerCase() || '';
                let school = 'Unknown';
                if (email.includes('baze')) school = 'Baze University';
                else if (email.includes('nile')) school = 'Nile University';
                else if (email.includes('veritas')) school = 'Veritas University';
                else if (email.includes('uniabuja')) school = 'University of Abuja';
                else if (email.includes('cosmopolitan')) school = 'Cosmopolitan University';
                
                if (school !== 'Unknown') {
                    distribution[school] = (distribution[school] || 0) + 1;
                }
            });
            setCampusStats(distribution);

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
                activeSellers: sellers.length,
                activeListings: listingsCount || 0,
                buyerCount: buyers.length
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

            toast(`Seller ${act}ed successfully!`, 'success');
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
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pt-0 pb-20 overflow-x-hidden">
            
            {/* System Status Ticker */}
            <SystemTicker />

            <div className="container px-4 mx-auto max-w-7xl pt-16 space-y-12">

                {/* Header (Simplified Language) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-border pb-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Admin Control Panel</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-foreground font-heading">
                             General <span className="text-primary">Dashboard</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-6">
                            <p className="text-muted-foreground font-bold italic text-sm">
                                {stats.totalUsers.toLocaleString()} Total Users 
                                <span className="mx-4 text-border">/</span>
                                Status: {isTechAdmin ? 'Healthy' : 'Operational'}
                            </p>
                            <div className="hidden md:flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-primary cursor-pointer hover:bg-muted/50 transition-all">
                                <Search className="h-3 w-3" /> Search Records (Cmd+K)
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href="/admin/executive-chat">
                            <Button variant="outline" className="h-14 px-8 border-border text-foreground hover:bg-muted rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm">
                                <MessageSquare className="h-4 w-4 mr-3 text-primary" /> Team Chat
                            </Button>
                        </Link>
                        {isOpsAdmin && (
                            <Link href="/admin/operations">
                                <Button className="h-14 px-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-2xl font-black uppercase text-[10px] tracking-widest border shadow-xl shadow-primary/5">
                                    <Activity className="h-4 w-4 mr-3" /> Operations Hub
                                </Button>
                            </Link>
                        )}
                        {isTechAdmin && (
                            <Link href="/admin/technical">
                                <Button className="h-14 px-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-2xl font-black uppercase text-[10px] tracking-widest border shadow-xl shadow-primary/5">
                                    <Zap className="h-4 w-4 mr-3" /> Technical Hub
                                </Button>
                            </Link>
                        )}
                        {isMarketingAdmin && (
                            <Link href="/admin/marketing">
                                <Button className="h-14 px-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-2xl font-black uppercase text-[10px] tracking-widest border shadow-xl shadow-primary/5">
                                    <TrendingUp className="h-4 w-4 mr-3" /> Marketing Hub
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Accounts', value: stats.totalUsers, icon: Users, sub: 'All Registered Users', color: 'text-blue-500', show: true },
                        { label: 'Verified Sellers', value: stats.activeSellers, icon: UserCheck, sub: 'Active Business Accounts', color: 'text-green-500', show: true },
                        { label: 'Live Products', value: stats.activeListings, icon: ShoppingBag, sub: 'Items listed on site', color: 'text-orange-500', show: isOpsAdmin || isMarketingAdmin },
                        { label: 'Action Required', value: stats.pendingSellers, icon: AlertTriangle, sub: 'Waiting for Approval', color: 'text-primary', show: isOpsAdmin },
                    ].filter(kpi => kpi.show).map((kpi, i) => (
                        <Card key={i} className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden transition-all hover:border-primary/20 group">
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${kpi.color}`}>
                                <kpi.icon className="h-20 w-20" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{kpi.label}</p>
                            <div className="text-4xl font-black text-foreground italic font-heading tracking-tighter mb-2">{kpi.value.toLocaleString()}</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">{kpi.sub}</p>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Active Regions Map (Simplified Labels) */}
                    <AdminMap 
                        distribution={campusStats} 
                        buyerCount={stats.buyerCount} 
                    />
                    
                    <div className="flex flex-col gap-10">
                        {/* Status Module */}
                        <Card className="bg-card border-border shadow-sm rounded-[3rem] p-10 h-full flex flex-col justify-between group hover:border-primary/20 transition-all">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Platform Status</h4>
                                    <h3 className="text-3xl font-black uppercase italic tracking-tighter font-heading">Current Health</h3>
                                    <div className="grid grid-cols-2 gap-6 mt-8">
                                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Database Connection</p>
                                            <p className="text-2xl font-black italic text-green-500">EXCELLENT</p>
                                        </div>
                                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Server Response</p>
                                            <p className="text-2xl font-black italic text-primary">Normal</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">All systems live</span>
                                    </div>
                                    <HelpCircle className="h-5 w-5 text-muted-foreground/30" />
                                </div>
                        </Card>

                        {/* Notifications Module */}
                        {isOpsAdmin && applications.length > 0 && (
                            <Card className="bg-primary text-primary-foreground border-none shadow-[0_20px_60px_rgba(255,98,0,0.15)] rounded-[3rem] p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-60">System Notification</h4>
                                <p className="text-2xl font-black italic tracking-tighter font-heading mb-4">Pending Seller Approvals</p>
                                <p className="text-xs opacity-80 leading-relaxed mb-6 italic max-w-sm">
                                    There are currently {applications.length} sellers waiting for verification. Please check the list below or go to the Operations page.
                                </p>
                                <Link href="/admin/operations">
                                    <Button className="bg-white text-primary hover:bg-white/90 font-black h-12 px-8 rounded-xl uppercase text-[10px] tracking-widest border-none">
                                        View Requests
                                    </Button>
                                </Link>
                            </Card>
                        )}

                        {!isOpsAdmin && (
                             <Card className="bg-secondary/40 border-border border shadow-sm rounded-[3rem] p-10 relative overflow-hidden group">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 text-muted-foreground">Department Note</h4>
                                <p className="text-2xl font-black italic tracking-tighter font-heading mb-4 text-foreground">Active <span className="text-primary">Session</span></p>
                                <p className="text-xs text-muted-foreground leading-relaxed italic max-w-sm">
                                    Your {user?.role?.replace('_', ' ')} clearance is active. All system interfaces are optimized for your current department duties.
                                </p>
                             </Card>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* Role-Based Tables (Simplified Terminology) */}
                    {isTechAdmin ? (
                         <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">System <span className="text-primary">Logs</span></h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Recent account and system activity</p>
                                </div>
                                <Terminal className="h-6 w-6 text-primary" />
                            </CardHeader>
                            <div className="divide-y divide-border">
                                {auditLogs.length === 0 ? (
                                    <div className="p-32 text-center opacity-20">
                                        <Activity className="h-16 w-16 mx-auto mb-6" />
                                        <h4 className="text-muted-foreground font-black uppercase tracking-widest text-[10px] italic">No activity recorded</h4>
                                    </div>
                                ) : (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="p-8 hover:bg-muted/5 transition-all group flex items-start gap-6 font-mono">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                                                    <p>{log.action_type || 'ACCOUNT_ACTION'}</p>
                                                    <span className="text-[8px] text-muted-foreground font-sans">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[9px] text-muted-foreground/80 italic break-all max-w-2xl">{JSON.stringify(log.details)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                         </Card>
                    ) : (
                        <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-all duration-500 shadow-xl shadow-primary/5">
                            <CardHeader className="p-10 border-b border-border bg-muted/30 flex justify-between items-center flex-row">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">
                                        Pending <span className="text-primary">Approvals</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Sellers waiting to join the platform</p>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black h-8 px-4 rounded-full">
                                    {stats.pendingSellers} Waiting
                                </Badge>
                            </CardHeader>
                            <div className="divide-y divide-border">
                                {applications.length === 0 ? (
                                    <div className="p-32 text-center opacity-20">
                                        <UserCheck className="h-16 w-16 mx-auto mb-6" />
                                        <h4 className="text-muted-foreground font-black uppercase tracking-widest text-[10px] italic">List is empty</h4>
                                    </div>
                                ) : (
                                    applications.map(app => (
                                        <div key={app.id} className="p-10 hover:bg-muted/5 transition-colors group flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                            <div className="flex gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                                                    <UserCheck className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-foreground italic tracking-tighter uppercase text-lg group-hover:text-primary transition-colors font-heading">{app.full_name || app.name || 'Unknown User'}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1 opacity-60 italic">
                                                        {app.university || app.campus}
                                                    </p>
                                                    <div className="flex gap-4 mt-4">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border bg-background h-6 px-3">{app.business_type}</Badge>
                                                        {app.id_card_url && (
                                                            <a href={app.id_card_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2">
                                                                Check ID <ArrowUpRight className="h-3 w-3" />
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
                                                    className="bg-primary hover:opacity-90 text-primary-foreground font-black uppercase text-[10px] h-14 px-8 rounded-2xl border-none shadow-lg shadow-primary/10 flex-1 md:flex-initial"
                                                >
                                                    {actioningId === app.id ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    onClick={() => handleAction(app, 'reject')}
                                                    disabled={actioningId === app.id}
                                                    className="border-red-500/20 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] h-14 px-8 rounded-2xl flex-1 md:flex-initial"
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Right Column Modules */}
                    <div className="space-y-10">
                        {/* Demo Mode Management (Consolidated) */}
                        <Card className="bg-[#FF6200]/5 border-[#FF6200]/20 shadow-xl shadow-primary/5 rounded-[2.5rem] p-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Live System Control</h4>
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter font-heading">Demo <span className="text-primary">Shield</span></h3>
                            
                            <div className="p-6 bg-white dark:bg-black/40 border border-[#FF6200]/10 rounded-3xl space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Status</p>
                                        <p className="text-xl font-black text-primary italic uppercase">{isDemoMode ? 'Active / Private Beta' : 'Production Live'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Time Remaining</p>
                                        <p className="text-xl font-black text-foreground italic">{daysLeft} Days</p>
                                    </div>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-primary h-full transition-all duration-1000" 
                                        style={{ width: `${(daysLeft / 30) * 100}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground font-medium italic leading-relaxed">
                                    β Phase Protection: ₦5,000 Transaction Cap & Paystack Test Mode are currently enforced.
                                </p>
                            </div>

                            <Button 
                                onClick={async () => {
                                    if (!confirm('Are you sure you want to reset the 30-day demo period? This will restart the countdown from today.')) return;
                                    try {
                                        const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
                                        if (res.ok) {
                                            toast('Demo period reset successfully!', 'success');
                                            window.location.reload();
                                        }
                                    } catch (e) { toast('Reset failed.', 'error'); }
                                }}
                                className="w-full h-14 bg-primary text-black hover:bg-primary/90 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                            >
                                <RefreshCw className="h-4 w-4 mr-3" /> Reset 30-Day Window
                            </Button>
                        </Card>

                        {/* Messages Hub */}
                        <Card className="bg-card dark:bg-black text-foreground dark:text-white border-border dark:border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[400px]">
                            <div className="p-8 bg-muted/50 dark:bg-zinc-950/50 flex items-center justify-between border-b border-border dark:border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/50 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary" /> Team Updates
                                </h3>
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div className="p-8 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-20">
                                        <MessageSquare className="h-10 w-10 mb-4" />
                                        <p className="italic text-[10px] uppercase font-black text-center">No messages</p>
                                    </div>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="bg-muted/30 dark:bg-white/5 p-6 rounded-3xl border border-border/50 dark:border-white/10 hover:bg-muted/60 transition-all group">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="font-black text-primary text-[10px] uppercase">{msg.sender?.display_name || 'Admin'}</p>
                                                <span className="text-[8px] font-bold text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-foreground/80 dark:text-white/70 italic text-xs leading-relaxed">"{msg.content}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link href="/admin/executive-chat" className="p-6 bg-primary text-primary-foreground text-center font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all">
                                Open Chat Hub
                            </Link>
                        </Card>
                    </div>
                </div>

                <div className="text-center py-20 opacity-20">
                    <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Administrator Interface // 2026</p>
                </div>
            </div>
        </div>
    );
}
