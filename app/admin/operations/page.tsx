'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, CreditCard, ShieldCheck } from 'lucide-react';

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
                fetchOpsData();
            } else {
                const err = await res.json();
                console.error('Approval failed:', err);
                alert(err.error || 'Failed to approve');
            }
        } catch (e) {
            console.error('Approval failed:', e);
            alert('Failed to approve seller');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#FF6200]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 font-heading">Operations Dashboard</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                    Operations <span className="text-[#FF6200]">Control</span>
                </h1>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Verification Process, Subscription Management & Compliance Monitoring
                </p>
            </div>

            <Tabs defaultValue="sellers" className="space-y-8 relative z-10 w-full">
                <TabsList className="bg-zinc-900/50 border border-white/5 rounded-xl p-1 h-14 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <TabsTrigger value="sellers" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black text-white/60 uppercase font-black text-[10px] tracking-widest h-12 rounded-lg transition-all min-w-[120px]">
                        Sellers ({pendingSellers.length})
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black text-white/60 uppercase font-black text-[10px] tracking-widest h-12 rounded-lg transition-all min-w-[120px]">
                        Subs ({subscriptions.length})
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black text-white/60 uppercase font-black text-[10px] tracking-widest h-12 rounded-lg transition-all min-w-[120px]">
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="revenue" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black text-white/60 uppercase font-black text-[10px] tracking-widest h-12 rounded-lg transition-all min-w-[120px]">
                        Revenue
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sellers">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-white/5 py-8">
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">Pending Verifications</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            {pendingSellers.map((seller) => (
                                <div key={seller.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/40 p-6 rounded-2xl border border-white/5 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-white/5">
                                            <UserCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white italic font-heading tracking-tight uppercase">{seller.full_name}</p>
                                            <p className="text-[10px] text-white/40 font-mono tracking-widest">{seller.student_email}</p>
                                            <div className="flex gap-4 mt-2">
                                                <Badge variant="outline" className="border-zinc-800 text-[#FF6200] text-[9px] font-black uppercase tracking-widest">{seller.university}</Badge>
                                                <Badge variant="outline" className="border-zinc-800 text-white text-[9px] font-black uppercase tracking-widest">{seller.items_ready} items</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {seller.id_card_url && (
                                            <a href={seller.id_card_url} target="_blank" rel="noreferrer" className="text-[10px] text-[#FF6200] hover:underline uppercase font-black tracking-widest">
                                                View ID Card
                                            </a>
                                        )}
                                        <Button
                                            onClick={() => handleVerify(seller.id)}
                                            className="bg-[#FF6200] text-black hover:bg-[#FF8533] font-black uppercase text-[10px] tracking-[0.2em] h-12 px-8 rounded-xl"
                                        >
                                            Approve User
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {pendingSellers.length === 0 && (
                                <div className="text-center py-20 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                                    <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">Verification Queues Empty</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-white/5 py-8">
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">Active Subscriptions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-6">
                                        <CreditCard className="h-6 w-6 text-white/30" />
                                        <div>
                                            <p className="text-sm font-black text-white italic font-heading tracking-wide uppercase">{sub.users?.email}</p>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Status: <span className="text-[#FF6200]">Operational</span></p>
                                        </div>
                                    </div>
                                    <Badge className="bg-[#FF6200] text-black font-black uppercase text-[10px] tracking-widest px-3 py-1 animate-pulse">Active</Badge>
                                </div>
                            ))}
                            {subscriptions.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">No Active Subscriptions Found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedback">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-white/5 py-8">
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">System Intelligence (Feedback)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {feedback.map((item) => (
                                <div key={item.id} className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#FF6200]/10 transition-colors" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{item.users?.email}</p>
                                        <Badge variant="outline" className="text-[#FF6200] border-[#FF6200]/30 italic font-black uppercase tracking-tighter text-[10px]">{item.rating} / 5 SCORE</Badge>
                                    </div>
                                    <p className="text-sm text-white italic leading-relaxed relative z-10">"{item.comments}"</p>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                                        <span className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em]">Net Promoter Score (NPS): {item.nps_score}</span>
                                        <span className="text-[9px] text-white/20 font-mono italic">ID: {item.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            ))}
                            {feedback.length === 0 && (
                                <p className="text-center text-white/30 font-black uppercase tracking-[0.3em] text-[10px] py-20">Diagnostic Feedback Loop Empty</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="revenue">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12" />
                            <CardContent className="p-10">
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] mb-4">Gross Asset Flow</p>
                                <p className="text-4xl md:text-5xl font-black text-white italic font-heading tracking-tighter leading-none">
                                    ₦{revenue.totalVolume.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6200]/5 rounded-full blur-3xl -mr-12 -mt-12" />
                            <CardContent className="p-10">
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] mb-4">Platform Yield (Commission)</p>
                                <p className="text-4xl md:text-5xl font-black text-[#FF6200] italic font-heading tracking-tighter leading-none">
                                    ₦{revenue.totalCommission.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-white/5 py-8">
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">Financial Ledger</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                {revenue.transactions.map((txn) => (
                                    <div key={txn.id} className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-black/40 p-6 rounded-2xl border border-white/5 items-center">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">System Ref</span>
                                            <p className="text-xs text-white font-mono truncate">#{txn.paystack_reference}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Campus ID</span>
                                            <p className="text-xs text-white italic truncate font-bold font-heading">{txn.seller?.display_name || 'Anonymous Campus'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Asset Value / Net</span>
                                            <p className="text-xs text-white font-black italic">
                                                ₦{txn.amount_total.toLocaleString()} / <span className="text-[#FF6200]">₦{txn.amount_platform.toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="flex md:justify-end">
                                            <Badge className="bg-[#FF6200]/10 text-[#FF6200] border border-[#FF6200]/30 font-black uppercase text-[9px] tracking-[0.2em] px-3 py-1 rounded-md">Validated</Badge>
                                        </div>
                                    </div>
                                ))}
                                {revenue.transactions.length === 0 && (
                                    <div className="text-center py-20">
                                        <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">Financial Stream Idle</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center py-10 text-white/10 text-[9px] font-black uppercase tracking-[0.5em] font-heading relative z-10">
                Data Stream End-to-End Encrypted // MarketBridge Alpha Control
            </div>
        </div>
    );
}