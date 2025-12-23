'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, ShoppingCart, AlertTriangle, Server, Database, BarChart, ArrowRight, Zap } from 'lucide-react';

export default function AdminPage() {
    const { user } = useAuth();

    if (!user) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">
                Welcome back, {user.displayName}. You are logged in as <span className="font-semibold capitalize">{user.role.replace('_', ' ')}</span>.
            </p>

            {/* Admin Hub Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <Link href="/admin/technical" className="group block">
                    <Card className="hover:shadow-lg transition-all border-slate-200 overflow-hidden h-full">
                        <CardHeader className="bg-slate-900 text-white p-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Server className="h-5 w-5 text-blue-400" />
                                    Technical
                                </CardTitle>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 p-4">
                            <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-tight">System Reliability</p>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>Health: <span className="text-green-600 font-bold">OPTIMAL</span></span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/operations" className="group block">
                    <Card className="hover:shadow-lg transition-all border-slate-200 overflow-hidden h-full">
                        <CardHeader className="bg-primary text-white p-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary-foreground" />
                                    Operations
                                </CardTitle>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 p-4">
                            <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-tight">Marketplace Efficiency</p>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>Queue: <span className="text-orange-600 font-bold">12 PENDING</span></span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/marketing" className="group block">
                    <Card className="hover:shadow-lg transition-all border-slate-200 overflow-hidden h-full">
                        <CardHeader className="bg-slate-100 text-slate-900 border-b p-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-primary" />
                                    Marketing
                                </CardTitle>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 p-4">
                            <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-tight">Growth & SEO</p>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>ROI: <span className="text-green-600 font-bold">4.2x</span></span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/proposals/new" className="group block">
                    <Card className="hover:shadow-lg transition-all border-primary/20 border-2 bg-primary/5 overflow-hidden h-full">
                        <CardHeader className="bg-white text-slate-900 border-b p-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2 font-black italic text-primary">
                                    <Zap className="h-5 w-5 text-orange-500" />
                                    Proposal
                                </CardTitle>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all text-orange-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 p-4">
                            <p className="text-xs font-medium text-slate-600 mb-4 truncate">Draft formal CEO memo.</p>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-primary">
                                <span>CEO Direct</span>
                                <Badge className="h-4 text-[8px] bg-orange-100 text-orange-600 border-none">NEW</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* CEO, COO, CTO Quick Access */}
            {['ceo', 'coo', 'cto', 'admin', 'cofounder'].includes(user.role) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 p-6 bg-slate-50 rounded-2xl border">
                    <div className="col-span-full mb-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Executive Command Links</h3>
                    </div>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-sm">CEO Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href="/ceo">Enter Vision Command</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="bg-secondary/5 border-secondary/20">
                        <CardHeader>
                            <CardTitle className="text-sm">COO Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary" className="w-full">
                                <Link href="/coo">Enter Operations Hub</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-sm">CTO Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                                <Link href="/cto">Enter Systems Terminal</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Fallback for generic admin or unassigned roles */}
            {!['technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'coo', 'cto', 'cofounder'].includes(user.role) && (
                <div className="p-4 border rounded bg-muted/20">
                    <p>Select a specific module from the sidebar or contact system administrator.</p>
                </div>
            )}
        </div>
    );
}
