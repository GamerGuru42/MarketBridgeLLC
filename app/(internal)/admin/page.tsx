'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, ShieldCheck, XCircle, Search, UserCheck, Check, AlertTriangle, ChevronRight, Activity, Users, ShoppingBag, Zap, LayoutDashboard, MessageSquare
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface Application {
    id: string;
    user_id: string;
    full_name?: string;
    name?: string;
    email?: string;
    student_email?: string;
    phone?: string;
    phone_number?: string;
    campus?: string;
    university?: string;
    business_type: string;
    sell_categories?: string[];
    categories?: string[];
    id_card_url: string;
    bio?: string;
    status: string;
    created_at: string;
}

export default function AdminHubPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingSellers: 0,
        activeSellers: 0,
        activeListings: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || !['admin', 'ceo', 'cofounder', 'operations_admin', 'technical_admin'].includes(user.role))) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: sellersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student_seller');
            const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');

            // 2. Fetch Pending Applications
            const { data: apps, count: pendCount } = await supabase
                .from('seller_applications')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                totalUsers: usersCount || 0,
                pendingSellers: pendCount || 0,
                activeSellers: sellersCount || 0,
                activeListings: listingsCount || 0,
            });
            setApplications(apps || []);
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
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pt-8 pb-20">
            <div className="container px-4 mx-auto max-w-7xl space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Operational Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                            Admin <span className="text-primary">Console</span>
                        </h1>
                        <p className="text-muted-foreground font-medium italic">
                            Monitoring {stats.totalUsers} users and {stats.activeSellers} verified dealers.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/executive-chat">
                            <Button variant="outline" className="border-border text-foreground hover:bg-muted h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Secure Messenger
                            </Button>
                        </Link>
                        <Link href="/admin/operations">
                            <Button className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border">
                                <Activity className="h-4 w-4 mr-2" /> Operations Hub
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                        { label: 'Active Sellers', value: stats.activeSellers, icon: UserCheck, color: 'text-green-500' },
                        { label: 'Live Listings', value: stats.activeListings, icon: ShoppingBag, color: 'text-orange-500' },
                        { label: 'Pending Apps', value: stats.pendingSellers, icon: AlertTriangle, color: 'text-primary' },
                    ].map((kpi, i) => (
                        <Card key={i} className="bg-card border-border shadow-sm rounded-3xl p-6 relative overflow-hidden transition-all hover:border-primary/20 group">
                            <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity ${kpi.color}`}>
                                <kpi.icon className="h-20 w-20" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4">{kpi.label}</p>
                            <div className="text-4xl font-black text-foreground italic font-heading tracking-tighter">{kpi.value.toLocaleString()}</div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Action Required: Pending Sellers */}
                    <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-muted/30 p-8 border-b border-border">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Action Required</CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-1">Pending Seller Verifications</CardDescription>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">{stats.pendingSellers} Pending</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {applications.length === 0 ? (
                                <div className="p-20 text-center">
                                    <UserCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h4 className="text-muted-foreground font-black uppercase tracking-widest text-xs">Queue Clear</h4>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {applications.map(app => (
                                        <div key={app.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-muted/20 transition-colors">
                                            <div className="flex gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0">
                                                    <UserCheck className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-foreground italic uppercase text-base">{app.full_name || app.name || 'Unknown'}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{app.student_email || app.email} // {app.university || app.campus}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border text-muted-foreground h-5">{app.business_type}</Badge>
                                                        {app.id_card_url && (
                                                            <a href={app.id_card_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center">
                                                                View ID Card
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 w-full md:w-auto">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAction(app, 'approve')}
                                                    disabled={actioningId === app.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border-none flex-1 md:flex-initial"
                                                >
                                                    {actioningId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(app, 'reject')}
                                                    disabled={actioningId === app.id}
                                                    className="border-red-500/20 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl flex-1 md:flex-initial"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.pendingSellers > 5 && (
                                        <Link href="/admin/operations" className="block text-center p-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors">
                                            View all {stats.pendingSellers} applications
                                        </Link>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Hubs */}
                    <div className="space-y-6">
                        <Card className="bg-card border-border shadow-sm rounded-3xl p-8 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3 w-3 text-primary" /> Command Hubs
                            </h3>
                            <div className="grid gap-3">
                                {[
                                    { label: 'Operations', href: '/admin/operations', icon: Activity, desc: 'Verifications & Support' },
                                    { label: 'Technical', href: '/admin/technical', icon: ShieldCheck, desc: 'Health & System Logs' },
                                    { label: 'Marketing', href: '/admin/marketing', icon: Zap, desc: 'Growth & Ads' },
                                    { label: 'User Mgmt', href: '/admin/users', icon: Users, desc: 'Accounts & Roles' },
                                ].map((hub, i) => (
                                    <Link key={i} href={hub.href} className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/30 hover:bg-muted/50 transition-all">
                                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                            <hub.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-foreground">{hub.label}</p>
                                            <p className="text-[9px] font-medium text-muted-foreground">{hub.desc}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        </Card>

                        <Card className="bg-primary text-primary-foreground rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-primary/10 transition-all hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <MessageSquare className="h-20 w-20" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2 relative z-10">Direct Messenger</h3>
                            <p className="text-xs font-medium opacity-80 mb-6 relative z-10 leading-relaxed">
                                Start a secure conversation with Operations, Technical, or Marketing leads instantly.
                            </p>
                            <Link href="/admin/executive-chat">
                                <Button className="w-full bg-white text-primary hover:bg-white/90 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl border-none">
                                    Open Chat
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
