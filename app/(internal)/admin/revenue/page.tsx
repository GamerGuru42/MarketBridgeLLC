'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp, DollarSign, ShoppingCart,
    Calendar, RotateCcw, Loader2
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const supabase = createClient();

interface RevenueRecord {
    id: string;
    transaction_type: string;
    amount: number;
    percentage_fee: number | null;
    order_id: string | null;
    seller_id: string | null;
    buyer_id: string | null;
    payment_reference: string | null;
    status: string;
    refund_status?: string;
    refund_reason?: string;
    created_at: string;
    seller?: { display_name: string };
    buyer?: { display_name: string };
}

interface RevenueStats {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    totalTransactions: number;
    averageCommission: number;
}

export default function RevenueManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [records, setRecords] = useState<RevenueRecord[]>([]);
    const [stats, setStats] = useState<RevenueStats>({
        totalRevenue: 0,
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalTransactions: 0,
        averageCommission: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processingRefund, setProcessingRefund] = useState<string | null>(null);

    useEffect(() => {
        fetchRevenue();
    }, [filter]);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('platform_revenue')
                .select(`
                    *,
                    seller:users!platform_revenue_seller_id_fkey(display_name),
                    buyer:users!platform_revenue_buyer_id_fkey(display_name)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('transaction_type', filter);
            }

            const { data, error } = await query.limit(100);
            if (error) throw error;

            setRecords(data || []);

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const totalRevenue = (data || []).reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
            const todayRevenue = (data || [])
                .filter(r => new Date(r.created_at) >= today)
                .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
            const weekRevenue = (data || [])
                .filter(r => new Date(r.created_at) >= weekAgo)
                .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
            const monthRevenue = (data || [])
                .filter(r => new Date(r.created_at) >= monthStart)
                .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);

            setStats({
                totalRevenue,
                todayRevenue,
                weekRevenue,
                monthRevenue,
                totalTransactions: data?.length || 0,
                averageCommission: data && data.length > 0 ? totalRevenue / data.length : 0,
            });
        } catch (err) {
            console.error('Failed to fetch revenue:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (recordId: string) => {
        const reason = window.prompt("Please enter a reason for this refund:");
        if (!reason) return;
        setProcessingRefund(recordId);
        try {
            const { error } = await supabase.rpc('process_refund', {
                p_transaction_id: recordId,
                p_reason: reason
            });
            if (error) throw error;
            toast('Refund processed successfully.', 'success');
            fetchRevenue();
        } catch (err) {
            console.error("Refund failed:", err);
            toast('Refund failed. Please check your internet.', 'error');
        } finally {
            setProcessingRefund(null);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'order_fee': return <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20 font-black uppercase text-[10px]">Order Fee</Badge>;
            case 'subscription': return <Badge className="bg-zinc-800 text-white/60 border-zinc-700 font-black uppercase text-[10px]">Plan</Badge>;
            default: return <Badge variant="outline" className="font-black uppercase text-[10px]">{type.replace('_', ' ')}</Badge>;
        }
    };

    const getStatusBadge = (record: RevenueRecord) => {
        if (record.refund_status === 'processed') {
            return (
                <Badge className="bg-white/10 text-white/40 border-white/5 text-[10px] font-black italic">
                    REFUNDED
                </Badge>
            );
        }
        return (
            <Badge className={`text-[10px] font-black uppercase tracking-widest ${record.status === 'collected'
                ? 'bg-[#FF6200] text-black'
                : 'bg-zinc-800 text-white/40 border-zinc-700'
                }`}>
                {record.status}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2">
                            Revenue <span className="text-[#FF6200]">Analytics</span>
                        </h1>
                        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
                            Platform fee tracking & commission analytics
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-[#FF6200]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white/40 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white italic tracking-tighter">
                                ₦{stats.totalRevenue.toLocaleString()}
                            </div>
                            <p className="text-[10px] text-white/30 mt-1 font-mono uppercase">All-time earnings</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white/40 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white italic tracking-tighter">
                                ₦{stats.monthRevenue.toLocaleString()}
                            </div>
                            <p className="text-[10px] text-white/30 mt-1 font-mono uppercase">Current period</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-[#FF6200]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white/40 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white italic tracking-tighter">
                                {stats.totalTransactions}
                            </div>
                            <p className="text-[10px] text-white/30 mt-1 font-mono uppercase">Fee events</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white/40 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Avg Rate
                            </CardTitle>                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white italic tracking-tighter">
                                ₦{stats.averageCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <p className="text-[10px] text-white/30 mt-1 font-mono uppercase">Per transaction</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-3 mb-8 flex-wrap">
                    {['all', 'order_fee', 'subscription', 'dealer_registration'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all border italic ${filter === type
                                ? 'bg-[#FF6200] text-black border-[#FF6200]'
                                : 'bg-transparent text-white/40 border-white/10 hover:border-[#FF6200]'
                                }`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <Card className="bg-zinc-900 border-white/10 overflow-hidden">
                    <CardHeader className="bg-black/40 border-b border-white/5">
                        <CardTitle className="text-white font-black uppercase text-sm italic tracking-widest">
                            Transaction Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#FF6200]" /></div>
                        ) : records.length === 0 ? (
                            <div className="text-center py-20 text-white/30 font-black uppercase text-xs italic">
                                Zero Notices detected
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-black/50 text-[10px] font-black uppercase text-white/40 tracking-widest italic">
                                            <th className="text-left py-6 px-6">Timestamp</th>
                                            <th className="text-left py-6 px-6">Event</th>
                                            <th className="text-left py-6 px-6">Participants</th>
                                            <th className="text-right py-6 px-6">Platform Cut</th>
                                            <th className="text-center py-6 px-6">Status</th>
                                            <th className="text-right py-6 px-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {records.map((record) => (
                                            <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="py-6 px-6 text-[10px] font-mono text-white/40">
                                                    {new Date(record.created_at).toLocaleString()}
                                                </td>
                                                <td className="py-6 px-6">
                                                    {getTypeBadge(record.transaction_type)}
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-white line-clamp-1">{record.seller?.display_name || 'Dealer'}</span>
                                                        <span className="text-[10px] text-white/30 italic">Target: {record.buyer?.display_name || 'Buyer'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6 text-right">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xl font-black text-white italic tracking-tighter">₦{parseFloat(record.amount.toString()).toLocaleString()}</span>
                                                        {record.percentage_fee && <span className="text-[10px] text-white/30 font-bold">{record.percentage_fee}% Fee</span>}
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6 text-center">
                                                    {getStatusBadge(record)}
                                                </td>
                                                <td className="py-6 px-6 text-right">
                                                    {record.refund_status !== 'processed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-white/40 hover:text-[#FF6200] hover:bg-[#FF6200]/10"
                                                            onClick={() => handleRefund(record.id)}
                                                            disabled={processingRefund === record.id}
                                                        >
                                                            <RotateCcw className={`h-4 w-4 ${processingRefund === record.id ? 'animate-spin' : ''}`} />
                                                        </Button>)}                                                </td>                                            </tr>))}                                    </tbody>                                </table>                            </div>)}                    </CardContent>                </Card>            </div>        </div>);
}