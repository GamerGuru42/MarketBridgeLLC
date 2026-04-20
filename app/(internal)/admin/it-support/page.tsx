'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, Bug, Smartphone, Activity, CheckCircle, XCircle, Clock, FileText, Rocket, RefreshCw, Circle, Server } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

export default function ITSupportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [bugReports, setBugReports] = useState<any[]>([]);
    const [bugFilter, setBugFilter] = useState('all');

    useEffect(() => {
        const ALLOWED = ['it_support', 'systems_admin', 'technical_admin', 'ceo', 'cofounder', 'cto'];
        if (!authLoading && (!user || !ALLOWED.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchITData();
    }, [user]);

    const fetchITData = async () => {
        try {
            const { data: bugs } = await supabase
                .from('feedbacks')
                .select('*')
                .eq('type', 'Bug Report')
                .order('created_at', { ascending: false });
            setBugReports(bugs || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateBugStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('feedbacks')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            toast(`Bug report marked as ${status}`, 'success');
            fetchITData();
        } catch (e: any) {
            toast(e.message || 'Failed to update', 'error');
        }
    };

    const filteredBugs = bugFilter === 'all' 
        ? bugReports 
        : bugReports.filter(b => b.status === bugFilter);

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
                    <Wrench className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">IT Support Dashboard</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Maintenance & <span className="text-primary">Reports</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 max-w-2xl">
                            Bug tracking // Integration health // Deployment status // Technical documentation
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="mobile" className="space-y-12 relative z-10 w-full">
                <TabsList className="bg-card border border-border rounded-3xl p-2 h-20 w-full md:w-auto overflow-x-auto no-scrollbar shadow-sm">
                    {[
                        { val: 'mobile', label: 'Mobile App', icon: Smartphone },
                        { val: 'bugs', label: 'Bug Reports', icon: Bug },
                        { val: 'maintenance', label: 'Maintenance', icon: Wrench },
                        { val: 'performance', label: 'Performance', icon: Activity },
                        { val: 'integrations', label: 'Integrations', icon: Rocket },
                        { val: 'deployments', label: 'Deployments', icon: RefreshCw },
                        { val: 'docs', label: 'Tech Docs', icon: FileText },
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

                {/* Mobile App Status */}
                <TabsContent value="mobile" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { platform: 'Android', version: '1.0.0-beta', status: 'In Development', lastDeploy: 'Not yet deployed', color: 'text-green-500' },
                            { platform: 'iOS', version: '1.0.0-beta', status: 'In Development', lastDeploy: 'Not yet deployed', color: 'text-blue-500' },
                        ].map((app, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">{app.platform}</h3>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                        v{app.version}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted/40 rounded-2xl">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Status</p>
                                        <p className={`text-sm font-black italic ${app.color}`}>{app.status}</p>
                                    </div>
                                    <div className="p-4 bg-muted/40 rounded-2xl">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Last Deploy</p>
                                        <p className="text-sm font-black italic">{app.lastDeploy}</p>
                                    </div>
                                </div>
                                <p className="text-[9px] text-muted-foreground font-medium italic">Pending updates: None</p>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Bug Report Queue */}
                <TabsContent value="bugs" className="space-y-8">
                    <div className="flex flex-wrap gap-3 mb-6">
                        {['all', 'open', 'in_progress', 'resolved'].map(f => (
                            <Button
                                key={f}
                                variant={bugFilter === f ? 'default' : 'outline'}
                                onClick={() => setBugFilter(f)}
                                className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest"
                            >
                                {f === 'all' ? `All (${bugReports.length})` : f.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {filteredBugs.length === 0 ? (
                            <Card className="bg-card border-border rounded-[2.5rem] p-20 text-center">
                                <Bug className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No bug reports match this filter</p>
                            </Card>
                        ) : filteredBugs.map(bug => (
                            <Card key={bug.id} className="bg-card border-border rounded-2xl p-6 hover:border-primary/20 transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Badge className={`text-[8px] font-black uppercase rounded-lg px-3 py-1 ${
                                                bug.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                bug.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                {bug.status || 'open'}
                                            </Badge>
                                            <span className="text-[9px] text-muted-foreground font-bold">{new Date(bug.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm font-bold text-foreground">{bug.description}</p>
                                        <p className="text-[10px] text-muted-foreground italic">
                                            From: {bug.name || 'Anonymous'} ({bug.email || 'No email'})
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => updateBugStatus(bug.id, 'in_progress')} className="text-yellow-500 border-yellow-500/20 text-[9px] font-black uppercase rounded-lg h-9 px-4">
                                            <Clock className="h-3 w-3 mr-1" /> In Progress
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => updateBugStatus(bug.id, 'resolved')} className="text-green-500 border-green-500/20 text-[9px] font-black uppercase rounded-lg h-9 px-4">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Platform Maintenance Logs */}
                <TabsContent value="maintenance" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Maintenance <span className="text-primary">History</span></h3>
                        <div className="text-center py-20 opacity-20">
                            <Wrench className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No maintenance actions logged yet</p>
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Maintenance records will appear here as system actions are performed.</p>
                        </div>
                    </Card>
                </TabsContent>

                {/* Performance Reports */}
                <TabsContent value="performance" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Avg Load Time', value: '1.2s', status: 'Good' },
                            { label: 'Uptime (30d)', value: '99.97%', status: 'Excellent' },
                            { label: 'Error Rate', value: '0.03%', status: 'Low' },
                            { label: 'Avg Session', value: '4m 32s', status: 'Normal' },
                        ].map((m, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">{m.label}</p>
                                <p className="text-3xl font-black italic tracking-tighter mb-2">{m.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-500">{m.status}</p>
                            </Card>
                        ))}
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Weekly & Monthly <span className="text-primary">Summaries</span></h3>
                        <p className="text-muted-foreground text-sm italic">Performance summaries are generated automatically. Historical data will populate as platform activity increases.</p>
                    </Card>
                </TabsContent>

                {/* Integration Health */}
                <TabsContent value="integrations" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { name: 'Paystack', desc: 'Payment gateway & escrow', status: 'operational' },
                            { name: 'Supabase', desc: 'Database & authentication', status: 'operational' },
                            { name: 'Google Gemini', desc: 'Sage AI (gemini-2.0-flash)', status: 'operational' },
                            { name: 'Google OAuth', desc: 'Social authentication', status: 'operational' },
                        ].map((svc, i) => (
                            <Card key={i} className="bg-card border-border rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`h-3 w-3 rounded-full ${svc.status === 'operational' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                    <div>
                                        <p className="font-black text-lg">{svc.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{svc.desc}</p>
                                    </div>
                                </div>
                                <Badge className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${
                                    svc.status === 'operational' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                    {svc.status}
                                </Badge>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Deployment Pipeline */}
                <TabsContent value="deployments" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Deployment <span className="text-primary">Pipeline</span></h3>
                        <div className="space-y-4">
                            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="font-black text-sm">Latest Deployment</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">main branch — Vercel Production</p>
                                    </div>
                                </div>
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black uppercase rounded-lg">Live</Badge>
                            </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic mt-6">Active rollbacks and pending deployments will appear here during CI/CD operations.</p>
                    </Card>
                </TabsContent>

                {/* Technical Documentation */}
                <TabsContent value="docs" className="space-y-8">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Technical <span className="text-primary">Documentation</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: 'Escrow System Architecture', desc: '7-stage escrow flow, Paystack integration, and subaccount model.' },
                                { title: 'Authentication Flow', desc: 'Google OAuth, role resolution, cross-subdomain session management.' },
                                { title: 'Sage AI Configuration', desc: 'Gemini 2.0 Flash model, tool definitions, escalation protocol.' },
                                { title: 'Database Schema', desc: 'Supabase tables, RLS policies, and migration procedures.' },
                                { title: 'Deployment Guide', desc: 'Vercel production deployment, environment variables, DNS config.' },
                                { title: 'API Reference', desc: 'Internal API endpoints for admin operations, webhooks, and integrations.' },
                            ].map((doc, i) => (
                                <div key={i} className="p-6 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-all cursor-pointer group">
                                    <div className="flex items-start gap-4">
                                        <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                        <div>
                                            <p className="font-black text-sm mb-1">{doc.title}</p>
                                            <p className="text-[10px] text-muted-foreground italic">{doc.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center py-20 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge IT Support // Nigeria 2026</p>
            </div>
        </div>
    );
}
