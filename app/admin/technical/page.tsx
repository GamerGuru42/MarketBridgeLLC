'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Globe, Database, Cpu, Activity, AlertTriangle } from 'lucide-react';

export default function TechnicalAdminPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        uptime: '99.98%',
        apiLatency: '45ms',
        errorRate: '0.02%',
        webhookHealth: 'Operational'
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            // In a real scenario, we'd query system_audit_logs table
            // For now, we mock it or fetch if table exists
            const { data, error } = await supabase
                .from('system_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 relative">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                    Technical <span className="text-blue-500">Command</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    System Health Monitoring & Logs
                </p>
            </div>

            {/* Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Uptime</p>
                            <p className="text-2xl font-black text-[#00FF85]">{stats.uptime}</p>
                        </div>
                        <Server className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">API Latency</p>
                            <p className="text-2xl font-black text-blue-400">{stats.apiLatency}</p>
                        </div>
                        <Cpu className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Error Rate</p>
                            <p className="text-2xl font-black text-yellow-500">{stats.errorRate}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Webhooks</p>
                            <p className="text-2xl font-black text-purple-400">{stats.webhookHealth}</p>
                        </div>
                        <Activity className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm relative z-10">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6600]">System Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-white/5">
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Time</TableHead>
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Action</TableHead>
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Actor</TableHead>
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length > 0 ? logs.map((log) => (
                                <TableRow key={log.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="text-zinc-300 text-xs font-mono">{new Date(log.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-blue-400 border-blue-400/20 bg-blue-400/5 text-[10px] uppercase">
                                            {log.action_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-400 text-xs">{log.actor_id?.slice(0, 8)}...</TableCell>
                                    <TableCell className="text-zinc-500 text-xs truncate max-w-[200px]">
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500 italic">No logs recorded yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
