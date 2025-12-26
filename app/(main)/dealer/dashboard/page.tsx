'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Package,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    Truck,
    MessageCircle,
    Eye,
    Zap,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Order {
    id: string;
    buyer_id: string;
    listing_id: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    amount: number;
    shipping_address: string | null;
    phone_number: string | null;
    created_at: string;
    buyer?: {
        display_name: string;
        photo_url: string | null;
    };
    listing?: {
        title: string;
        images: string[];
    };
}

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
}

export default function DealerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountName: ''
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && user.role !== 'dealer') {
            router.push('/');
            return;
        }

        if (user) {
            fetchOrders();
            fetchBankDetails();
            subscribeToOrders();
            checkSubscriptionStatus();
        }
    }, [user, authLoading]);

    const checkSubscriptionStatus = async () => {
        if (!user || !user.subscription_expires_at) return;

        const now = new Date();
        const expiryDate = new Date(user.subscription_expires_at);

        if (now > expiryDate && (user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'active')) {
            // Downgrade to starter
            await supabase
                .from('users')
                .update({
                    subscription_plan: 'starter',
                    subscription_status: 'inactive',
                    listing_limit: 5
                })
                .eq('id', user.id);

            // Refresh local user data
            window.location.reload();
        }
    };

    const fetchBankDetails = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('users')
            .select('bank_name, account_number, account_name')
            .eq('id', user.id)
            .single();

        if (data) {
            setBankDetails({
                bankName: data.bank_name || '',
                accountNumber: data.account_number || '',
                accountName: data.account_name || ''
            });
        }
    };

    const updateBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    bank_name: bankDetails.bankName,
                    account_number: bankDetails.accountNumber,
                    account_name: bankDetails.accountName
                })
                .eq('id', user!.id);

            if (error) throw error;
            alert('Bank details updated successfully');
        } catch (err: any) {
            alert('Failed to update bank details');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    buyer:users!orders_buyer_id_fkey(display_name, photo_url),
                    listing:listings(title, images)
                `)
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOrders(data || []);

            // Calculate stats
            const totalOrders = data?.length || 0;
            const pendingOrders = data?.filter(o => o.status === 'pending').length || 0;
            const completedOrders = data?.filter(o => o.status === 'completed').length || 0;
            const totalRevenue = data?.filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + o.amount, 0) || 0;

            setStats({
                totalOrders,
                pendingOrders,
                completedOrders,
                totalRevenue,
            });
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToOrders = () => {
        if (!user) return;

        const subscription = supabase
            .channel('dealer_orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `seller_id=eq.${user.id}`,
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

    const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Send notification to buyer
            const order = orders.find(o => o.id === orderId);
            if (order) {
                const { data: chatData } = await supabase
                    .from('chats')
                    .select('id')
                    .contains('participants', [user!.id, order.buyer_id])
                    .eq('listing_id', order.listing_id)
                    .single();

                if (chatData) {
                    let message = '';
                    if (newStatus === 'confirmed') {
                        message = `📦 Your order #${orderId.slice(-8).toUpperCase()} has been shipped!`;
                    } else if (newStatus === 'cancelled') {
                        message = `❌ Order #${orderId.slice(-8).toUpperCase()} has been cancelled.`;
                    }

                    if (message) {
                        await supabase.from('messages').insert({
                            chat_id: chatData.id,
                            sender_id: user!.id,
                            content: message,
                        });
                    }
                }
            }

            fetchOrders();
        } catch (err) {
            console.error('Failed to update order:', err);
            alert('Failed to update order status');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const openChat = async (order: Order) => {
        try {
            const { data: chatData } = await supabase
                .from('chats')
                .select('id')
                .contains('participants', [user!.id, order.buyer_id])
                .eq('listing_id', order.listing_id)
                .single();

            if (chatData) {
                router.push(`/chats/${chatData.id}`);
            }
        } catch (err) {
            console.error('Failed to open chat:', err);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    const now = new Date();
    const expiryDate = user?.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isTrial = user?.subscriptionStatus === 'trial';
    const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
    const isExpired = daysRemaining <= 0 && expiryDate;

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Dealer Hub</h1>
                    <p className="text-muted-foreground mt-2">Strategic inventory management and revenue tracking for {user?.displayName}.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Current Plan: {user?.subscriptionPlan || 'Starter'}
                        </span>
                    </Badge>
                </div>
            </div>

            {/* Trial / Subscription Banners */}
            {isTrial && (
                <div className={`mb-8 p-6 rounded-2xl border-2 transition-all duration-500 ${isExpiringSoon ? 'bg-amber-50 border-amber-200 shadow-amber-100' : 'bg-primary/5 border-primary/10 shadow-sm'} flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative`}>
                    {isExpiringSoon && <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 animate-pulse" />}
                    <div className="flex items-center gap-5">
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center ${isExpiringSoon ? 'bg-amber-100 text-amber-600' : 'bg-primary/20 text-primary'}`}>
                            {isExpiringSoon ? <Clock className="h-7 w-7" /> : <Zap className="h-7 w-7" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight">
                                {isExpiringSoon ? "Trial Expiring Soon" : "Premium Trial Active"}
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium italic">
                                {daysRemaining} days left of full premium features and analytics access.
                            </p>
                        </div>
                    </div>

                    {isExpiringSoon ? (
                        <Button asChild className="relative overflow-hidden bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 group px-8 py-6 h-auto animate-[glow-pulse_2s_infinite]">
                            <Link href="/pricing" className="flex items-center gap-3">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                <span className="text-base font-black uppercase tracking-widest italic drop-shadow-sm">Upgrade Now</span>
                                <Zap className="h-5 w-5 fill-white group-hover:scale-125 transition-transform" />
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" asChild className="border-primary/20 hover:bg-primary/10 transition-all">
                            <Link href="/pricing" className="uppercase font-bold text-xs tracking-widest">View Upgrade Options</Link>
                        </Button>
                    )}
                </div>
            )}

            {!isTrial && isExpiringSoon && (
                <div className="mb-8 p-6 rounded-2xl bg-slate-900 border-2 border-primary/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-white relative">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <div className="flex items-center gap-5 relative">
                        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary-foreground">
                            <RotateCcw className="h-7 w-7 animate-[spin_4s_linear_infinite]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Subscription Renewal</h3>
                            <p className="text-sm text-blue-200 font-medium italic">
                                Your {user?.subscriptionPlan} plan expires in {daysRemaining} days. Renew to maintain business continuity.
                            </p>
                        </div>
                    </div>
                    <Button asChild className="relative bg-white text-slate-950 hover:bg-slate-200 font-black uppercase tracking-widest italic px-10 py-6 h-auto shadow-xl shadow-white/10 group">
                        <Link href="/pricing" className="flex items-center gap-3">
                            Renew Plan
                            <TrendingUp className="h-5 w-5 group-hover:translate-y--1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            )}

            {isExpired && (
                <div className="mb-8 p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertCircle className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight text-destructive">Subscription Expired</h3>
                            <p className="text-sm text-muted-foreground font-medium italic">
                                You have been downgraded to the Basic plan. Some features may be restricted.
                            </p>
                        </div>
                    </div>
                    <Button asChild variant="destructive" className="font-black uppercase tracking-widest italic px-8">
                        <Link href="/pricing">Re-activate Premium</Link>
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Button asChild className="h-auto py-4">
                    <Link href="/dealer/listings/new" className="flex flex-col items-center gap-2">
                        <Package className="h-6 w-6" />
                        <span>Add New Listing</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                    <Link href="/dealer/listings" className="flex flex-col items-center gap-2">
                        <Eye className="h-6 w-6" />
                        <span>View My Listings</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                    <Link href="/chats" className="flex flex-col items-center gap-2">
                        <MessageCircle className="h-6 w-6" />
                        <span>Messages</span>
                    </Link>
                </Button>
            </div>

            {/* Main Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="orders">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
                            <TabsTrigger value="orders">Orders</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="orders">
                            <Tabs defaultValue="all">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="confirmed">Shipped</TabsTrigger>
                                    <TabsTrigger value="completed">Completed</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all" className="space-y-4 mt-4">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No orders yet</p>
                                        </div>
                                    ) : (
                                        orders.map(order => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                onUpdateStatus={updateOrderStatus}
                                                onOpenChat={openChat}
                                                isUpdating={updatingOrder === order.id}
                                            />
                                        ))
                                    )}
                                </TabsContent>
                                <TabsContent value="pending" className="space-y-4 mt-4">
                                    {orders.filter(o => o.status === 'pending').map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onUpdateStatus={updateOrderStatus}
                                            onOpenChat={openChat}
                                            isUpdating={updatingOrder === order.id}
                                        />
                                    ))}
                                </TabsContent>
                                <TabsContent value="confirmed" className="space-y-4 mt-4">
                                    {orders.filter(o => o.status === 'confirmed').map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onUpdateStatus={updateOrderStatus}
                                            onOpenChat={openChat}
                                            isUpdating={updatingOrder === order.id}
                                        />
                                    ))}
                                </TabsContent>
                                <TabsContent value="completed" className="space-y-4 mt-4">
                                    {orders.filter(o => o.status === 'completed').map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onUpdateStatus={updateOrderStatus}
                                            onOpenChat={openChat}
                                            isUpdating={updatingOrder === order.id}
                                        />
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </TabsContent>

                        <TabsContent value="settings">
                            <div className="max-w-md">
                                <h3 className="text-lg font-medium mb-4">Bank Payout Details</h3>
                                <form onSubmit={updateBankDetails} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input
                                            value={bankDetails.bankName}
                                            onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                            placeholder="e.g. GTBank"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input
                                            value={bankDetails.accountNumber}
                                            onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                            placeholder="0123456789"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Name</Label>
                                        <Input
                                            value={bankDetails.accountName}
                                            onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                            placeholder="Account Holder Name"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Bank Details'}
                                    </Button>
                                </form>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

function OrderCard({
    order,
    onUpdateStatus,
    onOpenChat,
    isUpdating
}: {
    order: Order;
    onUpdateStatus: (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => void;
    onOpenChat: (order: Order) => void;
    isUpdating: boolean;
}) {
    const getStatusBadge = (status: string) => {
        const variants = {
            pending: 'secondary',
            confirmed: 'default',
            completed: 'outline',
            cancelled: 'destructive',
        } as const;

        return (
            <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
                {status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                {status === 'confirmed' && <Truck className="h-3 w-3 mr-1" />}
                {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold">Order #{order.id.slice(-8).toUpperCase()}</h3>
                    <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                {getStatusBadge(order.status)}
            </div>

            <div className="flex gap-4 mb-4">
                {order.listing?.images?.[0] && (
                    <Image
                        src={order.listing.images[0]}
                        alt={order.listing.title}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                    />
                )}
                <div className="flex-1">
                    <p className="font-medium">{order.listing?.title}</p>
                    <p className="text-sm text-muted-foreground">
                        Customer: {order.buyer?.display_name}
                    </p>
                    <p className="font-bold text-primary">₦{order.amount.toLocaleString()}</p>
                </div>
            </div>

            {order.shipping_address && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Shipping Address:</p>
                    <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                    {order.phone_number && (
                        <p className="text-sm text-muted-foreground">Phone: {order.phone_number}</p>
                    )}
                </div>
            )}

            <div className="flex gap-2">
                {order.status === 'pending' && (
                    <Select
                        onValueChange={(value) => onUpdateStatus(order.id, value as any)}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="confirmed">Mark as Shipped</SelectItem>
                            <SelectItem value="cancelled">Cancel Order</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                <Button
                    variant="outline"
                    onClick={() => onOpenChat(order)}
                    className="gap-2"
                >
                    <MessageCircle className="h-4 w-4" />
                    Chat
                </Button>
            </div>
        </div>
    );
}
