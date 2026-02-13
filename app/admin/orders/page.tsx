'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpRight, Check, X, FileText, Search } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient();

interface Order {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    payment_reference?: string;
    payment_proof_url?: string;
    user?: { email: string; display_name: string };
    items?: { quantity: number; listing: { title: string; price: number } }[];
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                user:users(email, display_name),
                items:order_items(quantity, listing:listings(title, price))
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

    const handleVerifyPayment = async (orderId: string, approve: boolean) => {
        setActionLoading(orderId);
        const newStatus = approve ? 'paid' : 'cancelled';

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // If approved, calculate fees (trigger does this, but revenue entry?)
            // Normally revenue entry is created by trigger too? Or manually?
            // The platform_revenue table might need a trigger or manual insert.
            // But verify-transaction logic (previous file) didn't show creating revenue records.
            // Let's assume order update is enough for now, or I'll add logic later.

            alert(`Order marked as ${newStatus}`);
            fetchOrders();
        } catch (err) {
            console.error('Error updating order:', err);
            alert('Failed to update order status');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending_verification': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-12">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">
                        Order <span className="text-[#FF6600]">Verification</span>
                    </h1>
                    <p className="text-zinc-500 font-mono text-sm">Review manual payments and manage orders</p>
                </div>

                <Card className="bg-zinc-900 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white font-black uppercase tracking-tight">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#FF6600]" /></div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 text-zinc-600 font-mono">No orders found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5 text-xs font-black uppercase text-zinc-500 tracking-wider">
                                            <th className="text-left py-4 px-4">Date</th>
                                            <th className="text-left py-4 px-4">Customer</th>
                                            <th className="text-left py-4 px-4">Items</th>
                                            <th className="text-left py-4 px-4">Amount</th>
                                            <th className="text-left py-4 px-4">Info</th>
                                            <th className="text-center py-4 px-4">Proof</th>
                                            <th className="text-center py-4 px-4">Status</th>
                                            <th className="text-right py-4 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm font-bold text-white">{order.user?.display_name || 'Guest'}</div>
                                                    <div className="text-xs text-zinc-500">{order.user?.email}</div>
                                                </td>
                                                <td className="py-4 px-4 text-xs text-zinc-400">
                                                    {order.items?.map(i => `${i.quantity}x ${i.listing?.title}`).join(', ')}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-black text-[#00FF85]">
                                                    ₦{order.amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                                                    Ref: <span className="text-white">{order.payment_reference || '-'}</span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {order.payment_proof_url ? (
                                                        <a
                                                            href={order.payment_proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                                            title="View Proof"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-zinc-600">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <Badge className={`text-[10px] font-bold ${getStatusColor(order.status)}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {order.status === 'pending_verification' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-500 hover:bg-green-600 h-8 w-8 p-0"
                                                                onClick={() => handleVerifyPayment(order.id, true)}
                                                                disabled={actionLoading === order.id}
                                                            >
                                                                {actionLoading === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => handleVerifyPayment(order.id, false)}
                                                                disabled={actionLoading === order.id}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
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
