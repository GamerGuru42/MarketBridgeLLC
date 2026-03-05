'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, CreditCard, ShieldCheck, TrendingUp, DollarSign, Activity, ChevronRight, Scale, Inbox } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function OperationsAdminPage() {
    const [loading, setLoading] = useState(true);
    const [pendingSellers, setPendingSellers] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [revenue, setRevenue] = useState<{ transactions: any[], totalVolume: number, totalCommission: number }>({
        transactions: [],
        totalVolume: 0,
        totalCommission: 0
    });
    const { toast } = useToast();

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

            if (sellers) setPendingSellers(sellers);
            if (subs) setSubscriptions(subs);
            if (feed) setFeedback(feed);

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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/admin/approve-seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, approverId: session.user.id })
            });

            if (res.ok) {
                toast('Seller approved successfully!', 'success');
                fetchOpsData();
            } else {
                toast('Approval failed', 'error');
            }
        } catch (e) {
            toast('Operation error', 'error');
        }
    };

    const handleDecline = async (applicationId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('seller_applications')
                .update({ status: 'declined', reviewer_id: session.user.id })
                .eq('id', applicationId);

            if (!error) {
                toast('Application declined', 'info');
                fetchOpsData();
            } else {
                toast('Decline failed', 'error');
            }
        } catch (e) {
            toast('Operation error', 'error');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-background transition-colors duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 space-y-10 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-heading">Operations Dashboard</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic font-heading">
                    Operations <span className="text-primary">Control</span>
                </h1>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest leading-relaxed opacity-60">
                    Verification Engine // Subscription Nodes // Financial Recon
                </p>
            </div>

            <Tabs defaultValue="sellers" className="space-y-10 relative z-10 w-full">
                <TabsList className="bg-card border border-border rounded-2xl p-1.5 h-16 w-full md:w-auto overflow-x-auto no-scrollbar shadow-sm">
                    {[
                        { val: 'sellers', label: 'Verifications', count: pendingSellers.length, icon: UserCheck },
                        { val: 'subscriptions', label: 'Subscriptions', count: subscriptions.length, icon: CreditCard },
                        { val: 'feedback', label: 'Intelligence', count: feedback.length, icon: Activity },
                        { val: 'revenue', label: 'Financials', count: null, icon: DollarSign },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.val}
                            value={tab.val}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground uppercase font-black text-[10px] tracking-widest h-12 rounded-xl transition-all px-8 flex items-center gap-3 border-none"
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label} {tab.count !== null && `(${tab.count})`}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="sellers">
                    <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden transition-colors duration-300">
                        <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Queue: <span className="text-primary">Pending</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-4">
                            {pendingSellers.map((seller) => (
                                <div key={seller.id} className="flex flex-col lg:flex-row lg:items-center justify-between bg-muted/40 p-8 rounded-[2rem] border border-border/50 gap-8 group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-8">
                                        <div className="h-20 w-20 bg-card rounded-3xl flex items-center justify-center border border-border shadow-sm group-hover:scale-105 transition-transform">
                                            <UserCheck className="h-8 w-8 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-2xl font-black text-foreground italic font-heading tracking-tighter uppercase">{seller.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em]">{seller.student_email}</p>
                                            <div className="flex gap-4">
                                                <Badge variant="outline" className="border-border text-primary text-[9px] font-black uppercase tracking-widest bg-card">{seller.university}</Badge>
                                                <Badge variant="outline" className="border-border text-foreground/40 text-[9px] font-black uppercase tracking-widest bg-card">{seller.items_ready} ITEMS READY</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 items-end min-w-[240px]">
                                        <div className="flex gap-3 w-full">
                                            <Button
                                                onClick={() => handleVerify(seller.id)}
                                                className="bg-primary text-primary-foreground hover:opacity-90 font-black uppercase text-[10px] tracking-widest h-14 flex-1 rounded-2xl border-none shadow-lg shadow-primary/10"
                                            >
                                                Authorize
                                            </Button>
                                            <Button
                                                onClick={() => handleDecline(seller.id)}
                                                variant="outline"
                                                className="border-red-500/20 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest h-14 flex-1 rounded-2xl"
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                        {seller.id_card_url && (
                                            <a href={seller.id_card_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline uppercase font-black tracking-widest flex items-center gap-2 pr-2">
                                                Scan ID Certificate <ChevronRight className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pendingSellers.length === 0 && (
                                <div className="text-center py-32 bg-muted/20 rounded-3xl border border-border border-dashed">
                                    <Inbox className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-black uppercase tracking-[0.5em] text-[9px]">Ingestion Pipeline Idle</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions">
                    <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Active <span className="text-primary">Protocols</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-4">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between bg-muted/40 p-8 rounded-[2rem] border border-border/50 group">
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-foreground italic uppercase tracking-tight">{sub.users?.email}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 italic">Protocol Status: <span className="text-primary">OPERATIONAL</span></p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-xl animate-pulse border-none shadow-lg shadow-primary/20">Active Node</Badge>
                                </div>
                            ))}
                            {subscriptions.length === 0 && (
                                <div className="text-center py-32">
                                    <p className="text-muted-foreground font-black uppercase tracking-[0.5em] text-[9px] opacity-30">Zero active subscriptions in grid</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedback">
                    <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Feedback <span className="text-primary">Relay</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            {feedback.map((item) => (
                                <div key={item.id} className="bg-muted/40 p-10 rounded-[2.5rem] border border-border/50 space-y-6 relative overflow-hidden group hover:bg-muted/60 transition-colors">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[100px] -mr-24 -mt-24 group-hover:bg-primary/10 transition-colors" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center font-black text-xs text-muted-foreground uppercase">{item.users?.email?.[0]}</div>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.users?.email}</p>
                                        </div>
                                        <Badge variant="outline" className="text-primary border-primary/30 italic font-black uppercase tracking-widest text-[10px] h-8 px-4 bg-primary/5">{item.rating} / 5 SCORE</Badge>
                                    </div>
                                    <div className="p-8 bg-card rounded-3xl border border-border/50 relative z-10">
                                        <p className="text-base text-foreground/80 italic font-medium leading-relaxed">"{item.comments}"</p>
                                    </div>
                                    <div className="pt-6 border-t border-border/30 flex justify-between items-center relative z-10">
                                        <span className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                                            <Scale className="h-3 w-3" /> NPS Score: <span className="text-foreground">{item.nps_score}</span>
                                        </span>
                                        <span className="text-[9px] text-muted-foreground/30 font-mono italic">NODE-TX-ID: {item.id.toUpperCase().slice(0, 12)}</span>
                                    </div>
                                </div>
                            ))}
                            {feedback.length === 0 && (
                                <p className="text-center text-muted-foreground font-black uppercase tracking-[0.5em] text-[9px] py-32 opacity-30 italic">Diagnostic stream clear</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="revenue">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                        <Card className="bg-card border-border shadow-xl rounded-[3rem] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 transition-all group-hover:bg-primary/10" />
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                                <Activity className="h-4 w-4" /> Gross Network Volume
                            </p>
                            <p className="text-5xl md:text-7xl font-black text-foreground italic font-heading tracking-tighter leading-none mb-4 group-hover:scale-105 transition-transform origin-left">
                                ₦{revenue.totalVolume.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                <TrendingUp className="h-4 w-4" /> Live Liquidity Stream
                            </div>
                        </Card>
                        <Card className="bg-primary text-primary-foreground border-none shadow-[0_20px_60px_rgba(255,98,0,0.2)] rounded-[3rem] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[80px] -mr-24 -mt-24 transition-all group-hover:bg-white/10" />
                            <p className="text-[11px] opacity-60 font-black uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                                <Crown className="h-4 w-4" /> Platform Yield
                            </p>
                            <p className="text-5xl md:text-7xl font-black italic font-heading tracking-tighter leading-none mb-4 group-hover:scale-105 transition-transform origin-left">
                                ₦{revenue.totalCommission.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 opacity-80 text-[10px] font-black uppercase tracking-widest">
                                <Activity className="h-4 w-4" /> Net Capital Accrual
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-card border-border shadow-sm rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-muted/20 py-10 px-10 border-b border-border">
                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Financial <span className="text-primary">Registry</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="space-y-6">
                                {revenue.transactions.map((txn) => (
                                    <div key={txn.id} className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-muted/40 p-8 rounded-[2rem] border border-border/50 items-center hover:bg-muted/60 transition-colors">
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 flex items-center gap-2"><div className="h-1 w-1 bg-primary rounded-full animate-pulse" /> Signal Ref</span>
                                            <p className="text-sm text-foreground font-black italic tracking-tight">{txn.paystack_reference || 'LEGACY-TX'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Node Origin</span>
                                            <p className="text-sm text-foreground font-black uppercase tracking-tighter italic truncate">{txn.seller?.display_name || 'SYSTEM CORE'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">TXN Value / Fee</span>
                                            <p className="text-lg font-black italic font-mono tracking-tighter">
                                                ₦{txn.amount_total.toLocaleString()} <span className="text-primary opacity-40 mx-2">//</span> <span className="text-primary">₦{txn.amount_platform.toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="flex md:justify-end">
                                            <Badge className="bg-primary/20 text-primary border border-primary/20 font-black uppercase text-[10px] tracking-widest px-6 py-2 rounded-xl h-10">Validated</Badge>
                                        </div>
                                    </div>
                                ))}
                                {revenue.transactions.length === 0 && (
                                    <div className="text-center py-32 border border-border/50 border-dashed rounded-3xl">
                                        <Activity className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
                                        <p className="text-muted-foreground font-black uppercase tracking-[0.5em] text-[10px] opacity-30 italic">Financial river idle</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center py-20 text-muted-foreground/20 text-[9px] font-black uppercase tracking-[0.8em] font-heading relative z-10 transition-opacity hover:opacity-100">
                Data Stream // End-to-End Integrity // Secure Node Omega
            </div>
        </div>
    );
}