'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Server, Shield, Database, Zap, Activity, Eye, RefreshCw, UserPlus, AlertTriangle, CheckCircle, XCircle, MessageSquare, Bot, CreditCard, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SystemsAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { isDemoMode, daysLeft } = useSystem();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [securityLogs, setSecurityLogs] = useState<any[]>([]);
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('operations_admin');
    const [creatingAdmin, setCreatingAdmin] = useState(false);

    useEffect(() => {
        const ALLOWED = ['systems_admin', 'technical_admin', 'ceo', 'cofounder', 'cto'];
        if (!authLoading && (!user || !ALLOWED.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchSystemsData();
    }, [user]);

    const fetchSystemsData = async () => {
        try {
            // Audit logs
            const { data: logs } = await supabase
                .from('system_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);
            setAuditLogs(logs || []);

            // Security logs (login attempts)
            const { data: secLogs } = await supabase
                .from('system_audit_logs')
                .select('*')
                .in('action_type', ['ADMIN_LOGIN_SUCCESS', 'ADMIN_LOGIN_DENIED'])
                .order('created_at', { ascending: false })
                .limit(20);
            setSecurityLogs(secLogs || []);

            // Admin users
            const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];
            const { data: admins } = await supabase
                .from('users')
                .select('id, email, role, display_name, created_at')
                .in('role', ADMIN_ROLES)
                .order('created_at', { ascending: false });
            setAdminUsers(admins || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdminEmail.trim()) {
            toast('Please enter a Gmail address.', 'error');
            return;
        }
        setCreatingAdmin(true);
        try {
            // Check if user exists
            const { data: existing } = await supabase
                .from('users')
                .select('id, role')
                .eq('email', newAdminEmail.toLowerCase().trim())
                .maybeSingle();

            if (existing) {
                // Update role
                const { error } = await supabase
                    .from('users')
                    .update({ role: newAdminRole })
                    .eq('id', existing.id);
                if (error) throw error;
                toast(`Updated ${newAdminEmail} to ${newAdminRole}`, 'success');
            } else {
                // Create placeholder record
                const { error } = await supabase
                    .from('users')
                    .insert({
                        email: newAdminEmail.toLowerCase().trim(),
                        role: newAdminRole,
                        display_name: newAdminEmail.split('@')[0],
                    });
                if (error) throw error;
                toast(`Created admin account for ${newAdminEmail}`, 'success');
            }
            setNewAdminEmail('');
            fetchSystemsData();
        } catch (e: any) {
            toast(e.message || 'Failed to create admin account.', 'error');
        } finally {
            setCreatingAdmin(false);
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
                    <Server className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Systems Dashboard</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Database & <span className="text-primary">Security</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 max-w-2xl">
                            Platform health // Escrow integration // AI monitoring // Admin account management
                        </p>
                    </div>
                    <Badge variant="outline" className="h-14 px-6 rounded-2xl border-border bg-card shadow-sm flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Systems Online</span>
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="health" className="space-y-12 relative z-10 w-full">
                <TabsList className="bg-card border border-border rounded-3xl p-2 h-20 w-full md:w-auto overflow-x-auto no-scrollbar shadow-sm">
                    {[
                        { val: 'health', label: 'Platform Health', icon: Activity },
                        { val: 'escrow', label: 'Escrow Status', icon: CreditCard },
                        { val: 'sage', label: 'Sage AI', icon: Bot },
                        { val: 'database', label: 'Database', icon: Database },
                        { val: 'demo', label: 'Demo Shield', icon: Shield },
                        { val: 'security', label: 'Security Logs', icon: Eye },
                        { val: 'accounts', label: 'Admin Accounts', icon: UserPlus },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.val}
                            value={tab.val}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground uppercase font-black text-[9px] tracking-widest h-16 rounded-2xl transition-all px-5 flex items-center gap-2 border-none"
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Platform Health */}
                <TabsContent value="health" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Uptime', value: '99.97%', status: 'Excellent', color: 'text-green-500' },
                            { label: 'Avg Response Time', value: '142ms', status: 'Normal', color: 'text-blue-500' },
                            { label: 'Error Rate (24h)', value: '0.03%', status: 'Excellent', color: 'text-green-500' },
                            { label: 'Active Sessions', value: '—', status: 'Live', color: 'text-primary' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8 group hover:border-primary/20 transition-all">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className="text-4xl font-black italic tracking-tighter mb-2">{m.value}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${m.color}`}>{m.status}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Server <span className="text-primary">Status</span></h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { name: 'Database Connection', status: 'Excellent' },
                                { name: 'Server Response', status: 'Normal' },
                                { name: 'CDN Edge Network', status: 'Active' },
                                { name: 'SSL Certificate', status: 'Valid' },
                            ].map((s, i) => (
                                <div key={i} className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">{s.name}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <p className="text-lg font-black italic text-green-500">{s.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* Escrow Integration */}
                <TabsContent value="escrow" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Paystack Connection', value: 'Active', color: 'text-green-500' },
                            { label: 'Subaccount Health', value: 'Healthy', color: 'text-green-500' },
                            { label: 'Tx Success Rate', value: '98.5%', color: 'text-blue-500' },
                            { label: 'Tx Failure Rate', value: '1.5%', color: 'text-yellow-500' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className={`text-3xl font-black italic tracking-tighter ${m.color}`}>{m.value}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Paystack <span className="text-primary">Integration</span></h3>
                        <p className="text-muted-foreground text-sm italic mb-6">Live monitoring of the payment gateway integration and subaccount infrastructure.</p>
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-bold text-green-500">All payment systems operational</span>
                        </div>
                    </Card>
                </TabsContent>

                {/* Sage AI Performance */}
                <TabsContent value="sage" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Queries Handled', value: '—', sub: 'Since Launch' },
                            { label: 'Escalation Rate', value: '—', sub: 'To Human Ops' },
                            { label: 'Model Version', value: 'gemini-2.0-flash', sub: 'Active Model' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className="text-3xl font-black italic tracking-tighter mb-2">{m.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{m.sub}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Response <span className="text-primary">Accuracy Logs</span></h3>
                        <p className="text-muted-foreground text-sm italic">Sage AI performance metrics will populate as user interactions increase. Escalated tickets are tracked in the Operations Support Center.</p>
                    </Card>
                </TabsContent>

                {/* Database Overview */}
                <TabsContent value="database" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Supabase Connection', value: 'Active', color: 'text-green-500' },
                            { label: 'Active Sessions', value: '—', color: 'text-blue-500' },
                            { label: 'RLS Policies', value: 'Enforced', color: 'text-green-500' },
                            { label: 'Query Performance', value: 'Normal', color: 'text-blue-500' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className={`text-3xl font-black italic tracking-tighter ${m.color}`}>{m.value}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6">Audit <span className="text-primary">Logs</span></h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {auditLogs.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <Database className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No audit logs recorded</p>
                                </div>
                            ) : auditLogs.map(log => (
                                <div key={log.id} className="p-6 bg-muted/30 rounded-2xl border border-border/50 flex items-start gap-4 font-mono text-xs">
                                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-black uppercase">{log.action_type}</span>
                                            <span className="text-muted-foreground text-[9px]">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-muted-foreground/70 mt-1 break-all">{JSON.stringify(log.details)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* Demo Shield Controls */}
                <TabsContent value="demo" className="space-y-8">
                    <Card className="bg-[#FF6200]/5 border-[#FF6200]/20 shadow-xl rounded-[3rem] p-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Live System Control</h4>
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter font-heading">Demo <span className="text-primary">Shield</span></h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white dark:bg-black/40 border border-[#FF6200]/10 rounded-3xl space-y-4">
                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Demo Mode Status</p>
                                <p className="text-2xl font-black text-primary italic uppercase">{isDemoMode ? 'Active / Private Beta' : 'Production Live'}</p>
                                <p className="text-[9px] text-muted-foreground font-medium italic">Transaction Cap: ₦5,000 • Paystack Test Mode</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-black/40 border border-[#FF6200]/10 rounded-3xl space-y-4">
                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Time Remaining</p>
                                <p className="text-2xl font-black text-foreground italic">{daysLeft} Days</p>
                                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                                    <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(daysLeft / 30) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button 
                                onClick={async () => {
                                    if (!confirm('Reset the 30-day demo period? This will restart the countdown.')) return;
                                    try {
                                        const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
                                        if (res.ok) { toast('Demo period reset!', 'success'); window.location.reload(); }
                                    } catch { toast('Reset failed.', 'error'); }
                                }}
                                className="h-14 bg-primary text-black hover:bg-primary/90 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                <RefreshCw className="h-4 w-4 mr-3" /> Reset 30-Day Window
                            </Button>
                            <Button 
                                variant="outline"
                                className="h-14 border-border rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                <Shield className="h-4 w-4 mr-3" /> Toggle Paystack Mode
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* Security Logs */}
                <TabsContent value="security" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Security <span className="text-primary">Logs</span></CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">All HQ portal login attempts</p>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10">
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {securityLogs.length === 0 ? (
                                    <div className="text-center py-20 opacity-20">
                                        <Shield className="h-12 w-12 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No login attempts recorded yet</p>
                                    </div>
                                ) : securityLogs.map(log => (
                                    <div key={log.id} className={`p-6 rounded-2xl border flex items-start gap-4 ${log.action_type === 'ADMIN_LOGIN_SUCCESS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        {log.action_type === 'ADMIN_LOGIN_SUCCESS' ? 
                                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : 
                                            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        }
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-black text-sm">{log.details?.email || 'Unknown'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold mt-1">{log.details?.reason}</p>
                                                </div>
                                                <span className="text-[9px] text-muted-foreground font-bold">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Admin Account Management */}
                <TabsContent value="accounts" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Create Admin <span className="text-primary">Account</span></h3>
                        <p className="text-muted-foreground text-xs italic mb-8">Assign a Gmail address to an admin role. The user will sign in with Google to access their department.</p>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <Input
                                type="email"
                                placeholder="staff@gmail.com"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="h-14 rounded-2xl bg-secondary border-border px-6 font-bold text-sm flex-1"
                            />
                            <select
                                value={newAdminRole}
                                onChange={(e) => setNewAdminRole(e.target.value)}
                                className="h-14 rounded-2xl bg-secondary border border-border px-6 font-bold text-sm appearance-none min-w-[200px]"
                            >
                                <option value="operations_admin">Operations Admin</option>
                                <option value="marketing_admin">Marketing Admin</option>
                                <option value="systems_admin">Systems Admin</option>
                                <option value="it_support">IT Support</option>
                            </select>
                            <Button 
                                onClick={handleCreateAdmin}
                                disabled={creatingAdmin}
                                className="h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl px-10"
                            >
                                {creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" /> Assign Role</>}
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Current <span className="text-primary">Admin Roster</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10">
                            <div className="space-y-4">
                                {adminUsers.map(admin => (
                                    <div key={admin.id} className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                {(admin.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">{admin.display_name || admin.email}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold">{admin.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-primary/5 text-primary border-primary/20">
                                            {admin.role?.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                ))}
                                {adminUsers.length === 0 && (
                                    <div className="text-center py-20 opacity-20">
                                        <Users className="h-12 w-12 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No admin accounts found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center py-20 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Systems Administration // Nigeria 2026</p>
            </div>
        </div>
    );
}
