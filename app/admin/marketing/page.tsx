'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Mail, Megaphone, Share2, Search, Target, MousePointer2, Sparkles, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TourGuide } from '@/components/tour-guide';

const marketingTourSteps = [
    {
        title: "Growth Metrics",
        description: "Analyze user acquisition and revenue growth.",
        icon: <BarChart3 size={24} />
    },
    {
        title: "Campaign Manager",
        description: "Launch and monitor active PPC or Social campaigns.",
        icon: <Megaphone size={24} />
    },
    {
        title: "SEO Intelligence",
        description: "Track search rankings for key inventory keywords in the Abuja region.",
        icon: <Search size={24} />
    }
];

export default function MarketingAdminPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRevenue: 0,
        dealerRatio: 0,
        activeListings: 0,
        newsletterReach: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            // 1. Total Users
            const { count: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // 2. Total Dealers
            const { count: dealerCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'dealer');

            // 3. Active Listings
            const { count: listingsCount } = await supabase
                .from('listings')
                .select('*', { count: 'exact', head: true });

            // 4. Revenue (Sum of amounts from Orders)
            const { data: orders } = await supabase
                .from('orders')
                .select('amount')
                .in('status', ['confirmed', 'completed']);

            const revenue = orders?.reduce((acc, order) => acc + order.amount, 0) || 0;

            const ratio = userCount ? (dealerCount || 0) / userCount * 100 : 0;

            setStats({
                totalUsers: userCount || 0,
                totalRevenue: revenue,
                dealerRatio: ratio,
                activeListings: listingsCount || 0,
                newsletterReach: userCount || 0 // Assuming all users are reachable
            });
        };

        fetchStats();
    }, []);

    return (
        <div className="container mx-auto py-10 px-4 space-y-8 text-slate-900">
            <TourGuide pageKey="admin_marketing" steps={marketingTourSteps} title="Marketing Briefing" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Growth & Marketing</h1>
                    <p className="text-muted-foreground mt-2">
                        Campaign orchestration and user acquisition analytics for {user?.displayName || 'Admin'}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Newsletter
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-pink-600 to-primary hover:opacity-90">
                        <Megaphone className="h-4 w-4 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-white to-blue-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Registered Accounts
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-green-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                        <BarChart3 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-green-600 font-medium">Gross Transaction Volume</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-purple-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dealer Ratio</CardTitle>
                        <Target className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.dealerRatio.toFixed(1)}%</div>
                        <p className="text-xs text-purple-600 font-medium">of users are Sellers</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-orange-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Reach</CardTitle>
                        <Share2 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeListings.toLocaleString()}</div>
                        <p className="text-xs text-orange-600 font-medium">Active Listings Live</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campaign Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-primary" />
                            Active Campaigns (Simulated)
                        </CardTitle>
                        <CardDescription>Performance of current marketing initiatives</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 border rounded-xl space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sm">Abuja Automotive Wave Q4</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Instagram + Facebook PPC</p>
                                    </div>
                                    <Badge className="bg-green-500">LIVE</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                                        <p className="text-[10px] text-muted-foreground">Spend</p>
                                        <p className="text-xs font-bold">₦2.4M</p>
                                    </div>
                                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                                        <p className="text-[10px] text-muted-foreground">CTR</p>
                                        <p className="text-xs font-bold font-bold font-bold">2.41%</p>
                                    </div>
                                    <div className="text-center p-2 bg-muted/20 rounded-lg text-primary">
                                        <p className="text-[10px] text-muted-foreground">Conv.</p>
                                        <p className="text-xs font-bold">142</p>
                                    </div>
                                </div>
                                <Progress value={75} className="h-1" />
                            </div>

                            <div className="p-4 border rounded-xl space-y-3 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sm">Garki Market Outreach</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Direct SMS + Radio</p>
                                    </div>
                                    <Badge variant="outline">PAUSED</Badge>
                                </div>
                                <Progress value={0} className="h-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SEO & Search Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-blue-500" />
                            SEO Intelligence (External Beta)
                        </CardTitle>
                        <CardDescription>Search engine visibility and organic traffic</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded text-blue-500 bg-blue-50 flex items-center justify-center">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium italic underline">"Used cars Abuja"</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-green-600">Pos #3</p>
                                    <p className="text-[10px] text-muted-foreground">Top 3 result</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded text-blue-500 bg-blue-50 flex items-center justify-center">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium italic underline">"Verified car dealers Nigeria"</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-green-600">Pos #1</p>
                                    <p className="text-[10px] text-muted-foreground">Featured Snippet</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded text-blue-500 bg-blue-50 flex items-center justify-center">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium italic underline">"Buy Toyota Abuja"</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-orange-600">Pos #8</p>
                                    <p className="text-[10px] text-muted-foreground">Falling -2 posts</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-blue-900">AI SEO Suggestion</p>
                                <p className="text-[10px] text-blue-700 mt-0.5">Content gap detected for "Luxury Escrow Services Nigeria". Creating a landing page for this could lift organic traffic by 14%.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Newsletter Segment */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 md:flex items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Newsletter Broadcast
                        </h4>
                        <p className="text-sm text-muted-foreground">Reach {stats.newsletterReach.toLocaleString()} verified accounts with a single click.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="text-right">
                            <p className="text-sm font-bold">Open Rate: --</p>
                            <p className="text-xs text-muted-foreground">Campaign Pending</p>
                        </div>
                        <Button size="lg" className="shadow-lg">Compose Email</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
