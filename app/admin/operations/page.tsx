'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, CreditCard, MessageCircle, AlertTriangle } from 'lucide-react';

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
            // 1. Pending Sellers
            const { data: sellers } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'dealer')
                .eq('is_verified', false)
                .order('created_at', { ascending: false });

            // 2. Active Subscriptions
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('*, users(email)')
                .eq('status', 'active');

            // 3. Feedback
            const { data: feed } = await supabase
                .from('seller_feedback')
                .select('*, users(email)')
                .order('created_at', { ascending: false });

            if (sellers) setPendingSellers(sellers);
            if (subs) setSubscriptions(subs);
            if (feed) setFeedback(feed);

            // 4. Revenue Stats
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

    const handleVerify = async (userId: string) => {
        // Implement verification logic (call API or update DB)
        await supabase.from('users').update({ is_verified: true }).eq('id', userId);
        fetchOpsData(); // Refresh
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 relative">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="relative z-10 space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                    Operations <span className="text-[#FF6600]">Control</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    Verification, Subscriptions & Compliance
                </p>
            </div>

            <Tabs defaultValue="sellers" className="space-y-8 relative z-10 w-full">
                <TabsList className="bg-zinc-900/50 border border-white/5 rounded-xl p-1 h-14">
                    <TabsTrigger value="sellers" className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-black text-zinc-400 uppercase font-black text-xs tracking-widest h-12 rounded-lg transition-all w-32">
                        Sellers ({pendingSellers.length})
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-black text-zinc-400 uppercase font-black text-xs tracking-widest h-12 rounded-lg transition-all w-32">
                        Subs ({subscriptions.length})
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-black text-zinc-400 uppercase font-black text-xs tracking-widest h-12 rounded-lg transition-all w-32">
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="revenue" className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-black text-zinc-400 uppercase font-black text-xs tracking-widest h-12 rounded-lg transition-all w-32">
                        Revenue
                    </TabsTrigger>
                </TabsList>

                {/* SELLERS TAB */}
                <TabsContent value="sellers">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6600]">Pending Verifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingSellers.map((seller) => (
                                <div key={seller.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{seller.display_name || 'Unknown'}</p>
                                            <p className="text-xs text-zinc-500">{seller.email}</p>
                                            <p className="text-[10px] text-[#FF6600] uppercase font-black mt-1">{seller.university || 'No Uni'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleVerify(seller.id)}
                                        className="bg-[#00FF85]/10 text-[#00FF85] hover:bg-[#00FF85]/20 border border-[#00FF85]/20 font-black uppercase text-[10px] tracking-widest h-8"
                                    >
                                        Verify Node
                                    </Button>
                                </div>
                            ))}
                            {pendingSellers.length === 0 && (
                                <p className="text-center text-zinc-500 italic py-8">All verification queues clear.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SUBSCRIPTIONS TAB */}
                <TabsContent value="subscriptions">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6600]">Active Beta Founders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <CreditCard className="h-5 w-5 text-zinc-500" />
                                        <div>
                                            <p className="text-sm font-bold text-white">{sub.users?.email}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">Plan: {sub.plan_id}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-[#00FF85] text-black font-black uppercase text-[10px]">Active</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FEEDBACK TAB */}
                <TabsContent value="feedback">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6600]">Feedback Loop</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {feedback.map((item) => (
                                <div key={item.id} className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs text-zinc-400 font-bold">{item.users?.email}</p>
                                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">{item.rating}/5 Stars</Badge>
                                    </div>
                                    <p className="text-sm text-white italic">"{item.comments}"</p>
                                    <p className="text-[10px] text-zinc-600 uppercase font-black mt-2">NPS: {item.nps_score}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* REVENUE TAB */}
                <TabsContent value="revenue">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <Card className="bg-zinc-900/50 border-white/5">
                            <CardContent className="pt-6">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Transaction Volume</p>
                                <p className="text-3xl font-black text-white italic font-heading tracking-tighter">₦{revenue.totalVolume.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/50 border-white/5">
                            <CardContent className="pt-6">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Platform Commission (7%)</p>
                                <p className="text-3xl font-black text-[#00FF85] italic font-heading tracking-tighter">₦{revenue.totalCommission.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6600]">Transaction Ledger</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {revenue.transactions.map((txn) => (
                                    <div key={txn.id} className="grid grid-cols-4 gap-4 bg-black/40 p-4 rounded-xl border border-white/5 items-center text-[10px] font-bold uppercase">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-zinc-500">Reference</span>
                                            <span className="text-white truncate">#{txn.paystack_reference}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-zinc-500">Seller</span>
                                            <span className="text-white truncate">{txn.seller?.display_name || 'Dealer'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-zinc-500">Value / Commission</span>
                                            <span className="text-white">₦{txn.amount_total.toLocaleString()} / <span className="text-[#00FF85]">₦{txn.amount_platform.toLocaleString()}</span></span>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end text-right">
                                            <span className="text-zinc-500">Status</span>
                                            <Badge className="bg-[#00FF85] text-black">SUCCESS</Badge>
                                        </div>
                                    </div>
                                ))}
                                {revenue.transactions.length === 0 && (
                                    <p className="text-center text-zinc-500 italic py-8">No transaction data recorded in current phase.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
