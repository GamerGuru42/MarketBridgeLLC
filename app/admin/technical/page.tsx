'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Server, Globe, Database, Activity, AlertTriangle, ToggleLeft, ToggleRight, Shield } from 'lucide-react';

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

    const isSuperAdmin = user?.role === 'ceo' || user?.role === 'technical_admin';

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
                .limit(20);

            if (logsData) setLogs(logsData);
        } catch (e) {
            console.error(e);
            setStats(prev => ({ ...prev, uptime: 'Error' }));
        } finally {
            setLoading(false);
        }
    };



    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 relative">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                    Technical <span className="text-[#FF6200]">Command</span>
                </h1>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                    System Health Monitoring & Logs
                </p>
            </div>

            {/* Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Uptime</p>
                            <p className="text-2xl font-black text-white">{stats.uptime}</p>
                        </div>
                        <Server className="h-8 w-8 text-white/20" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">API Latency</p>
                            <p className="text-2xl font-black text-[#FF6200]">{stats.apiLatency}</p>
                        </div>
                        <Database className="h-8 w-8 text-white/20" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Error Rate</p>
                            <p className="text-2xl font-black text-white">{stats.errorRate}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-white/20" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Webhooks</p>
                            <p className="text-2xl font-black text-white">{stats.webhookHealth}</p>
                        </div>
                        <Activity className="h-8 w-8 text-white/20" />
                    </CardContent>
                </Card>
            </div>



            {/* Logs Table */}
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm relative z-10">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">System Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-white/5">
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Time</TableHead>
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Action</TableHead>
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Actor</TableHead>
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length > 0 ? logs.map((log) => (
                                <TableRow key={log.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="text-white/70 text-xs font-mono">{new Date(log.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[#FF6200] border-[#FF6200]/20 bg-[#FF6200]/5 text-[10px] uppercase">
                                            {log.action_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-white/60 text-xs">{log.actor_id?.slice(0, 8)}...</TableCell>
                                    <TableCell className="text-white/40 text-xs truncate max-w-[200px]">
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-white/40 italic">No logs recorded yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}