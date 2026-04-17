'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Server, Globe, Database, Activity, AlertTriangle, ToggleLeft, ToggleRight, Shield, Terminal, Cpu, Zap, Radio, MessageSquare, Code } from 'lucide-react';
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
        webhookHealth: 'Operational'
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
                uptime: error ? 'Degraded' : '100% (Cloud)',
                apiLatency: `${latency}ms`,
                errorRate: error ? 'High' : '0%',
                webhookHealth: 'Live'
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
        <div className="flex justify-center items-center h-screen bg-background transition-colors duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 space-y-12 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Terminal className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">System Engineering</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Technical <span className="text-primary">Flow</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest leading-relaxed opacity-60 max-w-2xl">
                            Real-time infrastructure telemetry // Node-to-node latency monitoring // Immutable audit stream protocol
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="h-16 px-8 rounded-2xl border-border bg-card shadow-sm flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="text-left">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Station ID</p>
                                <p className="text-[12px] font-black text-foreground uppercase tracking-tighter">TECH-NODE-{user?.id?.slice(0, 4).toUpperCase() || 'ALPHA'}</p>
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

            {/* Health Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                    { label: 'Cloud Uptime', value: stats.uptime, icon: Globe, color: 'text-green-500', desc: 'Global Node Availability' },
                    { label: 'API Latency', value: stats.apiLatency, icon: Cpu, color: 'text-primary', desc: 'Supabase Edge Performance' },
                    { label: 'Error Rate', value: stats.errorRate, icon: AlertTriangle, color: 'text-orange-500', desc: 'Critical System Exceptions' },
                    { label: 'Datalink Pulse', value: stats.webhookHealth, icon: Radio, color: 'text-blue-500', desc: 'Service-to-Service Flow' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                            <stat.icon className="h-20 w-20" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                        <div className="text-4xl font-black text-foreground italic font-heading tracking-tighter mb-2">{stat.value}</div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">{stat.desc}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                {/* Audit Stream */}
                <Card className="lg:col-span-2 bg-[#0A0A0B] border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="bg-white/[0.02] py-10 px-10 border-b border-white/5 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">Event <span className="text-primary">Audit Stream</span></CardTitle>
                            <p className="text-[11px] text-white/40 font-black uppercase tracking-widest italic">Immutable System Event Buffer</p>
                        </div>
                        <Code className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <div className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="py-6 px-10 text-white/30 uppercase font-black text-[10px] tracking-widest font-heading italic">Timestamp</TableHead>
                                    <TableHead className="py-6 px-10 text-white/30 uppercase font-black text-[10px] tracking-widest font-heading italic">Source Node</TableHead>
                                    <TableHead className="py-6 px-10 text-white/30 uppercase font-black text-[10px] tracking-widest font-heading italic">Action Signal</TableHead>
                                    <TableHead className="py-6 px-10 text-white/30 uppercase font-black text-[10px] tracking-widest font-heading italic text-right">Data Payload</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-mono">
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="py-6 px-10 text-white/40 text-[10px] italic">
                                            {new Date(log.created_at).toLocaleString().split(',').join(' //')}
                                        </TableCell>
                                        <TableCell className="py-6 px-10">
                                            <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">NODE-{log.actor_id?.slice(0, 6).toUpperCase()}</span>
                                        </TableCell>
                                        <TableCell className="py-6 px-10">
                                            <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg">
                                                {log.action_type || 'SYSTEM_EVENT'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-right">
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 max-w-[240px] ml-auto group-hover:bg-primary/10 transition-colors">
                                                <p className="text-[9px] text-white/40 truncate italic lowercase">
                                                    {JSON.stringify(log.details)}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {logs.length > 5 && (
                        <div className="p-6 bg-white/[0.01] text-center border-t border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">End of recent buffer signals</span>
                        </div>
                    )}
                </Card>

                {/* Secondary Technical Modules */}
                <div className="space-y-10">
                    <Card className="bg-card border-border shadow-sm rounded-[3rem] p-10 space-y-10 group hover:border-primary/20 transition-all overflow-hidden relative">
                         <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
                         
                         <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <Database className="h-4 w-4 text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Resource Stack</h3>
                            </div>
                            
                            <div className="grid gap-4">
                                {[
                                    { label: 'Edge Network', status: 'Operational', icon: Globe },
                                    { label: 'Storage Cluster', status: 'Optimal', icon: Database },
                                    { label: 'Auth Middleware', status: 'Secure', icon: Shield },
                                    { label: 'Realtime Relay', status: 'Active', icon: Radio },
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
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full -mr-24 -mt-24 transition-opacity group-hover:opacity-100 opacity-60" />
                        <Zap className="h-8 w-8 mb-6 opacity-80" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter font-heading mb-4">Node Operations</h3>
                        <p className="text-xs opacity-70 italic leading-relaxed mb-8">
                            Execute low-level system commands and platform-wide configuration overrides. Access restricted to verified Technical Staff.
                        </p>
                        <Button className="w-full bg-white text-primary border-none hover:bg-white/95 font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl">
                            Deploy SysConfig (Cmd+P)
                        </Button>
                    </Card>
                </div>
            </div>

            <div className="text-center py-20 opacity-20 hover:opacity-100 transition-opacity">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Infrastructure Command // Secure Node Deployment // MMXXVI</p>
            </div>
        </div>
    );
}