'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, CreditCard, ShieldCheck, TrendingUp, DollarSign, Activity, ChevronRight, Scale, Inbox, MessageSquare, Crown, Banknote, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OperationsAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [pendingSellers, setPendingSellers] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [ambassadorApps, setAmbassadorApps] = useState<any[]>([]);
    const [revenue, setRevenue] = useState<{ transactions: any[], totalVolume: number, totalCommission: number }>({
        transactions: [],
        totalVolume: 0,
        totalCommission: 0
    });

    useEffect(() => {
        const ADMIN_ROLES = ['admin', 'operations_admin', 'ceo', 'technical_admin', 'cofounder'];
        if (!authLoading && (!user || !ADMIN_ROLES.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        fetchOpsData();
    }, []);

    const fetchOpsData = async () => {
        try {
            const { data: sellers } = await supabase
                .from('seller_applications')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            const { data: subs } = await supabase
                .from('subscriptions')
                .select('*, users(email)')
                .eq('status', 'active');

            const { data: feed } = await supabase
                .from('seller_feedback')
                .select('*, users(email)')
                .order('created_at', { ascending: false });

            const { data: ambApps } = await supabase
                .from('ambassador_applications')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (sellers) setPendingSellers(sellers);
            if (subs) setSubscriptions(subs);
            if (feed) setFeedback(feed);
            if (ambApps) setAmbassadorApps(ambApps);

            const { data: txns } = await supabase
                .from('sales_transactions')
                .select('*, buyer:users!sales_transactions_buyer_id_fkey(email), seller:users!sales_transactions_seller_id_fkey(display_name)')
                .order('created_at', { ascending: false });

            if (txns) {
                const totalVolume = txns.reduce((sum, t) => sum + Number(t.amount_total), 0);
                const totalCommission = txns.reduce((sum, t) => sum + Number(t.amount_platform), 0);
                setRevenue({ transactions: txns, totalVolume, totalCommission });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (applicationId: string) => {
        try {
            const res = await fetch('/api/admin/approve-seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId })
            });

            if (res.ok) {
                toast('Seller authorized successfully!', 'success');
                fetchOpsData();
            } else {
                toast('Authorization failed', 'error');
            }
        } catch (e) {
            toast('Operation error', 'error');
        }
    };

    if (authLoading || loading) return (
        <div className="flex justify-center items-center h-screen bg-background transition-colors duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 space-y-12 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />

            {/* Header / Station ID */}
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">Operational Hub</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Operations <span className="text-primary">Hub</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest leading-relaxed opacity-60 max-w-2xl">
                            Entity verification pipeline // Capital flow management // Ambassador strategic onboarding
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                       <Badge variant="outline" className="h-16 px-8 rounded-2xl border-border bg-card shadow-sm flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <div className="text-left">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Station ID</p>
                                <p className="text-[12px] font-black text-foreground uppercase tracking-tighter">OPS-CENTER-{user?.id?.slice(0, 4).toUpperCase() || 'HUB'}</p>
                            </div>
                        </Badge>
                        <Link href="/admin/executive-chat">
                            <Button className="h-16 w-16 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-2xl flex items-center justify-center border shadow-xl shadow-primary/5">
                                <MessageSquare className="h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="sellers" className="space-y-12 relative z-10 w-full">
                <TabsList className="bg-card border border-border rounded-3xl p-2 h-20 w-full md:w-auto overflow-x-auto no-scrollbar shadow-sm">
                    {[
                        { val: 'sellers', label: 'Verifications', count: pendingSellers.length, icon: UserCheck },
                        { val: 'ambassadors', label: 'Ambassadors', count: ambassadorApps.length, icon: Crown },
                        { val: 'revenue', label: 'Capital Flow', count: null, icon: Banknote },
                        { val: 'subscriptions', label: 'Protocols', count: subscriptions.length, icon: Activity },
                        { val: 'feedback', label: 'Intelligence', count: feedback.length, icon: MessageSquare },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.val}
                            value={tab.val}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground uppercase font-black text-[10px] tracking-widest h-16 rounded-2xl transition-all px-8 flex items-center gap-3 border-none"
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label} {tab.count !== null && <span className="opacity-50 ml-1">({tab.count})</span>}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="sellers" className="space-y-6">
                    <Card className="bg-card border-border shadow-sm rounded-[3.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-12 px-12 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Verification <span className="text-primary">Pipeline</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-12 space-y-6">
                            {pendingSellers.map((seller) => (
                                <div key={seller.id} className="flex flex-col lg:flex-row lg:items-center justify-between bg-muted/30 p-10 rounded-[2.5rem] border border-border/50 gap-10 group hover:bg-muted/50 transition-all">
                                    <div className="flex items-center gap-10">
                                        <div className="h-24 w-24 bg-card rounded-[2rem] flex items-center justify-center border border-border shadow-sm group-hover:scale-110 transition-transform">
                                            <UserCheck className="h-10 w-10 text-primary" />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-3xl font-black text-foreground italic font-heading tracking-tighter uppercase leading-none">{seller.full_name}</p>
                                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em] italic opacity-60">{seller.student_email} // {seller.university}</p>
                                            <div className="flex gap-4">
                                                <Badge variant="outline" className="border-border text-primary text-[10px] font-black uppercase tracking-widest bg-card px-4 py-1.5 rounded-full">{seller.business_type}</Badge>
                                                <Badge variant="outline" className="border-border text-foreground/40 text-[10px] font-black uppercase tracking-widest bg-card px-4 py-1.5 rounded-full">{seller.items_ready} READYY</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6 items-end min-w-[280px]">
                                        <div className="flex gap-4 w-full">
                                            <Button
                                                onClick={() => handleVerify(seller.id)}
                                                className="bg-primary text-primary-foreground hover:opacity-90 font-black uppercase text-[10px] tracking-widest h-16 flex-1 rounded-[1.5rem] border-none shadow-xl shadow-primary/10"
                                            >
                                                Authorize Entity
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 font-black uppercase text-[10px] tracking-widest h-16 w-16 rounded-[1.5rem]"
                                            >
                                                <ShieldAlert className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        {seller.id_card_url && (
                                            <a href={seller.id_card_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline uppercase font-black tracking-widest flex items-center gap-3 pr-4">
                                                Verify Credentials <ChevronRight className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pendingSellers.length === 0 && (
                                <div className="text-center py-40 border-2 border-border border-dashed rounded-[3rem] opacity-20">
                                    <Inbox className="h-16 w-16 mx-auto mb-6" />
                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic">Pipeline Clear</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="revenue">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                         <Card className="bg-card border-border shadow-xl rounded-[4rem] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all" />
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] mb-8 flex items-center gap-3">
                                <Activity className="h-4 w-4" /> Network Gross Volume
                            </p>
                            <p className="text-6xl md:text-8xl font-black text-foreground italic font-heading tracking-tighter leading-none mb-6">
                                ₦{revenue.totalVolume.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-3 text-green-500 text-[11px] font-black uppercase tracking-widest">
                                <TrendingUp className="h-5 w-5" /> Positive Signal Stream
                            </div>
                        </Card>
                        <Card className="bg-primary text-primary-foreground border-none shadow-[0_25px_80px_rgba(255,98,0,0.25)] rounded-[4rem] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full group-hover:bg-white/20 transition-all" />
                            <p className="text-[11px] opacity-60 font-black uppercase tracking-[0.5em] mb-8 flex items-center gap-3">
                                <Crown className="h-4 w-4" /> Platform Yield (Net)
                            </p>
                            <p className="text-6xl md:text-8xl font-black italic font-heading tracking-tighter leading-none mb-6">
                                ₦{revenue.totalCommission.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-3 opacity-80 text-[11px] font-black uppercase tracking-widest">
                                <Activity className="h-5 w-5" /> Capital Accrual: Nominal
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-card border-border shadow-sm rounded-[3.5rem] overflow-hidden">
                         <CardHeader className="bg-muted/10 py-12 px-12 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter text-foreground">Capital <span className="text-primary">Registry</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-12">
                             <div className="space-y-8">
                                {revenue.transactions.map((txn) => (
                                    <div key={txn.id} className="grid grid-cols-1 md:grid-cols-4 gap-12 bg-muted/40 p-10 rounded-[3rem] border border-border/50 items-center hover:bg-muted/60 transition-colors group">
                                        <div className="space-y-3">
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40 flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" /> Signal Ref
                                            </span>
                                            <p className="text-sm text-foreground font-black italic font-mono tracking-tighter group-hover:text-primary transition-colors">{txn.paystack_reference || 'LEGACY-TX'}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Operational Node</span>
                                            <p className="text-base font-black uppercase tracking-tighter italic truncate">{txn.seller?.display_name || 'SYSTEM'}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Value / Yield</span>
                                            <p className="text-xl font-black italic font-mono tracking-tighter">
                                                ₦{txn.amount_total.toLocaleString()} <span className="text-primary opacity-20 mx-3">//</span> <span className="text-primary font-black">₦{txn.amount_platform.toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="flex md:justify-end">
                                            <Badge className="bg-primary/20 text-primary border border-primary/20 font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded-2xl h-12">VALIDATED</Badge>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Fallback for other tabs (existing logic maintained) */}
                <TabsContent value="ambassadors">
                     <Card className="bg-card border-border shadow-sm rounded-[3.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-12 px-12 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Strategic <span className="text-primary">Vetting</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-12 space-y-6">
                            {ambassadorApps.map((app) => (
                                <div key={app.id} className="flex flex-col lg:flex-row lg:items-center justify-between bg-muted/30 p-10 rounded-[2.5rem] border border-border/50 gap-10">
                                    <div className="flex items-center gap-10">
                                        <div className="h-20 w-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 text-primary">
                                            <Crown className="h-10 w-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-2xl font-black text-foreground italic font-heading tracking-tighter uppercase">{app.full_name}</p>
                                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{app.university} // NODE ID: {app.student_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button className="bg-primary h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest">Verify Ambassador</Button>
                                        <Button variant="outline" className="border-red-500/10 text-red-500 h-14 w-14 rounded-2xl flex items-center justify-center">
                                            <ShieldAlert className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions">
                    {/* Maintain existing premium sub view */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {subscriptions.map((sub) => (
                            <Card key={sub.id} className="bg-card border-border shadow-sm rounded-[3rem] p-10 hover:border-primary/20 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:bg-primary/10" />
                                <div className="flex flex-col h-full justify-between gap-10">
                                    <div className="space-y-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <p className="text-xl font-black text-foreground italic uppercase tracking-tighter">{sub.users?.email}</p>
                                        <Badge className="bg-primary text-white font-black uppercase text-[9px] tracking-widest rounded-full px-4 py-2">LIVE PROTOCOL</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-40">System Node: Operational</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="text-center py-20 opacity-20 hover:opacity-100 transition-opacity">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Operational Deployment // Secure Network Hub //Nigeria 2026</p>
            </div>
        </div>
    );
}