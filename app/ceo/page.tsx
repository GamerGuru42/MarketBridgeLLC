'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity, MapPin, Video, ShieldCheck, PieChart, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function CEOPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Executive Command Center</h1>
                    <p className="text-muted-foreground mt-2">
                        Strategic intelligence and global operations overview for {user?.displayName || 'CEO'}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-primary/30 bg-primary/5">
                        Abuja Launch Phase: Active
                    </Badge>
                </div>
            </div>

            <Separator />

            {/* Strategic KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">GMV (Abuja Niche)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">₦184.5M</div>
                        <p className="text-xs text-green-600 font-semibold mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" /> +32.4% from launch
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Certified Dealers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">124</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            89% in Abuja Region
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Video Engagement</CardTitle>
                        <Video className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">2.4k</div>
                        <p className="text-xs text-purple-600 font-semibold mt-1">
                            85% Conversion lift
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-md transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Platform Trust Score</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">98.2%</div>
                        <p className="text-xs text-muted-foreground mt-1 text-orange-600 font-semibold">
                            Zero dispute rate this week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Intelligence Stream */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Proposal Approval Queue */}
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">Strategic Proposal Queue</CardTitle>
                                    <CardDescription>Review and approve upgrades or policy shifts from Admin leads</CardDescription>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-primary/30">3 Pending</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                <div className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">DT</div>
                                            <div>
                                                <h4 className="font-bold underline italic text-sm">Escrow Automation Upgrade v2.1</h4>
                                                <p className="text-xs text-muted-foreground font-medium">Proposed by <span className="text-blue-600">Operations Admin</span> • 2h ago</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-orange-500 border-orange-200">HIGH PRIORITY</Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                        "Proposal to automate escrow release for transactions under ₦1M in Abuja Central after 48h of verified delivery. Projected to reduce manual ops load by 40%."
                                    </p>
                                    <div className="flex gap-3">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs">APPROVE & DEPLOY</Button>
                                        <Button size="sm" variant="outline" className="h-8 text-xs">REQUEST INFO</Button>
                                        <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500">DECLINE</Button>
                                    </div>
                                </div>
                                <div className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">KA</div>
                                            <div>
                                                <h4 className="font-bold underline italic text-sm">Multimedia Cache Expansion (Abuja Node)</h4>
                                                <p className="text-xs text-muted-foreground font-medium">Proposed by <span className="text-purple-600">Technical Admin</span> • 5h ago</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-blue-500 border-blue-200">INFRASTRUCTURE</Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                        "Storage quotas for car videos in the Maitama region are at 85%. Approval needed to spin up an additional 500GB S3-compatible cluster node."
                                    </p>
                                    <div className="flex gap-3">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs">PROVISION NOW</Button>
                                        <Button size="sm" variant="outline" className="h-8 text-xs">VIEW SPECS</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Market Intelligence */}
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Regional Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 font-mono">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold uppercase">
                                            <span>Maitama/Asokoro</span>
                                            <span className="text-green-600">₦120.4M</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold uppercase">
                                            <span>Wuse/Garki</span>
                                            <span className="text-orange-600">₦45.2M</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature Adoption */}
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Growth Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted/20 rounded-lg flex items-center justify-between border-l-4 border-l-primary">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Multimedia Retention</p>
                                        <p className="text-lg font-bold">88.4%</p>
                                    </div>
                                    <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg flex items-center justify-between border-l-4 border-l-secondary">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Avg Transaction Size</p>
                                        <p className="text-lg font-bold">₦8.2M</p>
                                    </div>
                                    <PieChart className="h-6 w-6 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Staff Collaboration Side Panel */}
                <div className="space-y-8">
                    <Card className="border-secondary/20 shadow-lg bg-slate-900 text-white">
                        <CardHeader className="bg-slate-950/50 border-b border-slate-800">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                Live Executive Briefing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 h-[400px] flex flex-col">
                            <div className="flex-1 overflow-y-auto space-y-4 text-xs scrollbar-hide">
                                <div className="bg-slate-800/40 p-3 rounded-lg border-l-2 border-l-blue-400">
                                    <p className="font-bold text-blue-300 mb-1">CTO</p>
                                    <p className="text-slate-300 italic">"Abuja Node cache expanded successfully. Latency dropped to 9ms."</p>
                                    <p className="text-[8px] text-slate-500 mt-2">12:14 PM</p>
                                </div>
                                <div className="bg-slate-800/40 p-3 rounded-lg border-l-2 border-l-orange-400">
                                    <p className="font-bold text-orange-300 mb-1">COO</p>
                                    <p className="text-slate-300 italic">"Maitama Verification Drive complete. 12 premium dealers added."</p>
                                    <p className="text-[8px] text-slate-500 mt-2">12:18 PM</p>
                                </div>
                                <div className="bg-slate-800/40 p-3 rounded-lg border-l-2 border-l-pink-400">
                                    <p className="font-bold text-pink-300 mb-1">Mkt-Admin</p>
                                    <p className="text-slate-300 italic">"SEO for 'Tokunbo Lexus' hitting #1 in Abuja."</p>
                                    <p className="text-[8px] text-slate-500 mt-2">12:20 PM</p>
                                </div>
                            </div>
                            <Separator className="my-4 bg-slate-800" />
                            <div className="relative">
                                <input
                                    className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Send directive..."
                                />
                                <Button size="sm" className="absolute right-1 top-1 h-6 text-[10px] px-2">POST</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Admin Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-medium">Ops-Admin (Alpha)</span>
                                </div>
                                <Activity className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-medium">Tech-Admin (Neo)</span>
                                </div>
                                <Activity className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                    <span className="text-xs font-medium opacity-60">Mkt-Admin (Zoe)</span>
                                </div>
                                <Clock className="h-3 w-3 text-muted-foreground opacity-40" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Strategic Initiatives Dashboard */}
            <Card className="border-none bg-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <PieChart className="h-40 w-40" />
                </div>
                <CardHeader>
                    <CardTitle className="text-2xl font-black italic tracking-tighter text-slate-900 underline">Strategic Vision Roadmap</CardTitle>
                    <CardDescription className="text-slate-500">Q4 Expansion Benchmarks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                            <Badge className="mb-2 bg-blue-500">PROJECT AEGIS</Badge>
                            <h4 className="font-bold text-slate-800">Advanced Bank Escrow</h4>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Integrating Tier-1 Nigerian banks for high-value auto trades.</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                            <Badge className="mb-2 bg-purple-500">SIGHT-AI</Badge>
                            <h4 className="font-bold text-slate-800">Visual Spec Extraction</h4>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Automated trim/condition assessment from video uploads.</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                            <Badge className="mb-2 bg-orange-500">ABUJA HUB V4</Badge>
                            <h4 className="font-bold text-slate-800">24/7 Inspection Nodes</h4>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Universal coverage for the Capital territory within 15min arrival.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


