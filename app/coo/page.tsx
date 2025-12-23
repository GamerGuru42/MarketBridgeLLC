'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Users, Truck, CheckCircle, Clock, AlertTriangle, BarChart3, ArrowUpRight } from 'lucide-react';
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

                {/* Logistics & Escrow Health */}
                <Card>
                    <CardHeader>
                        <CardTitle>Logistics & Escrow Status</CardTitle>
                        <CardDescription>Abuja Inner-City Operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-green-900 italic underline">Funds in Escrow</p>
                                        <p className="text-xs text-green-700 font-bold">Verified & Secure</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-900">₦42.5M</p>
                                    <p className="text-[10px] text-green-600">Across 18 Active Deals</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-tighter text-muted-foreground italic underline">Active Logistics Nodes</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 border rounded-lg">
                                        <p className="text-xs font-semibold">Maitama Hub</p>
                                        <Badge className="mt-1 bg-green-500">Optimal</Badge>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                        <p className="text-xs font-semibold">Wuse Dispatch</p>
                                        <Badge className="mt-1 bg-green-500">Optimal</Badge>
                                    </div>
                                </div>
                            </div>
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
