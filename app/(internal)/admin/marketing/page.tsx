'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Target, Crown, MessageSquare, MapPin, Globe, Zap, Coins, Gift, Megaphone, ShoppingBag, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MarketingAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [recentSignups, setRecentSignups] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBuyers: 0,
        activeSellers: 0,
        newSignupsToday: 0,
        newSignupsWeek: 0,
    });
    const [ambassadorStats, setAmbassadorStats] = useState({
        total: 0, approved: 0, rejected: 0, pending: 0,
        perCampus: {} as Record<string, number>,
    });
    const [campusSellers, setCampusSellers] = useState<Record<string, number>>({});
    const [mcStats, setMcStats] = useState({ totalIssued: 0, totalRedeemed: 0 });

    useEffect(() => {
        const ALLOWED = ['marketing_admin', 'ceo', 'cofounder'];
        if (!authLoading && (!user || !ALLOWED.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchMarketingData();
    }, [user]);

    const fetchMarketingData = async () => {
        try {
            // Users
            const { data: allUsers } = await supabase.from('users').select('id, email, role, created_at, coins_balance');
            const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });

            if (allUsers) {
                const sellers = allUsers.filter(u => u.role === 'student_seller');
                const buyers = allUsers.filter(u => ['buyer', 'student_buyer', 'customer'].includes(u.role));
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
                
                setStats({
                    totalUsers: totalUsers || 0,
                    totalBuyers: buyers.length,
                    activeSellers: sellers.length,
                    newSignupsToday: allUsers.filter(u => new Date(u.created_at) >= todayStart).length,
                    newSignupsWeek: allUsers.filter(u => new Date(u.created_at) >= weekStart).length,
                });

                // MarketCoins
                const totalCoins = allUsers.reduce((sum, u) => sum + Number(u.coins_balance || 0), 0);
                setMcStats({ totalIssued: totalCoins, totalRedeemed: 0 });

                // Campus seller distribution
                const dist: Record<string, number> = {};
                sellers.forEach(s => {
                    const email = s.email?.toLowerCase() || '';
                    let campus = '';
                    if (email.includes('baze')) campus = 'Baze University';
                    else if (email.includes('nile')) campus = 'Nile University';
                    else if (email.includes('veritas')) campus = 'Veritas University';
                    else if (email.includes('cosmopolitan')) campus = 'Cosmopolitan University';
                    if (campus) dist[campus] = (dist[campus] || 0) + 1;
                });
                setCampusSellers(dist);
            }

            // Recent signups
            const { data: recent } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            if (recent) setRecentSignups(recent);

            // Ambassadors
            const { data: ambAll } = await supabase.from('ambassador_applications').select('*');
            if (ambAll) {
                const perCampus: Record<string, number> = {};
                const approved = ambAll.filter(a => a.status === 'approved' || a.status === 'active');
                approved.forEach(a => {
                    if (a.university) perCampus[a.university] = (perCampus[a.university] || 0) + 1;
                });
                setAmbassadorStats({
                    total: ambAll.length,
                    approved: approved.length,
                    rejected: ambAll.filter(a => a.status === 'rejected').length,
                    pending: ambAll.filter(a => a.status === 'pending').length,
                    perCampus,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) return (
        <div className="flex justify-center items-center h-screen bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-10 space-y-12 relative overflow-x-hidden">
            {/* Header */}
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Marketing Dashboard</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Acquisition & <span className="text-primary">Growth</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 max-w-2xl">
                            Ambassador programme // Sponsored listings // User acquisition // MarketCoins
                        </p>
                    </div>
                    <Link href="/admin/executive-chat">
                        <Button variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest border-border">
                            <MessageSquare className="h-4 w-4 mr-3 text-primary" /> Contact Team
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="ambassadors" className="space-y-12 relative z-10 w-full">
                <TabsList className="bg-card border border-border rounded-3xl p-2 h-auto md:h-20 w-full overflow-x-auto no-scrollbar shadow-sm flex flex-wrap md:flex-nowrap gap-1">
                    {[
                        { val: 'ambassadors', label: 'Ambassadors', icon: Crown },
                        { val: 'sponsored', label: 'Sponsored', icon: Megaphone },
                        { val: 'partnerships', label: 'Partnerships', icon: Globe },
                        { val: 'acquisition', label: 'Acquisition', icon: TrendingUp },
                        { val: 'coins', label: 'MarketCoins', icon: Coins },
                        { val: 'referrals', label: 'Referrals', icon: Gift },
                        { val: 'campaigns', label: 'Campaigns', icon: Zap },
                        { val: 'map', label: 'Sellers Map', icon: MapPin },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.val}
                            value={tab.val}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground uppercase font-black text-[9px] tracking-widest h-16 rounded-2xl transition-all px-4 md:px-5 flex items-center gap-2 border-none"
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Ambassador Programme Overview */}
                <TabsContent value="ambassadors" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Applications', value: ambassadorStats.total, color: 'text-blue-500' },
                            { label: 'Approved', value: ambassadorStats.approved, color: 'text-green-500' },
                            { label: 'Rejected', value: ambassadorStats.rejected, color: 'text-red-500' },
                            { label: 'Pending', value: ambassadorStats.pending, color: 'text-yellow-500' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className={`text-4xl font-black italic tracking-tighter ${m.color}`}>{m.value}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6">Active Ambassadors by <span className="text-primary">University</span></h3>
                        <div className="space-y-4">
                            {['Baze University', 'Nile University', 'Veritas University', 'Cosmopolitan University'].map(uni => (
                                <div key={uni} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <span className="font-black text-sm">{uni}</span>
                                    <span className="font-black text-primary text-lg">{ambassadorStats.perCampus[uni] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* Sponsored Listings */}
                <TabsContent value="sponsored" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Sponsored Listings <span className="text-primary">Manager</span></h3>
                        <p className="text-muted-foreground text-sm italic mb-6">View active boosted listings, approve/reject boost requests, and monitor performance.</p>
                        <div className="text-center py-16 opacity-20">
                            <Megaphone className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No sponsored listings active</p>
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Sponsored listings will appear here when sellers submit boost requests.</p>
                        </div>
                    </Card>
                </TabsContent>

                {/* Campus Brand Partnerships */}
                <TabsContent value="partnerships" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Campus Brand <span className="text-primary">Partnerships</span></h3>
                        <p className="text-muted-foreground text-sm italic mb-6">Manage brand partnerships with Nigerian FMCGs, telcos, and fintech companies for in-app placements.</p>
                        <div className="text-center py-16 opacity-20">
                            <Globe className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No active partnerships</p>
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Partnerships will be configured here once brand agreements are finalized.</p>
                        </div>
                    </Card>
                </TabsContent>

                {/* User Acquisition Stats */}
                <TabsContent value="acquisition" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Buyers', value: stats.totalBuyers, color: 'text-blue-500' },
                            { label: 'Verified Sellers', value: stats.activeSellers, color: 'text-green-500' },
                            { label: 'Signups Today', value: stats.newSignupsToday, color: 'text-primary' },
                            { label: 'Signups This Week', value: stats.newSignupsWeek, color: 'text-purple-500' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className={`text-4xl font-black italic tracking-tighter ${m.color}`}>{m.value}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Recent <span className="text-primary">Signups</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-4">
                            {recentSignups.map(u => (
                                <div key={u.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                            {(u.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <p className="font-bold text-sm">{u.email}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase px-3 py-1 rounded-lg">{u.role}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MarketCoins Overview */}
                <TabsContent value="coins" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-card border-border rounded-[2.5rem] p-8">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">Total MC Issued</p>
                            <p className="text-4xl font-black italic tracking-tighter text-primary">{mcStats.totalIssued.toLocaleString()}</p>
                        </Card>
                        <Card className="bg-card border-border rounded-[2.5rem] p-8">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">Total MC Redeemed</p>
                            <p className="text-4xl font-black italic tracking-tighter">{mcStats.totalRedeemed.toLocaleString()}</p>
                        </Card>
                        <Card className="bg-card border-border rounded-[2.5rem] p-8">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">Net MC in Circulation</p>
                            <p className="text-4xl font-black italic tracking-tighter text-green-500">{(mcStats.totalIssued - mcStats.totalRedeemed).toLocaleString()}</p>
                        </Card>
                    </div>
                </TabsContent>

                {/* Referral Programme */}
                <TabsContent value="referrals" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Gift className="h-6 w-6 text-primary" />
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Referral Programme <span className="text-primary">Tracker</span></h3>
                        </div>
                        <div className="flex items-center gap-3 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">Coming Soon — Referral programme tracking will activate when the system launches.</p>
                        </div>
                    </Card>
                </TabsContent>

                {/* Content and Campaign Tools */}
                <TabsContent value="campaigns" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Content & Campaign <span className="text-primary">Tools</span></h3>
                        <p className="text-muted-foreground text-sm italic mb-6">Create, schedule, and manage promotional banners and announcements on the marketplace.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Campaigns</p>
                                <p className="text-3xl font-black italic">0</p>
                                <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest w-full">Create Campaign</Button>
                            </div>
                            <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduled</p>
                                <p className="text-3xl font-black italic">0</p>
                                <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest w-full">Schedule Banner</Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Onboarded Sellers Map */}
                <TabsContent value="map" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Onboarded Sellers <span className="text-primary">Map</span></h3>
                        <p className="text-muted-foreground text-sm italic mb-8">Abuja FCT — verified sellers grouped by campus hub. Only campuses with registered sellers appear.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {Object.entries(campusSellers).length === 0 ? (
                                <div className="col-span-2 text-center py-16 opacity-20">
                                    <MapPin className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No verified sellers from any campus yet</p>
                                </div>
                            ) : Object.entries(campusSellers).map(([campus, count]) => (
                                <div key={campus} className="p-6 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                                        <div>
                                            <p className="font-black text-sm">{campus}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">Active Campus Hub</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black italic text-primary">{count}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Registered Buyers</p>
                            <p className="text-5xl font-black italic text-foreground">{stats.totalBuyers.toLocaleString()}</p>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center py-20 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Growth Management // Nigeria 2026</p>
            </div>
        </div>
    );
}
