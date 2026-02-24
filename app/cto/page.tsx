'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Server, Database, Activity, ShieldCheck, Zap, Cpu, HardDrive, Dashboard, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function CTOPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-mono">Systems Architecture</h1>
                    <p className="text-muted-foreground mt-2">
                        Infrastructure performance and technical health for {user?.displayName || 'CTO'}.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-[#FF6200] text-[#FF6200] bg-green-50 font-mono">
                        CLUSTER: NIGERIA-WEST-1 (OK)
                    </Badge>
                    <div className="h-3 w-3 rounded-full bg-[#FF6200] animate-pulse"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-black text-white border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase text-white/60 font-bold italic underline">Global System Uptime</CardTitle>
                        <Server className="h-4 w-4 text-[#FF6200]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">99.98%</div>
                        <p className="text-[10px] text-white/40 mt-1 font-bold">LTM Performance Baseline</p>
                    </CardContent>
                </Card>
                <Card className="bg-black text-white border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase text-white/60 font-bold italic underline">Avg API Latency</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">34ms</div>
                        <p className="text-[10px] text-yellow-400/70 mt-1 font-bold">Internal Network Optimized</p>
                    </CardContent>
                </Card>
                <Card className="bg-black text-white border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase text-white/60 font-bold italic underline">DB Connection Load</CardTitle>
                        <Database className="h-4 w-4 text-[#FF6200]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">14%</div>
                        <p className="text-[10px] text-white/40 mt-1 font-bold">1.2M Queries Hourly</p>
                    </CardContent>
                </Card>
                <Card className="bg-black text-white border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono uppercase text-white/60 font-bold italic underline">Security Scanning</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold font-bold">PASS</div>
                        <p className="text-[10px] text-purple-400/70 mt-1 font-bold italic">Zero Vulnerabilities Found</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Media Infrastructure */}
                <Card className="border-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-primary" />
                            <CardTitle>Multimedia Storage Clusters</CardTitle>
                        </div>
                        <CardDescription>Managing image and video assets for car listings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold font-mono italic underline">
                                    <span>Listing Images (Standard)</span>
                                    <span>42.5 GB / 100 GB</span>
                                </div>
                                <Progress value={42.5} className="h-2 bg-muted-foreground/10" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold font-mono italic underline">
                                    <span>Listing Videos (Premium)</span>
                                    <span>18.2 GB / 500 GB</span>
                                </div>
                                <Progress value={3.6} className="h-2 bg-muted-foreground/10" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold font-mono italic underline">
                                    <span>Verification Docs (Sensitive)</span>
                                    <span>2.1 GB / 50 GB</span>
                                </div>
                                <Progress value={4.2} className="h-2 bg-muted-foreground/10" />
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border border-primary/5">
                            <p className="text-xs text-muted-foreground font-mono">
                                <Dashboard className="h-3 w-3 inline mr-2" />
                                Video transcoder optimization active. CDN cache hit rate: 94.2%. Video delivery latency in Abuja: 45ms.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Technical Strategy */}
                <Card className="border-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary" />
                            <CardTitle>Engineering Roadmap</CardTitle>
                        </div>
                        <CardDescription>Key technical milestones for Q4</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Activity className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-bold font-mono">Automated Video Transcoding</p>
                                <p className="text-xs text-muted-foreground">Moving to HLS streaming for better mobile performance in low-bandwidth areas.</p>
                                <Badge className="mt-2 text-[10px] font-bold">75% COMPLETE</Badge>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Lock className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-bold font-mono">AES-256 Escrow Encryption</p>
                                <p className="text-xs text-muted-foreground">Hardening transaction security for high-value car payments.</p>
                                <Badge className="mt-2 text-[10px] font-bold">READY FOR DEPLOY</Badge>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-bold font-mono">AI Listing Optimizer</p>
                                <p className="text-xs text-muted-foreground">Automating metadata extraction from car videos to improve SEO.</p>
                                <Badge className="mt-2 text-[10px] font-bold" variant="secondary">RESEARCH</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
