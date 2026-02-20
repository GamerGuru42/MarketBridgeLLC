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
    const [publicToggleLoading, setPublicToggleLoading] = useState(false);
    const [publicEnabled, setPublicEnabled] = useState(false);
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

            // Fetch public section setting
            const { data: settingsData } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'public_section_enabled')
                .single();

            if (settingsData) {
                setPublicEnabled(settingsData.value === 'true' || settingsData.value === true);
            }

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

    const togglePublicSection = async () => {
        if (!isSuperAdmin) {
            alert('Access denied – Super Admin only.');
            return;
        }

        setPublicToggleLoading(true);
        try {
            const newValue = !publicEnabled;

            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'public_section_enabled',
                    value: String(newValue),
                    updated_at: new Date().toISOString(),
                    updated_by: user?.id
                }, { onConflict: 'key' });

            if (error) throw error;

            // Log the action
            await supabase.from('system_audit_logs').insert({
                action_type: newValue ? 'public_section_enabled' : 'public_section_disabled',
                actor_id: user?.id,
                details: {
                    changed_by: user?.email,
                    new_value: newValue,
                    timestamp: new Date().toISOString()
                }
            });

            setPublicEnabled(newValue);
            alert(`Public Marketplace ${newValue ? 'ENABLED' : 'DISABLED'} successfully.\n\n${newValue ? 'Note: The ENABLE_PUBLIC_SECTION env var must also be set to "true" for full access.' : 'Public routes are now locked.'}`);
        } catch (err: any) {
            console.error('Toggle failed:', err);
            alert('Failed to toggle public section: ' + (err.message || 'Unknown error'));
        } finally {
            setPublicToggleLoading(false);
            fetchData();
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
                            <p className="text-2xl font-black text-white">{stats.uptime}</p>
                        </div>
                        <Server className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">API Latency</p>
                            <p className="text-2xl font-black text-[#FF6200]">{stats.apiLatency}</p>
                        </div>
                        <Database className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Error Rate</p>
                            <p className="text-2xl font-black text-white">{stats.errorRate}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Webhooks</p>
                            <p className="text-2xl font-black text-white">{stats.webhookHealth}</p>
                        </div>
                        <Activity className="h-8 w-8 text-zinc-700" />
                    </CardContent>
                </Card>
            </div>

            {/* Public Section Kill-Switch */}
            <Card className="bg-zinc-900/50 border-[#FF6200]/20 backdrop-blur-sm relative z-10">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-[#FF6200]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">
                                Public Section Control
                            </CardTitle>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                Super Admin Only – Hard Kill-Switch
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {!isSuperAdmin ? (
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <Shield className="h-5 w-5 text-zinc-500" />
                            <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">
                                Access Restricted – Super Admin (CEO / Technical Admin) role required
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${publicEnabled ? 'bg-[#FF6200]' : 'bg-zinc-600'}`} />
                                    <span className="font-black uppercase tracking-widest text-sm">
                                        Public Marketplace is currently{' '}
                                        <span className={publicEnabled ? 'text-[#FF6200]' : 'text-zinc-400'}>
                                            {publicEnabled ? 'ENABLED' : 'DISABLED (LOCKED)'}
                                        </span>
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest max-w-lg">
                                    {publicEnabled
                                        ? 'Public routes /public/* are accessible. Both this DB flag AND the ENABLE_PUBLIC_SECTION env var must be "true" simultaneously.'
                                        : 'Public routes /public/* return 404 for all users. No public card, text, or hint is visible on the homepage.'}
                                </p>
                            </div>
                            <Button
                                onClick={togglePublicSection}
                                disabled={publicToggleLoading}
                                className={`h-14 px-8 font-black uppercase tracking-widest rounded-xl whitespace-nowrap transition-all ${publicEnabled
                                        ? 'bg-white text-black hover:bg-zinc-200'
                                        : 'bg-[#FF6200] text-black hover:bg-[#FF7A29]'
                                    }`}
                            >
                                {publicToggleLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                ) : publicEnabled ? (
                                    <><ToggleRight className="mr-2 h-5 w-5" /> Disable Public Section</>
                                ) : (
                                    <><ToggleLeft className="mr-2 h-5 w-5" /> Enable Public Section</>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm relative z-10">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">System Audit Logs</CardTitle>
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
                                        <Badge variant="outline" className="text-[#FF6200] border-[#FF6200]/20 bg-[#FF6200]/5 text-[10px] uppercase">
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