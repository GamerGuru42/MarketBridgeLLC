'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, Target, Rocket, MessageSquare, ShieldCheck } from 'lucide-react';

export default function MarketingAdminPage() {
    const [loading, setLoading] = useState(true);
    const [recentSignups, setRecentSignups] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSellers: 0,
        conversionRate: '0%'
    });

    useEffect(() => {
        fetchMarketingData();
    }, []);

    const fetchMarketingData = async () => {
        try {
            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (usersData) setRecentSignups(usersData);

            const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: activeSellers } = await supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['dealer', 'seller', 'student_seller']);

            setStats({
                totalUsers: totalUsers || 0,
                activeSellers: activeSellers || 0,
                conversionRate: 'N/A'
            });

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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 space-y-10 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">Growth Intelligence</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic font-heading">
                        Marketing <span className="text-primary">Vector</span>
                    </h1>
                    <Button asChild className="bg-background border border-border h-14 px-8 rounded-2xl hover:bg-muted group transition-all shadow-sm">
                        <a href="/admin/executive-chat" className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Secure Messenger</span>
                            <MessageSquare className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </a>
                    </Button>
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest leading-relaxed opacity-60">
                    Ambassador Performance // Growth Metrics // Conversion Loop
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
                        <Users className="h-20 w-20" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4 text-primary">Total Users</p>
                    <div className="text-5xl font-black text-foreground italic font-heading tracking-tighter mb-4 transition-transform group-hover:scale-105 origin-left">
                        {stats.totalUsers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 italic font-heading">Live Network Node</span>
                    </div>
                </Card>

                <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
                        <Target className="h-20 w-20" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4 text-primary">Active Regions</p>
                    <div className="text-5xl font-black text-foreground italic font-heading tracking-tighter mb-4 transition-transform group-hover:scale-105 origin-left">
                        {stats.activeSellers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 italic font-heading">Campus Penetration</span>
                    </div>
                </Card>

                <Card className="bg-primary text-primary-foreground border-none shadow-[0_20px_50px_rgba(255,98,0,0.15)] rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-white">
                        <Rocket className="h-20 w-20" />
                    </div>
                    <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.3em] mb-4">Growth Velocity</p>
                    <div className="text-5xl font-black italic font-heading tracking-tighter mb-4 group-hover:scale-105 transition-transform origin-left">
                        +24%
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Upward Signal</span>
                    </div>
                </Card>
            </div>

            <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden relative z-10 transition-colors duration-300">
                <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Growth <span className="text-primary">Registry</span></CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 italic">Inbound User Signal History</p>
                        </div>
                        <Badge variant="outline" className="border-border text-primary text-[10px] font-black h-8 px-4 rounded-xl italic">Live Feed</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading">S/N</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading">User Identifier</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading text-right">Onboarding Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSignups.map((user, idx) => (
                                    <TableRow key={user.id} className="border-border hover:bg-muted/10 transition-colors group">
                                        <TableCell className="py-6 px-10 text-muted-foreground text-[10px] font-black font-mono italic">
                                            {String(idx + 1).padStart(2, '0')}
                                        </TableCell>
                                        <TableCell className="py-6 px-10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-[10px] text-primary">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-black text-foreground italic tracking-tight">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-right text-muted-foreground text-[10px] font-mono italic opacity-60 font-black">
                                            {new Date(user.created_at).toLocaleString().split(',').join(' //')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentSignups.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-32">
                                            <p className="text-muted-foreground font-black uppercase tracking-[0.5em] text-[10px] italic opacity-20">No user data in stream</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
