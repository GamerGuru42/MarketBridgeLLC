'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { startConversation } from '@/lib/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Order {
    id: string;
    buyer_id: string;
    seller_id: string;
    listing_id: string;
    status: 'pending' | 'paid' | 'confirmed' | 'disputed' | 'completed' | 'cancelled';
    amount: number;
    shipping_address: string | null;
    phone_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    listing?: {
        id: string;
        title: string;
        images: string[];
        price: number;
    };
    seller?: {
        id: string;
        display_name: string;
        photo_url: string | null;
    };
}

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchOrders();
            subscribeToOrders();
        }
    }, [user, authLoading]);

    const fetchOrders = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    listing:listings(id, title, images, price),
                    seller:users!orders_seller_id_fkey(id, display_name, photo_url)
                `)
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOrders(data || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToOrders = () => {
        if (!user) return;

        const subscription = supabase
            .channel('orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `buyer_id=eq.${user.id}`,
                },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const handleConfirmDelivery = async (order: Order) => {
        setSelectedOrder(order);
        setShowConfirmDialog(true);
    };

    const confirmDelivery = async () => {
        if (!selectedOrder) return;

        setConfirmingOrder(selectedOrder.id);
        try {
            // Update order status to completed
            const { error } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', selectedOrder.id);

            if (error) throw error;

            // Send notification message to seller
            try {
                const conversationId = await startConversation(user!.id, selectedOrder.seller_id, selectedOrder.listing_id);

                await supabase.from('messages').insert({
                    conversation_id: conversationId,
                    sender_id: user!.id,
                    content: `✅ Order #${selectedOrder.id.slice(-8).toUpperCase()} confirmed! Payment of ₦${selectedOrder.amount.toLocaleString()} has been released.`,
                });
            } catch (chatErr) {
                console.error('Failed to notify seller:', chatErr);
            }

            setShowConfirmDialog(false);
            setSelectedOrder(null);
            fetchOrders();
        } catch (err) {
            console.error('Failed to confirm delivery:', err);
            alert('Failed to confirm delivery. Please try again.');
        } finally {
            setConfirmingOrder(null);
        }
    };

    // ... (getStatusIcon, getStatusVariant, getStatusText skipped as they are unchanged)

    const openChat = async (order: Order) => {
        try {
            const conversationId = await startConversation(user!.id, order.seller_id, order.listing_id);
            router.push(`/chats/${conversationId}`);
        } catch (err) {
            console.error('Failed to open chat:', err);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'paid':
                return <AlertCircle className="h-4 w-4" />;
            case 'disputed':
                return <AlertCircle className="h-4 w-4 text-destructive" />;
            case 'confirmed':
                return <Truck className="h-4 w-4" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'pending':
                return 'secondary';
            case 'paid':
                return 'default';
            case 'disputed':
                return 'destructive';
            case 'confirmed':
                return 'default';
            case 'completed':
                return 'outline';
            case 'cancelled':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Waiting for Payment';
            case 'paid':
                return 'Payment in Escrow';
            case 'disputed':
                return 'Under Dispute';
            case 'confirmed':
                return 'In Transit';
            case 'completed':
                return 'Delivered/Released';
            case 'cancelled':
                return 'Cancelled/Refunded';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };



    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
                        <p className="text-muted-foreground">Track and manage your orders</p>
                    </div>
                </div>
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                            <Button asChild>
                                <Link href="/listings">Browse Products</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <Card key={order.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 border-b border-white/5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase tracking-tighter">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                                            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">
                                                Placed on {new Date(order.created_at).toLocaleDateString('en-NG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={getStatusVariant(order.status)} className="gap-1 font-bold">
                                                {getStatusIcon(order.status)}
                                                {getStatusText(order.status)}
                                            </Badge>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-[#FF6600] border-[#FF6600]/20 bg-[#FF6600]/5">
                                                Paid via Paystack
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        {/* Order Items */}
                                        <div className="flex gap-4">
                                            {order.listing?.images?.[0] && (
                                                <div className="h-20 w-20 rounded-xl overflow-hidden relative bg-zinc-900 border border-white/10 shrink-0">
                                                    <Image
                                                        src={order.listing.images[0]}
                                                        alt={order.listing.title ?? 'Product image'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg uppercase tracking-tight">{order.listing?.title || 'Product'}</h4>
                                                {order.seller && (
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
                                                        Seller: <span className="text-white">{order.seller.display_name}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black tracking-tighter text-[#00FF85]">₦{order.amount.toLocaleString()}</p>
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Secured via Paystack</p>
                                            </div>
                                        </div>
                                        {/* Shipping Address */}
                                        {order.shipping_address && (
                                            <div className="border-t pt-3">
                                                <p className="text-sm font-medium mb-1">Shipping Address</p>
                                                <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                                                {order.phone_number && (
                                                    <p className="text-sm text-muted-foreground">Phone: {order.phone_number}</p>
                                                )}
                                            </div>
                                        )}
                                        {/* Escrow Status & Actions */}
                                        {(order.status === 'pending') && (
                                            <div className="border-t pt-3">
                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                                    <div className="flex items-start gap-2">
                                                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                                Awaiting Payment Confirmation
                                                            </p>
                                                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                                                We're waiting to confirm your payment of ₦{order.amount.toLocaleString()}. Once confirmed, it will be held in escrow.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {order.status === 'paid' && (
                                            <div className="border-t pt-3">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                                Payment in Escrow
                                                            </p>
                                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                                ₦{order.amount.toLocaleString()} is securely held. The seller will be notified to ship your item.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => openChat(order)}
                                                        className="flex-1"
                                                    >
                                                        <MessageCircle className="mr-2 h-4 w-4" />
                                                        Contact Seller
                                                    </Button>
                                                    <Link href={`/orders/${order.id}/dispute`} className="flex-1">
                                                        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <AlertCircle className="mr-2 h-4 w-4" />
                                                            File Dispute
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <div className="border-t pt-3">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                                                    <div className="flex items-start gap-2">
                                                        <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                                Order Shipped
                                                            </p>
                                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                                Your order is on its way! Confirm delivery when you receive it to release payment.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mb-2">
                                                    <Button
                                                        onClick={() => handleConfirmDelivery(order)}
                                                        disabled={confirmingOrder === order.id}
                                                        className="flex-1"
                                                    >
                                                        {confirmingOrder === order.id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Confirming...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Confirm Delivery
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => openChat(order)}
                                                    >
                                                        <MessageCircle className="mr-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Link href={`/orders/${order.id}/dispute`}>
                                                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-destructive">
                                                        Having issues? File a dispute
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                        {order.status === 'completed' && (
                                            <div className="border-t pt-3">
                                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                                    <div className="flex items-start gap-2">
                                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                                Order Completed
                                                            </p>
                                                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                                Payment of ₦{order.amount.toLocaleString()} has been released to the seller.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {order.status === 'disputed' && (
                                            <div className="border-t pt-3">
                                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                                                Dispute Active
                                                            </p>
                                                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                                                This order is currently under review by our Trust & Safety team. Funds are held securely until resolution.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Order Notes */}{order.notes && (
                                            <div className="border-t pt-3">
                                                <p className="text-sm font-medium mb-1">Order Notes</p>
                                                <p className="text-sm text-muted-foreground">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to confirm that you've received this order? This will release the payment of ₦{selectedOrder?.amount.toLocaleString()} to the seller.
                            <br /><br />
                            <strong>This action cannot be undone.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelivery}>
                            Confirm Delivery
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
