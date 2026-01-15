'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Server, Database, Activity, Lock, Search, Code, Cpu, Globe, AlertCircle, Terminal, Zap, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TourGuide } from '@/components/tour-guide';

const techTourSteps = [
    {
        title: "System Status Console",
        description: "Real-time monitoring of Abuja and Lagos API nodes, database latency, and error rates.",
        icon: <Activity size={24} />
    },
    {
        title: "Security & Audits",
        description: "Review access logs, failed login attempts, and active firewall rules for the platform.",
        icon: <Lock size={24} />
    },
    {
        title: "Deployment Controls",
        description: "Trigger rollbacks or enable maintenance mode during critical infrastructure updates.",
        icon: <Terminal size={24} />
    }
];

export default function TechnicalAdminPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <TourGuide pageKey="admin_technical" steps={techTourSteps} title="Technical Briefing" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-mono text-slate-900">Systems Reliability Engineer</h1>
                    <p className="text-muted-foreground mt-2 font-mono text-sm">
                        Session Active: {user?.id?.substring(0, 8)}... | Access Level: <span className="text-primary font-bold">ROOT_ADMIN</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-mono" asChild>
                        <Link href="/admin/proposals/new">
                            <Zap className="h-4 w-4 mr-2 text-orange-500" />
                            Propose Upgrade
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="font-mono">
                        <Code className="h-4 w-4 mr-2" />
                        API Docs
                    </Button>
                </div>
            </div>

            {/* Main Vital Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-tighter">Cluster Response</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">12ms</div>
                        <p className="text-[10px] text-green-600 font-bold uppercase">Optimal Performance</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-tighter">DB Thread Pool</CardTitle>
                        <Database className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">84/200</div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">42% Capacity Utilized</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-tighter">Memory Snapshot</CardTitle>
                        <Cpu className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">1.2 GB</div>
                        <p className="text-[10px] text-orange-600 font-bold uppercase">Stable Leak Check Pass</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-tighter">Traffic Node</CardTitle>
                        <Globe className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">94k/hr</div>
                        <p className="text-[10px] text-purple-600 font-bold uppercase">Origin: Abuja West</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Error Log / Monitoring */}
                <Card className="border-slate-800 bg-slate-900 text-slate-100 font-mono overflow-hidden">
                    <CardHeader className="border-b border-slate-800 bg-slate-950/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                Real-time Runtime Exception Log
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] text-red-400 border-red-900 bg-red-950/20">
                                2 CRITICAL
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[10px]">
                                <thead className="bg-slate-950/30 text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Timestamp</th>
                                        <th className="px-4 py-2 text-left">Level</th>
                                        <th className="px-4 py-2 text-left">Origin</th>
                                        <th className="px-4 py-2 text-left">Payload</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    <tr className="hover:bg-slate-800/30">
                                        <td className="px-4 py-2 text-slate-500">22:14:12</td>
                                        <td className="px-4 py-2 text-red-400 font-bold">CRIT</td>
                                        <td className="px-4 py-2 text-blue-400">authService.ts</td>
                                        <td className="px-4 py-2 italic text-slate-300">"JWT decryption failed: secret rotation mismatch"</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/30 text-yellow-400">
                                        <td className="px-4 py-2 text-slate-500">22:13:58</td>
                                        <td className="px-4 py-2 font-bold">WARN</td>
                                        <td className="px-4 py-2 text-blue-400">VideoUpload.tsx</td>
                                        <td className="px-4 py-2 italic text-slate-300">"S3 bucket upload slow: latency &gt; 5000ms"</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/30">
                                        <td className="px-4 py-2 text-slate-500">22:12:44</td>
                                        <td className="px-4 py-2 text-red-400 font-bold">CRIT</td>
                                        <td className="px-4 py-2 text-blue-400">dbProxy.sql</td>
                                        <td className="px-4 py-2 italic text-slate-300">"Deadlock detected on table 'listings' row 452"</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/30 text-slate-400">
                                        <td className="px-4 py-2 text-slate-500">22:10:05</td>
                                        <td className="px-4 py-2 font-bold">INFO</td>
                                        <td className="px-4 py-2 text-blue-400">workerNode.js</td>
                                        <td className="px-4 py-2 italic text-slate-300">"Garbage collection cycle completed (150ms)"</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Infrastructure Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Environment Control</CardTitle>
                        <CardDescription>Secret management and infrastructure configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Lock className="h-3 w-3" />
                                Active API Integrations
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-mono">SUPABASE_STORAGE_READ</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] font-mono">REVOKE ACCESS</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-mono">PAYSTACK_SEC_LIVE</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] font-mono">ROTATION REQ</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                                    <div className="flex items-center gap-2 text-orange-500">
                                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                        <span className="text-xs font-mono">GOOGLE_MAPS_SERVICES</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] font-mono">QUOTA REACHED</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Cpu className="h-3 w-3" />
                                Resource Allocation
                            </h4>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono">
                                        <span>VIDEO_TRANSCODER_NODES</span>
                                        <span>8 / 12 Active</span>
                                    </div>
                                    <Progress value={66.6} className="h-1.5" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono">
                                        <span>SEARCH_INDEX_SYNC</span>
                                        <span>SYNCED (4ms delta)</span>
                                    </div>
                                    <Progress value={100} className="h-1.5 bg-green-100" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Terminal Entry */}
            <Card className="bg-slate-950 border-slate-700">
                <CardContent className="p-4 flex gap-4 items-center">
                    <div className="text-green-500 font-mono text-sm shrink-0">marketbridge-cli ~$</div>
                    <Input
                        className="bg-transparent border-none text-slate-100 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                        placeholder="sudo systemctl restart video-processor-3"
                    />
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white font-mono h-8">EXECUTE</Button>
                </CardContent>
            </Card>
        </div>
    );
}
