'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Server, Globe, Database, Activity, AlertTriangle, ToggleLeft, ToggleRight, Shield, Terminal, Cpu, Zap, Radio, MessageSquare } from 'lucide-react';

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

    const isSuperAdmin = user?.role === 'ceo' || user?.role === 'technical_admin' || user?.role === 'cofounder';

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
                webhookHealth: 'Standby'
            });

            // Fetch Audit Logs
            const { data: logsData } = await supabase
                .from('system_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(25);

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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 space-y-10 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Terminal className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">System Engineering</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic font-heading">
                        Technical <span className="text-primary">Command</span>
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
                    Real-time Health Monitoring // API Latency // System Audit Stream
                </p>
            </div>

            {/* Health Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                    { label: 'Uptime', value: stats.uptime, icon: Globe, color: 'text-green-500' },
                    { label: 'API Latency', value: stats.apiLatency, icon: Cpu, color: 'text-primary' },
                    { label: 'Error Rate', value: stats.errorRate, icon: AlertTriangle, color: 'text-orange-500' },
                    { label: 'Webhooks', value: stats.webhookHealth, icon: Radio, color: 'text-blue-500' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card border-border shadow-sm rounded-[2rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                            <stat.icon className="h-20 w-20" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                        <div className="text-3xl font-black text-foreground italic font-heading tracking-tighter mb-2">{stat.value}</div>
                        <div className="flex items-center gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full ${stat.color} animate-pulse`} />
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">System Signal Active</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Logs Table */}
            <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden relative z-10 transition-colors duration-300">
                <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Event <span className="text-primary">Audit Stream</span></CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">Immutable Security Log History</p>
                        </div>
                        <Badge variant="outline" className="border-border text-muted-foreground text-[10px] font-black h-8 px-4 rounded-xl">CID-ADMIN-99</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading">Timestamp</TableHead>
                                    <TableHead className="py-6 px-6 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading">Action Node</TableHead>
                                    <TableHead className="py-6 px-6 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading">Actor ID</TableHead>
                                    <TableHead className="py-6 px-10 text-muted-foreground uppercase font-black text-[10px] tracking-widest font-heading text-right">Telemetric Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length > 0 ? logs.map((log) => (
                                    <TableRow key={log.id} className="border-border hover:bg-muted/10 transition-colors group">
                                        <TableCell className="py-6 px-10 text-foreground/80 text-[10px] font-black font-mono uppercase tracking-tighter italic">
                                            {new Date(log.created_at).toLocaleString().split(',').join(' //')}
                                        </TableCell>
                                        <TableCell className="py-6 px-6">
                                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                                                {log.action_type || 'SYSTEM_EVENT'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6 px-6 text-muted-foreground text-[10px] font-black font-mono tracking-widest opacity-60">
                                            {log.actor_id?.slice(0, 12).toUpperCase()}...
                                        </TableCell>
                                        <TableCell className="py-6 px-10 text-right">
                                            <div className="bg-muted/50 p-3 rounded-xl border border-border/50 max-w-[300px] ml-auto">
                                                <p className="text-[9px] text-muted-foreground font-mono truncate">
                                                    {JSON.stringify(log.details)}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-4 opacity-10">
                                                <Activity className="h-16 w-16" />
                                                <p className="text-muted-foreground font-black uppercase tracking-[0.5em] text-[10px] italic">No Logs Recorded in Buffer</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {logs.length > 0 && (
                        <div className="p-8 border-t border-border bg-muted/10 flex justify-center">
                            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                                Fetch Older Logs <Activity className="h-3 w-3 ml-2" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-center py-20 opacity-20 hover:opacity-100 transition-opacity">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground">Technical Infrastructure Uplink // Secure Node Prime active</p>
            </div>
        </div>
    );
}