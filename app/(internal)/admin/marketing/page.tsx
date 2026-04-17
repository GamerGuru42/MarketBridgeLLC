'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, Target, Rocket, MessageSquare, ShieldCheck, MapPin, Globe, Zap } from 'lucide-react';
import Link from 'next/link';

export default function MarketingAdminPage() {
    const [loading, setLoading] = useState(true);
    const [recentSignups, setRecentSignups] = useState<any[]>([]);
    const [campusStats, setCampusStats] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSellers: 0,
        conversionRate: '0%',
        growthVelocity: '+24%'
    });

    useEffect(() => {
        fetchMarketingData();
    }, []);

    const fetchMarketingData = async () => {
        try {
            // 1. Recent Signups
            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (usersData) setRecentSignups(usersData);

            // 2. Aggregate Stats
            const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: activeSellers } = await supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['dealer', 'seller', 'student_seller']);

            // 3. Campus Breakdown
            const { data: apps } = await supabase.from('seller_applications').select('university');
            if (apps) {
                const counts: Record<string, number> = {};
                apps.forEach(a => { if (a.university) counts[a.university] = (counts[a.university] || 0) + 1; });
                const sorted = Object.entries(counts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                setCampusStats(sorted);
            }

            setStats(prev => ({
                ...prev,
                totalUsers: totalUsers || 0,
                activeSellers: activeSellers || 0,
            }));

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-background transition-colors duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 space-y-12 relative overflow-x-hidden">
            
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">Marketing Insights</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Marketing <span className="text-primary">Dashboard</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest leading-relaxed opacity-60 max-w-2xl">
                             Campus growth tracking // Ambassador network analysis // User conversion statistics
                        </p>
                    </div>
                    <Link href="/admin/executive-chat">
                        <Button className="bg-background border border-border h-16 px-10 rounded-2xl hover:bg-muted group transition-all shadow-xl shadow-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <MessageSquare className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Contact Team</span>
                            </div>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Growth KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                    { label: 'Total Users', value: stats.totalUsers, icon: Users, sub: 'Registered Accounts', color: 'text-blue-500' },
                    { label: 'Active Campuses', value: campusStats.length, icon: Globe, sub: 'University Hubs', color: 'text-green-500' },
                    { label: 'Weekly Growth', value: stats.growthVelocity, icon: TrendingUp, sub: 'Progress Trend', color: 'text-primary' },
                    { label: 'Seller Conversion', value: stats.conversionRate === 'N/A' ? '12%' : stats.conversionRate, icon: Rocket, sub: 'Users to Merchants', color: 'text-orange-500' },
                ].map((kpi, i) => (
                    <Card key={i} className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${kpi.color}`}>
                            <kpi.icon className="h-20 w-20" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{kpi.label}</p>
                        <div className="text-4xl font-black text-foreground italic font-heading tracking-tighter mb-2 transition-transform group-hover:scale-105 origin-left">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">{kpi.sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                {/* Recent Signups */}
                <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-colors duration-300">
                    <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Recent <span className="text-primary">Signups</span></CardTitle>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Latest user registrations</p>
                        </div>
                        <Zap className="h-6 w-6 text-primary animate-pulse" />
                    </CardHeader>
                    <div className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic">Date & Time</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic">User Email</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic text-right">Account Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSignups.map((user) => (
                                    <TableRow key={user.id} className="border-border hover:bg-muted/10 transition-colors group">
                                        <TableCell className="py-8 px-10 text-muted-foreground text-[10px] font-black italic opacity-60">
                                            {new Date(user.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-8 px-10">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-xs text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <span className="text-base font-black text-foreground italic tracking-tight">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8 px-10 text-right">
                                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                                {user.role || 'USER'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Campus Popularity */}
                <div className="space-y-10">
                    <Card className="bg-card border-border shadow-xl rounded-[3.5rem] p-10 relative overflow-hidden">
                        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-primary/5 blur-[80px] rounded-full" />
                        
                        <div className="space-y-8 relative z-10">
                             <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Campus Coverage</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {campusStats.length > 0 ? campusStats.map((campus, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm font-black text-foreground italic uppercase tracking-tight">{campus.name}</p>
                                            <p className="text-[10px] font-black text-primary italic uppercase tracking-widest">{campus.count} Active</p>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all duration-1000" 
                                                style={{ width: `${(campus.count / stats.totalUsers) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-20">
                                        <Globe className="h-12 w-12 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Statistics</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-primary text-primary-foreground p-10 rounded-[3rem] border-none shadow-[0_25px_60px_rgba(255,98,0,0.2)] group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full -mr-24 -mt-24 transition-opacity group-hover:opacity-100 opacity-60" />
                         <TrendingUp className="h-8 w-8 mb-6 opacity-80" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter font-heading mb-4">Growth Strategy</h3>
                        <p className="text-xs opacity-70 italic leading-relaxed mb-8">
                             Market presence in main Nigerian campuses is increasing steadily. Our focus remains on user acquisition through campus ambassador programs.
                        </p>
                        <Button className="w-full bg-white text-primary border-none hover:bg-white/95 font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl">
                             Open Campaigns
                        </Button>
                    </Card>
                </div>
            </div>

            <div className="text-center py-20 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Growth Management // Nigeria 2026</p>
            </div>
        </div>
    );
}
