'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Users, Truck, CheckCircle, Clock, AlertTriangle, BarChart3, ArrowUpRight, Zap, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function COOPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Operations Command</h1>
                    <p className="text-muted-foreground mt-2">
                        Operational efficiency and logistics management for {user?.displayName || 'COO'}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/operations/verifications">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verifications
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/disputes">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Disputes
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium italic">Avg. Verification Time</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4 Hours</div>
                        <p className="text-xs text-green-600 font-medium">15% improvement</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium italic">Pending Listings</CardTitle>
                        <BarChart3 className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">18</div>
                        <p className="text-xs text-muted-foreground">4 urgent (Abuja Auto)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium italic">Delivery Success</CardTitle>
                        <Truck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.4%</div>
                        <p className="text-xs text-muted-foreground">Within Abuja Zone</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium italic">Active Dealers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">412</div>
                        <p className="text-xs text-blue-600 font-medium">+12 this week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dealer Onboarding Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dealer Verification Funnel</CardTitle>
                        <CardDescription>Performance of the new media-heavy onboarding flow</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Registration Completed</span>
                                <span className="font-bold">100% (542)</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Document Upload Success</span>
                                <span className="font-bold">76% (412)</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary/80" style={{ width: '76%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Video Introduction Verification</span>
                                <span className="font-bold">62% (336)</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary/60" style={{ width: '62%' }}></div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            The new video intro requirement has filtered out 14% more fraudulent applications compared to Q2.
                        </p>
                    </CardContent>
                </Card>

                {/* Dealer Subscription Health */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Dealer Subscription Health</CardTitle>
                                <CardDescription>Monitoring the 14-day trial and renewal cycle</CardDescription>
                            </div>
                            <Badge variant="outline" className="animate-pulse border-primary text-primary">Live Monitoring</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold text-sm italic">Active Trials</h4>
                                </div>
                                <p className="text-2xl font-black">128</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">First 14-day Window</p>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="h-5 w-5 text-orange-500" />
                                    <h4 className="font-bold text-sm italic">Expiring Soon</h4>
                                </div>
                                <p className="text-2xl font-black">34</p>
                                <p className="text-[10px] text-orange-600 uppercase font-bold mt-1">Last 3 Days of Trial</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <CreditCard className="h-5 w-5 text-slate-700" />
                                    <h4 className="font-bold text-sm italic">Premium Active</h4>
                                </div>
                                <p className="text-2xl font-black">250</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Paid Subscriptions</p>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground italic">
                                Total Dealers currently in the "Glowing Upgrade" phase based on 14-day lifecycle.
                            </p>
                            <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                                Detailed Report <ArrowUpRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* COO Strategic Focus */}
            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle>Operational Directives</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Instant Verification
                        </h4>
                        <p className="text-xs text-muted-foreground">Rolling out auto-ID verification for premium dealers to reduce wait time to under 15 minutes.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            Escrow Logistics Integration
                        </h4>
                        <p className="text-xs text-muted-foreground">Automatic fund release upon 100% confirmed GPS delivery check-in via dispatcher app.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Settings className="h-4 w-4 text-orange-500" />
                            Abuja Hub Deployment
                        </h4>
                        <p className="text-xs text-muted-foreground">Finalizing physical inspection centers in Garki and Maitama for car handovers.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
