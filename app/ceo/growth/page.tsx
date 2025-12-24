'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity, MapPin, Video, PieChart, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CEOGrowthPage() {
    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Market Intelligence</h1>
                    <p className="text-muted-foreground mt-2">
                        Real-time growth metrics and expansion vectors.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-green-950/30 text-green-500 border-green-900">
                    <TrendingUp className="h-3 w-3 mr-2" />
                    Market Sentiment: Bullish
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="items-start">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">User Acquisition Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₦2,450</div>
                        <div className="flex items-center text-xs text-green-500 mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            -12% vs last month
                        </div>
                    </CardContent>
                </Card>
                <Card className="items-start">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lifetime Value (LTV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₦85,000</div>
                        <div className="flex items-center text-xs text-green-500 mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +5% vs last month
                        </div>
                    </CardContent>
                </Card>
                <Card className="items-start">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">12,405</div>
                        <div className="flex items-center text-xs text-green-500 mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +22% growth
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-lg bg-slate-900/50">
                <CardHeader>
                    <CardTitle>Regional Penetration Map</CardTitle>
                    <CardDescription>Density of verified dealers across active zones</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center border rounded border-dashed border-slate-700">
                    <div className="text-center space-y-2">
                        <MapPin className="h-10 w-10 text-slate-600 mx-auto" />
                        <p className="text-slate-500 font-mono text-sm">Interactive Geo-Map Loading...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
