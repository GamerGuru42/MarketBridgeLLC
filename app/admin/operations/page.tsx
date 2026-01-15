'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, ShieldCheck, AlertTriangle, Scale, History, Map, Activity, ShoppingBag, Users, Clock, Zap, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { TourGuide } from '@/components/tour-guide';

const opsTourSteps = [
    {
        title: "Active Escrows",
        description: "Monitor live transactions where funds are held. Release payments only upon confirmed delivery verification.",
        icon: <ShieldCheck size={24} />
    },
    {
        title: "Dispute Tribunal",
        description: "Adjudicate conflicts between buyers and dealers. Your decisions on refunds or releases are final.",
        icon: <Scale size={24} />
    },
    {
        title: "Logistics Map",
        description: "Track shipment vectors across the Abuja territory to identify bottlenecks.",
        icon: <Map size={24} />
    }
];

export default function OperationsAdminPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <TourGuide pageKey="admin_operations" steps={opsTourSteps} title="Operations Briefing" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Marketplace Operations</h1>
                    <p className="text-muted-foreground mt-2">
                        Managing verifications, logistics, and dispute resolution for {user?.displayName || 'Admin'}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/proposals/new">
                            <Zap className="h-4 w-4 mr-2 text-orange-500" />
                            Strategic Proposal
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/operations/verifications">
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Global Verification Queue
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42</div>
                        <p className="text-xs text-orange-600 font-medium">Avg wait: 4.5 hours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                        <Truck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">86 in Abuja Metropolis</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Escrow Volume</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦154.2M</div>
                        <p className="text-xs text-green-600 font-medium">+18% growth this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.8%</div>
                        <p className="text-xs text-muted-foreground">Well within target (2%)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logistics Hub Health */}
                <Card>
                    <CardHeader>
                        <CardTitle>Logistics Network Overview</CardTitle>
                        <CardDescription>Regional hub statuses and dispatcher availability</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Map className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Abuja Central (Garki)</p>
                                        <p className="text-[10px] text-muted-foreground">Main Inspection & Escrow Node</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-green-500">OPERATIONAL</Badge>
                                    <p className="text-xs mt-1 text-muted-foreground">12 dispatchers active</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Map className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Maitama Premium Hub</p>
                                        <p className="text-[10px] text-muted-foreground">Luxury Car Inspection Site</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-green-500">OPERATIONAL</Badge>
                                    <p className="text-xs mt-1 text-muted-foreground">4 specialists on-site</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <Map className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Lagos Integration Node</p>
                                        <p className="text-[10px] text-muted-foreground">Inter-state Logistics Bridge</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">SCALING</Badge>
                                    <p className="text-xs mt-1 text-muted-foreground">Launch scheduled Q1</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Verification Queue Insights */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Identity & Business Verifications</CardTitle>
                                <CardDescription>Security screening for new dealers</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/operations/verifications">Expand View</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span>High-Priority Automotive Dealer (Abuja)</span>
                                <span className="text-orange-600">PENDING SINCE 3H</span>
                            </div>
                            <div className="p-3 border rounded-lg bg-orange-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-bold italic underline">Abuja Prestige Motors</span>
                                </div>
                                <Button size="sm" className="h-7 text-[10px]" asChild>
                                    <Link href="/admin/operations/verifications">VERIFY NOW</Link>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Trust Performance</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Fraud Prevention</p>
                                    <p className="text-lg font-bold">99.2%</p>
                                    <Progress value={99.2} className="h-1 mt-2" />
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">KYB Approval Rate</p>
                                    <p className="text-lg font-bold">64%</p>
                                    <Progress value={64} className="h-1 mt-2" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Operational History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Recent Operational Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold underline italic">Admin-Alpha</span> verified <span className="font-bold">Total Energies Garki</span> dealer profile.
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">12m ago</span>
                        </div>
                        <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Activity className="h-4 w-4" />
                                </div>
                                <div className="text-sm">
                                    Escrow payout triggered for <span className="font-bold">Deal #ABJ-4552</span> (₦4.2M).
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">45m ago</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
