'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, ShoppingCart, AlertTriangle, Server, Database, BarChart, ArrowRight, Zap, LayoutDashboard, Loader2 } from 'lucide-react';
import { TourGuide } from '@/components/tour-guide';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const { user } = useAuth();

    const adminTourSteps = [
        {
            title: "Mission Control Briefing",
            description: "Welcome to the central command node. This dashboard routes you to specific operational departments.",
            icon: <LayoutDashboard size={24} />
        },
        {
            title: "Departmental Nodes",
            description: "Access specialized tools for Technical, Operations, and Marketing management from these quick-link cards.",
            icon: <Server size={24} />
        },
        {
            title: "Strategic Proposals",
            description: "Draft official memos and upgrade requests for the CEO here. All submissions are logged for audit.",
            icon: <Zap size={24} />
        }
    ];

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 animate-spin text-[#FFB800]" />
        </div>
    );

    return (
        <div className="container mx-auto py-12 px-6">
            <TourGuide pageKey="admin_hub" steps={adminTourSteps} title="Admin Briefing" />

            <div className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 italic">
                    Admin <span className="text-[#FFB800]">Mission Control</span>
                </h1>
                <p className="text-zinc-500 font-medium italic lowercase">
                    Authorized Access: {user.displayName} // Unit: <span className="text-white font-black">{user.role.replace('_', ' ')} terminal</span>
                </p>
            </div>

            {/* Departmental Hub Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {[
                    { title: "Technical", href: "/admin/technical", icon: Server, color: "text-blue-400", label: "System Reliability", status: "Health: OPTIMAL" },
                    { title: "Operations", href: "/admin/operations", icon: Activity, color: "text-[#FFB800]", label: "Marketplace Efficiency", status: "Queue: 12 PENDING" },
                    { title: "Marketing", href: "/admin/marketing", icon: BarChart, color: "text-emerald-400", label: "Growth & SEO", status: "ROI: 4.2x" },
                    { title: "Proposal", href: "/admin/proposals/new", icon: Zap, color: "text-orange-400", label: "CEO Direct Memo", status: "STATUS: PRIORITY", isNew: true },
                ].map((node) => (
                    <Link key={node.title} href={node.href} className="group h-full">
                        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500 h-full flex flex-col group/card">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/card:border-[#FFB800]/30 transition-colors">
                                        <node.icon className={cn("h-7 w-7", node.color)} />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                                <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
                                    {node.title}
                                </CardTitle>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                    {node.label}
                                </p>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4 mt-auto">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">{node.status}</span>
                                    {node.isNew && <Badge className="bg-[#FFB800] text-black font-black text-[8px] border-none px-2 rounded-sm italic">SYSTEM REQ</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Access Terminal */}
            <div className="glass-card rounded-[3rem] p-12 border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-[#FFB800]/5 to-transparent pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 italic">// Global Command Shortcuts</h3>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { label: 'User Stream', href: '/admin/users' },
                                { label: 'Asset Manager', href: '/admin/listings' },
                                { label: 'Dispute Node', href: '/admin/disputes' }
                            ].map(link => (
                                <Button key={link.label} asChild variant="outline" className="border-white/10 text-white rounded-full uppercase text-[10px] font-black tracking-widest h-12 px-8 hover:bg-white/5 hover:border-[#FFB800]/30">
                                    <Link href={link.href}>{link.label}</Link>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 text-right">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">System Status</p>
                        <div className="flex items-center gap-2 text-[#00FF85] font-black italic">
                            <span className="h-2 w-2 rounded-full bg-[#00FF85] animate-ping" />
                            NETWORK LIVE
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
