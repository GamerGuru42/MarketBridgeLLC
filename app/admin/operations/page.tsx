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

import { supabase } from '@/lib/supabase';

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
    const [stats, setStats] = React.useState({
        pendingVerifications: 0,
        activeShipments: 0,
        escrowVolume: 0,
        disputeRate: 0,
        recentActivity: [] as any[],
        manualPayments: [] as any[]
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            // 1. Pending Verifications
            const { count: pendingCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'dealer')
                .eq('is_verified', false);

            // Fetch Manual Payments
            const { data: manualPayers } = await supabase
                .from('users')
                .select('*')
                .not('payment_metadata', 'is', null) // Check if payment_metadata is not null
                // Note: Supabase JSON filtering on 'is not null' can vary, 
                // simplifying to fetch recent users and filter JS side for now due to potential JSONB complexity limit on simple client
                .limit(50);

            const pendingPayments = manualPayers?.filter(u => u.payment_metadata && u.payment_metadata.proof_url) || [];


            // 2. Active Shipments (Confirmed Orders)
            const { count: shipmentCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            // 3. Escrow Volume (Pending + Confirmed Orders) & Total Orders
            const { data: allOrders } = await supabase
                .from('orders')
                .select('amount, status');

            const escrowOrders = allOrders?.filter(o => ['pending', 'confirmed'].includes(o.status)) || [];
            const volume = escrowOrders.reduce((acc, order) => acc + order.amount, 0);
            const totalOrders = allOrders?.length || 0;

            // 4. Disputes
            const { data: disputes } = await supabase
                .from('disputes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            const disputeCount = disputes?.length || 0;
            // Note: asking for *all* disputes count might be better for rate, but we can assume 'disputes' variable here is recent, 
            // let's do a separate count fetch for accuracy if needed, or just use what we have. 
            // Let's do exact count:
            const { count: totalDisputes } = await supabase.from('disputes').select('*', { count: 'exact', head: true });

            const realDisputeRate = totalOrders > 0 ? ((totalDisputes || 0) / totalOrders) * 100 : 0;

            // 5. Recent Verified Dealers
            const { data: recentDealers } = await supabase
                .from('users')
                .select('display_name, updated_at')
                .eq('role', 'dealer')
                .eq('is_verified', true)
                .order('updated_at', { ascending: false })
                .limit(3);

            // Combine for Activity Feed
            const activities = [
                ...(disputes?.map(d => ({
                    type: 'dispute',
                    message: `Dispute filed for Order #${d.order_id?.slice(0, 8)}`,
                    time: d.created_at
                })) || []),
                ...(recentDealers?.map(d => ({
                    type: 'verification',
                    message: `Dealer ${d.display_name} verified`,
                    time: d.updated_at
                })) || [])
            ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

            setStats({
                pendingVerifications: pendingCount || 0,
                activeShipments: shipmentCount || 0,
                escrowVolume: volume,
                disputeRate: parseFloat(realDisputeRate.toFixed(2)),
                recentActivity: activities,
                manualPayments: pendingPayments
            });
        };
        fetchStats();
    }, []);

    // ... (render return remains similar until the card)

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
                        <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                        <p className="text-xs text-orange-600 font-medium">Dealers awaiting approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                        <Truck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeShipments}</div>
                        <p className="text-xs text-muted-foreground">In transit verification</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Escrow Volume</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{stats.escrowVolume.toLocaleString()}</div>
                        <p className="text-xs text-green-600 font-medium">Held in secure vaults</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.disputeRate}%</div>
                        <p className="text-xs text-muted-foreground">Of total orders</p>
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
                    </CardContent>
                </Card>

                {/* Incoming Subscription Payments - Manual Audit */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-orange-500">Incoming Payments (Audit)</CardTitle>
                                <CardDescription>Manual transfer receipts to verify</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/users">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(!stats.manualPayments || stats.manualPayments.length === 0) ? (
                            <div className="text-center py-8 text-muted-foreground text-xs italic">No new payments to audit.</div>
                        ) : (
                            stats.manualPayments.map((payment: any) => (
                                <div key={payment.id} className="p-3 border rounded-lg bg-black/5 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 relative overflow-hidden rounded-md border border-white/10">
                                            {payment.metadata?.proof_url ? (
                                                <img src={payment.metadata.proof_url} alt="Receipt" className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">?</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{payment.display_name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{new Date(payment.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-orange-500/30 text-orange-600 hover:bg-orange-50" onClick={() => window.open(payment.metadata?.proof_url, '_blank')}>
                                        VIEW RECEIPT
                                    </Button>
                                </div>
                            ))
                        )}
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
                        {stats.recentActivity.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">No recent activity detected.</div>
                        ) : (
                            stats.recentActivity.map((activity, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded flex items-center justify-center ${activity.type === 'dispute' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {activity.type === 'dispute' ? <Activity className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                        </div>
                                        <div className="text-sm">
                                            {activity.message}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(activity.time).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
