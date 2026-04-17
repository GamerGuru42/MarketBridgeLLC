'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Server, Globe, Database, Activity, AlertTriangle, Shield, Terminal, Cpu, Zap, Radio, MessageSquare, Code } from 'lucide-react';
import Link from 'next/link';

export default function TechnicalAdminPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    const [stats, setStats] = useState({
        uptime: '99.98%',
        apiLatency: '45ms',
        errorRate: '0.02%',
        serviceHealth: 'Operational'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const start = Date.now();
            const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).limit(1);
            const latency = Date.now() - start;

            setStats({
                uptime: error ? 'Degraded' : '100% (Online)',
                apiLatency: `${latency}ms`,
                errorRate: error ? 'High' : '0%',
                serviceHealth: 'Normal'
            });

            const { data: logsData } = await supabase
                .from('system_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(40);

            if (logsData) setLogs(logsData);
        } catch (e) {
            console.error(e);
            setStats(prev => ({ ...prev, uptime: 'Error' }));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-10 space-y-12 relative overflow-x-hidden">
            
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Terminal className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">Technical Health</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-tight md:leading-none">
                            System <span className="text-primary">Status</span>
                        </h1>
                        <p className="text-muted-foreground text-[10px] md:text-xs font-black uppercase tracking-widest leading-relaxed opacity-60 max-w-2xl">
                            Real-time analytics // Performance Monitoring // System Activity Logs
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="h-16 px-8 rounded-2xl border-border bg-card shadow-sm flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="text-left">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Administrator ID</p>
                                <p className="text-[12px] font-black text-foreground uppercase tracking-tighter">ADMIN-{user?.id?.slice(0, 4).toUpperCase() || 'STAFF'}</p>
                            </div>
                        </Badge>
                        <Link href="/admin/executive-chat">
                            <Button className="h-16 w-16 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-2xl flex items-center justify-center border shadow-xl shadow-primary/5">
                                <MessageSquare className="h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                    { label: 'Platform Uptime', value: stats.uptime, icon: Globe, color: 'text-green-500', desc: 'Main Site Availability' },
                    { label: 'Load Speed', value: stats.apiLatency, icon: Cpu, color: 'text-primary', desc: 'Database Response Time' },
                    { label: 'Error Rate', value: stats.errorRate, icon: AlertTriangle, color: 'text-orange-500', desc: 'Recorded Technical Errors' },
                    { label: 'Connection', value: stats.serviceHealth, icon: Radio, color: 'text-blue-500', desc: 'Secure Server Link' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card border-border shadow-sm rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                        <div className={`absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                            <stat.icon className="h-16 md:h-20 w-16 md:w-20" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-3 md:mb-4">{stat.label}</p>
                        <div className="text-3xl md:text-4xl font-black text-foreground italic font-heading tracking-tighter mb-2">{stat.value}</div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">{stat.desc}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                {/* Activity Logs */}
                <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-[2rem] md:rounded-[3rem] overflow-hidden">
                    <CardHeader className="py-8 px-6 md:py-10 md:px-10 border-b border-border flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-foreground">Activity <span className="text-primary">Logs</span></CardTitle>
                            <p className="text-[10px] md:text-[11px] text-muted-foreground font-black uppercase tracking-widest italic leading-tight">System and Account Events</p>
                        </div>
                        <Code className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <div className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic">Date & Time</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic">Account</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic">Action</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading italic text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="border-border hover:bg-muted/30 transition-colors group">
                                        <TableCell className="py-6 px-10 text-muted-foreground text-[10px] italic">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-6 px-10">
                                            <span className="text-[10px] font-black text-foreground/60 tracking-widest uppercase">USER-{log.actor_id?.slice(0, 6).toUpperCase()}</span>
                                        </TableCell>
                                        <TableCell className="py-6 px-10">
                                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg">
                                                {log.action_type || 'SYSTEM_ACTIVITY'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-right">
                                            <div className="bg-muted p-3 rounded-xl border border-border max-w-[240px] ml-auto group-hover:bg-primary/5 transition-colors">
                                                <p className="text-[9px] text-muted-foreground truncate italic">
                                                    {log.details ? JSON.stringify(log.details) : 'N/A'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <div className="space-y-10">
                    <Card className="bg-card border-border shadow-sm rounded-[3rem] p-10 space-y-10 group hover:border-primary/20 transition-all overflow-hidden relative">
                         <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <Database className="h-4 w-4 text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Platform Services</h3>
                            </div>
                            
                            <div className="grid gap-4">
                                {[
                                    { label: 'Site Hosting', status: 'Online', icon: Globe },
                                    { label: 'Database', status: 'Healthy', icon: Database },
                                    { label: 'Authentication', status: 'Secure', icon: Shield },
                                    { label: 'Updates Feed', status: 'Active', icon: Radio },
                                ].map((sys, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-muted/40 border border-border/50 rounded-2xl group-hover:bg-muted transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border/50 text-primary">
                                                <sys.icon className="h-4 w-4" />
                                            </div>
                                            <p className="text-sm font-black text-foreground italic uppercase tracking-tight">{sys.label}</p>
                                        </div>
                                        <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">{sys.status}</Badge>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </Card>

                    <Card className="bg-primary text-primary-foreground p-10 rounded-[3rem] border-none shadow-[0_25px_60px_rgba(255,98,0,0.15)] group relative overflow-hidden">
                        <Zap className="h-8 w-8 mb-6 opacity-80" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter font-heading mb-4">Administration</h3>
                        <p className="text-xs opacity-70 italic leading-relaxed mb-8">
                            Configure site settings and platform-wide rules. Access for technical administrators only.
                        </p>
                        <Button className="w-full bg-white text-primary border-none hover:bg-white/95 font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl">
                             Open System Settings
                        </Button>
                    </Card>
                </div>
            </div>

            <div className="text-center py-20 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Administration Control Hub // 2026</p>
            </div>
        </div>
    );
}