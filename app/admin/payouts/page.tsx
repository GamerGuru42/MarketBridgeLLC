'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const supabase = createClient();

interface PayoutOrder {
    id: string;
    created_at: string;
    amount: number;
    seller_receives: number;
    payout_status: string;
    status: string;
    items: {
        listing: {
            user: {
                id: string;
                display_name: string;
                bank_name: string;
                account_number: string;
                account_name: string;
            }
        }
    }[];
}

export default function AdminPayoutsPage() {
    const [orders, setOrders] = useState<PayoutOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        setLoading(true);
        // Fetch orders that are paid/delivered but not yet paid to seller
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, created_at, amount, seller_receives, payout_status, status,
                items:order_items (
                    listing:listings (
                        user:users (
                            id, display_name, bank_name, account_number, account_name
                        )
                    )
                )
            `)
            .in('status', ['paid', 'processing', 'shipped', 'delivered'])
            .eq('payout_status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching payouts:', error);
        } else {
            // @ts-ignore - Supabase types might be strict about joins
            setOrders(data || []);
        }
        setLoading(false);
    };

    const handleMarkPaid = async (orderId: string) => {
        if (!confirm('Confirm that you have MANUALLY transferred funds to this seller?')) return;
        setProcessingId(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    payout_status: 'paid',
                    payout_date: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            // Refresh list
            setOrders(prev => prev.filter(o => o.id !== orderId));
            alert('Marked as paid.');
        } catch (err: any) {
            alert('Error updating payout status: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-12">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">
                        Seller <span className="text-[#FF6200]">Payouts</span>
                    </h1>
                    <p className="text-zinc-500 font-mono text-sm">Review pending transfers to sellers.</p>
                </div>

                <Card className="bg-zinc-900 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white font-black uppercase tracking-tight">Pending Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#FF6200]" /></div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 text-zinc-600 font-mono">No pending payouts found</div>
                        ) : (
                            <div className="grid gap-6">
                                {orders.map((order) => {
                                    // Extract Seller Info (Assuming single seller per order for MVP)
                                    const seller = order.items?.[0]?.listing?.user;
                                    const hasBankDetails = seller?.bank_name && seller?.account_number;

                                    return (
                                        <div key={order.id} className="bg-black border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-[#FF6200]/30 transition-colors">
                                            {/* Order Info */}
                                            <div className="space-y-2 min-w-[200px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-500 text-xs font-mono">Order: {order.id.slice(0, 8)}</span>
                                                    <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">{order.status}</Badge>
                                                </div>
                                                <div className="text-sm font-bold text-white">{new Date(order.created_at).toLocaleDateString()}</div>
                                            </div>

                                            {/* Seller / Bank Info */}
                                            <div className="flex-1 space-y-2 border-l border-white/5 pl-6">
                                                <div className="text-xs font-black uppercase tracking-widest text-[#FF6200]">Pay To: {seller?.display_name || 'Unknown Seller'}</div>
                                                {hasBankDetails ? (
                                                    <div className="grid grid-cols-2 gap-4 text-sm font-mono text-zinc-300">
                                                        <div>
                                                            <span className="text-zinc-600 block text-[10px] uppercase">Bank</span>
                                                            {seller.bank_name}
                                                        </div>
                                                        <div>
                                                            <span className="text-zinc-600 block text-[10px] uppercase">Account</span>
                                                            <span className="select-all text-white font-bold">{seller.account_number}</span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <span className="text-zinc-600 block text-[10px] uppercase">Account Name</span>
                                                            {seller.account_name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-zinc-500 bg-white/5 p-2 rounded-lg">
                                                        <AlertTriangle className="h-4 w-4 text-[#FF6200]" />
                                                        <span className="text-xs font-bold uppercase">Missing Bank Details</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Amount & Action */}
                                            <div className="flex flex-col items-end gap-4 min-w-[150px]">
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Payout Amount</span>
                                                    <span className="text-2xl font-black text-white tracking-tight">₦{order.seller_receives.toLocaleString()}</span>
                                                </div>
                                                <Button
                                                    onClick={() => handleMarkPaid(order.id)}
                                                    disabled={processingId === order.id || !hasBankDetails}
                                                    className="bg-[#FF6200] text-black hover:bg-[#FF7A29] border-none font-bold uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    {processingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                    Mark Paid
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}