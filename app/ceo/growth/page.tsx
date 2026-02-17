'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity, MapPin, Video, PieChart, ArrowUpRight, BarChart3, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchCEOStats, CEOStats } from '@/lib/analytics';

export default function CEOGrowthPage() {
    const [stats, setStats] = useState<CEOStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchCEOStats();
                setStats(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" /></div>;

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
                    Growth Status: Active
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="items-start border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Addressable Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.totalUsers.toLocaleString() || 0}</div>
                        <div className="flex items-center text-xs text-blue-500 mt-1">
                            <Users className="h-3 w-3 mr-1" />
                            Registered Accounts
                        </div>
                    </CardContent>
                </Card>
                <Card className="items-start border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gross Merchandise Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₦{stats?.gmv.toLocaleString() || '0'}</div>
                        <div className="flex items-center text-xs text-green-500 mt-1">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Verified Revenue
                        </div>
                    </CardContent>
                </Card>
                <Card className="items-start border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Inventory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.activeListings.toLocaleString() || 0}</div>
                        <div className="flex items-center text-xs text-purple-500 mt-1">
                            <Video className="h-3 w-3 mr-1" />
                            Live Listings
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-lg bg-slate-900/50">
                <CardHeader>
                    <CardTitle>Regional Distribution</CardTitle>
                    <CardDescription>Dealer density across key operational zones</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center border rounded border-dashed border-slate-700">
                    <div className="text-center space-y-4">
                        <BarChart3 className="h-16 w-16 text-slate-700 mx-auto" />
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-slate-400">{stats?.activeDealers || 0}</p>
                            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Verified Dealers Active</p>
                        </div>
                        <p className="text-xs text-slate-600 max-w-sm mx-auto">
                            Detailed heatmap requires geolocation data from active sessions. Currently aggregating from user profiles.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
