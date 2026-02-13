'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp, DollarSign, ShoppingCart, Users,
    Calendar, Download, Filter, Search, ArrowUpRight, RotateCcw
} from 'lucide-react';

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

            // Calculate stats
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

            alert("Refund processed successfully.");
            fetchRevenue(); // Refresh data
        } catch (err) {
            console.error("Refund failed:", err);
            alert("Failed to process refund. Please try again.");
        } finally {
            setProcessingRefund(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'order_fee': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'subscription': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'dealer_registration': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    const getStatusBadge = (record: RevenueRecord) => {
        if (record.refund_status === 'processed') {
            return (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-bold">
                    REFUNDED
                </Badge>
            );
        }
        return (
            <Badge className={`text-[10px] font-bold ${record.status === 'collected'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                {record.status}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Background */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2">
                            Revenue <span className="text-[#FFB800]">Analytics</span>
                        </h1>
                        <p className="text-zinc-500 font-mono text-sm">
                            Platform fee tracking & commission analytics
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-[#00FF85]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                ₦{stats.totalRevenue.toLocaleString()}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">All-time earnings</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-[#FFB800]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                ₦{stats.monthRevenue.toLocaleString()}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">Current month</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                {stats.totalTransactions}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">Fee collections</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-white/10 border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Avg. Commission
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                ₦{stats.averageCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">Per transaction</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-8 flex-wrap">
                    {['all', 'order_fee', 'subscription', 'dealer_registration'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all border ${filter === type
                                ? 'bg-[#FFB800] text-black border-[#FFB800]'
                                : 'bg-zinc-900 text-zinc-500 border-white/10 hover:border-[#FFB800]'
                                }`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Revenue Table */}
                <Card className="bg-zinc-900 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white font-black uppercase tracking-tight">
                            Recent Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-zinc-500 font-mono text-sm">
                                Loading revenue data...
                            </div>
                        ) : records.length === 0 ? (
                            <div className="text-center py-12 text-zinc-600 font-mono text-sm">
                                No revenue records found
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5 text-xs font-black uppercase text-zinc-500 tracking-wider">
                                            <th className="text-left py-4 px-4">Date</th>
                                            <th className="text-left py-4 px-4">Type</th>
                                            <th className="text-left py-4 px-4">Seller</th>
                                            <th className="text-left py-4 px-4">Buyer</th>
                                            <th className="text-right py-4 px-4">Fee %</th>
                                            <th className="text-right py-4 px-4">Amount</th>
                                            <th className="text-center py-4 px-4">Status</th>
                                            <th className="text-right py-4 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map((record) => (
                                            <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                                                    {new Date(record.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge className={`text-[10px] font-bold ${getTypeColor(record.transaction_type)}`}>
                                                        {record.transaction_type.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-white font-medium">
                                                    {record.seller?.display_name || '-'}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-white font-medium">
                                                    {record.buyer?.display_name || '-'}
                                                </td>
                                                <td className="py-4 px-4 text-right text-sm text-zinc-400">
                                                    {record.percentage_fee ? `${record.percentage_fee}%` : '-'}
                                                </td>
                                                <td className="py-4 px-4 text-right text-lg font-black text-[#00FF85]">
                                                    ₦{parseFloat(record.amount.toString()).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {getStatusBadge(record)}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {record.refund_status !== 'processed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleRefund(record.id)}
                                                            disabled={processingRefund === record.id}
                                                        >
                                                            <RotateCcw className={`h-4 w-4 ${processingRefund === record.id ? 'animate-spin' : ''}`} />
                                                            <span className="sr-only">Refund</span>
                                                        </Button>
                                                    )}
                                                    {record.refund_status === 'processed' && (
                                                        <span className="text-[10px] font-mono text-zinc-600 block text-right" title={record.refund_reason}>
                                                            REFUNDED
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
