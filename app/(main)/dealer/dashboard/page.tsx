'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
    RotateCcw,
    ArrowRight,
    ChevronRight
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
import { cn } from '@/lib/utils';
import { DealerGuide } from '@/components/DealerGuide';

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
            await supabase
                .from('users')
                .update({
                    subscription_plan: 'starter',
                    subscription_status: 'inactive',
                    listing_limit: 5
                })
                .eq('id', user.id);

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
            // Using a basic toast would be better, but keeping original alert for logic consistency
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
                        message = `📦 Your order #${orderId.slice(-8).toUpperCase()} has been marked as shipped!`;
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
            <div className="min-h-[80vh] flex items-center justify-center bg-black relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />
                <div className="relative text-center">
                    <div className="h-24 w-24 rounded-2xl border-2 border-[#FFB800]/20 flex items-center justify-center relative animate-pulse mx-auto">
                        <Zap className="h-10 w-10 text-[#FFB800] animate-bounce" />
                        <div className="absolute inset-0 rounded-2xl border border-[#FFB800] animate-ping opacity-25" />
                    </div>
                    <p className="mt-8 text-zinc-500 font-black uppercase tracking-[0.3em] text-xs font-heading">Syncing Terminal...</p>
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
        <div className="min-h-screen bg-black text-white relative flex flex-col selection:bg-[#FFB800] selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <DealerGuide />

            <div className="container mx-auto py-12 px-6 relative z-10 space-y-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading leading-tight">Live Operation Panel</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Dealer <span className="text-[#FFB800]">Hub</span>
                        </h1>
                        <p className="text-zinc-500 font-medium max-w-xl italic">
                            Command center for <span className="text-white font-bold">{user?.displayName}</span>.
                            Managing <span className="text-white font-bold">{stats.totalOrders} assets</span> in current cycle.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1 pb-1 font-heading">Network Status</span>
                            <span className="text-sm font-black text-[#00FF85] italic uppercase tracking-tighter flex items-center gap-2 font-heading">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00FF85]" /> Connected
                            </span>
                        </div>
                        <Button onClick={fetchOrders} className="h-16 px-8 bg-[#FFB800] text-black hover:bg-[#FFD700] rounded-2xl font-black uppercase tracking-widest transition-all font-heading">
                            Sync Data
                        </Button>
                    </div>
                </div>

                {/* Subscription Banners */}
                {(isTrial || isExpiringSoon || isExpired) && (
                    <div className={cn(
                        "p-10 rounded-[2.5rem] border-none relative overflow-hidden group",
                        isExpired ? "bg-red-950/20" : "bg-zinc-900/40"
                    )}>
                        <div className={cn(
                            "absolute left-0 top-0 w-2 h-full",
                            isExpired ? "bg-red-500" : (isExpiringSoon ? "bg-amber-500" : "bg-[#FFB800]")
                        )} />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className={cn(
                                    "h-20 w-20 rounded-3xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                                    isExpired ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-[#FFB800]/10 border-[#FFB800]/20 text-[#FFB800]"
                                )}>
                                    {isExpired ? <AlertCircle className="h-10 w-10" /> : (isExpiringSoon ? <Clock className="h-10 w-10" /> : <Zap className="h-10 w-10" />)}
                                </div>
                                <div className="space-y-1 text-center md:text-left">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter font-heading italic">
                                        {isExpired ? "Access Restricted" : (isExpiringSoon ? "Critical Expiry Warning" : "Premium Trial Status")}
                                    </h3>
                                    <p className="text-zinc-500 font-medium lowercase italic">
                                        {isExpired
                                            ? "Your plan has expired. Re-activate to restore full listing capacity."
                                            : `${daysRemaining} days remaining in your current ${user?.subscriptionPlan || 'Premium'} operational cycle.`}
                                    </p>
                                </div>
                            </div>

                            <Button asChild className={cn(
                                "h-14 px-10 rounded-xl font-black uppercase tracking-widest italic font-heading",
                                isExpired ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white text-black hover:bg-zinc-200"
                            )}>
                                <Link href="/pricing">Optimize Plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Revenue Cycle", val: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: "+12.5%" },
                        { label: "Active Orders", val: stats.totalOrders, icon: ShoppingBag, trend: "Stable" },
                        { label: "Pending Verification", val: stats.pendingOrders, icon: Clock, color: "text-amber-500" },
                        { label: "Success Rate", val: `${Math.round((stats.completedOrders / (stats.totalOrders || 1)) * 100)}%`, icon: TrendingUp, color: "text-[#00FF85]" }
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-8 group relative overflow-hidden transition-all duration-500 hover:translate-y-[-5px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <stat.icon className="h-12 w-12" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading leading-tight">{stat.label}</span>
                                    {stat.trend && <span className="text-[9px] font-black text-[#00FF85] bg-[#00FF85]/5 px-2 py-0.5 rounded uppercase font-heading">{stat.trend}</span>}
                                </div>
                                <div className={cn("text-3xl font-black uppercase tracking-tighter font-heading", stat.color || "text-white")}>
                                    {stat.val}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Directive Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "New Listing", desc: "Deploy new asset to marketplace", href: "/dealer/listings/new", icon: Package, primary: true },
                        { label: "Inventory", desc: "Audit and verify live assets", href: "/dealer/listings", icon: Eye },
                        { label: "Terminal", desc: "Check incoming communications", href: "/chats", icon: MessageCircle },
                    ].map((action, i) => (
                        <Link key={i} href={action.href} className="group h-full">
                            <div className={cn(
                                "p-8 rounded-[2rem] transition-all duration-500 h-full flex items-center justify-between border",
                                action.primary
                                    ? "bg-[#FFB800] border-[#FFB800] text-black"
                                    : "bg-white/5 border-white/10 text-white hover:border-[#FFB800]/30"
                            )}>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black uppercase tracking-tighter italic font-heading">{action.label}</h4>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest font-heading lowercase italic opacity-60")}>
                                        {action.desc}
                                    </p>
                                </div>
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                                    action.primary ? "bg-black/10" : "bg-white/5"
                                )}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Execution Management Container */}
                <div className="glass-card rounded-[3rem] p-10 overflow-hidden">
                    <Tabs defaultValue="orders" className="space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-8">
                            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                                <TabsList className="bg-transparent gap-2 h-auto p-0 border-none shadow-none">
                                    <TabsTrigger value="orders" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Orders Queue</TabsTrigger>
                                    <TabsTrigger value="settings" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Payout Settings</TabsTrigger>
                                </TabsList>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest font-heading italic">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00FF85] animate-pulse" /> Auto-sync enabled
                            </div>
                        </div>

                        <TabsContent value="orders" className="space-y-10 focus-visible:outline-none focus:outline-none">
                            <Tabs defaultValue="all" className="space-y-8">
                                <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-10 overflow-x-auto border-none shadow-none">
                                    {['all', 'pending', 'confirmed', 'completed'].map(t => (
                                        <TabsTrigger key={t} value={t} className="data-[state=active]:text-[#FFB800] data-[state=active]:border-[#FFB800] bg-transparent border-b-2 border-transparent rounded-none px-0 pb-4 font-black uppercase tracking-widest text-[10px] transition-all font-heading shadow-none">
                                            {t === 'confirmed' ? 'Shipped' : t}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div className="grid grid-cols-1 gap-6">
                                    <TabsContent value="all" className="space-y-6 m-0 border-none">
                                        {orders.length === 0 ? (
                                            <div className="text-center py-24 glass-card border-dashed">
                                                <Package className="h-16 w-16 text-zinc-700 mx-auto mb-6" />
                                                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs font-heading italic">Zero orders detected in current sector</p>
                                            </div>
                                        ) : (
                                            orders.map(order => (
                                                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onOpenChat={openChat} isUpdating={updatingOrder === order.id} />
                                            ))
                                        )}
                                    </TabsContent>
                                    {['pending', 'confirmed', 'completed'].map(status => (
                                        <TabsContent key={status} value={status} className="space-y-6 m-0 border-none">
                                            {orders.filter(o => o.status === status).length === 0 ? (
                                                <div className="text-center py-24 glass-card border-dashed">
                                                    <Package className="h-16 w-16 text-zinc-700 mx-auto mb-6" />
                                                    <p className="text-zinc-500 font-black uppercase tracking-widest text-xs font-heading italic">No {status} orders found</p>
                                                </div>
                                            ) : (
                                                orders.filter(o => o.status === status).map(order => (
                                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onOpenChat={openChat} isUpdating={updatingOrder === order.id} />
                                                ))
                                            )}
                                        </TabsContent>
                                    ))}
                                </div>
                            </Tabs>
                        </TabsContent>

                        <TabsContent value="settings" className="focus-visible:outline-none focus:outline-none">
                            <div className="max-w-xl space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter font-heading italic">Payout Terminal</h3>
                                    <p className="text-zinc-500 text-sm italic">Define where your marketplace revenue is routed.</p>
                                </div>
                                <form onSubmit={updateBankDetails} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-heading">Bank Agency</Label>
                                            <Input
                                                value={bankDetails.bankName}
                                                onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                placeholder="e.g. GTBANK"
                                                className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors font-heading text-sm uppercase tracking-widest"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-heading">Account Serial</Label>
                                            <Input
                                                value={bankDetails.accountNumber}
                                                onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                placeholder="0123456789"
                                                className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors font-mono tracking-tighter"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-heading">Entity Name</Label>
                                        <Input
                                            value={bankDetails.accountName}
                                            onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                            placeholder="FULL ACCOUNT NAME"
                                            className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors font-heading text-sm uppercase tracking-widest"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="h-14 px-8 bg-white text-black hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest font-heading transition-all whitespace-nowrap">
                                        {loading ? 'Processing...' : 'Sync Payout Profile'}
                                    </Button>
                                </form>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
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
        const colors = {
            pending: 'bg-zinc-800 text-zinc-400 border-zinc-700',
            confirmed: 'bg-blue-900/20 text-blue-400 border-blue-500/20',
            completed: 'bg-emerald-950/20 text-[#00FF85] border-emerald-500/20',
            cancelled: 'bg-red-950/20 text-red-400 border-red-500/20',
        } as const;

        return (
            <Badge className={cn("px-3 py-1 font-black uppercase text-[9px] tracking-widest border font-heading italic", colors[status as keyof typeof colors] || colors.pending)}>
                {status === 'pending' && <Clock className="h-3 w-3 mr-1.5" />}
                {status === 'confirmed' && <Truck className="h-3 w-3 mr-1.5" />}
                {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1.5" />}
                {status}
            </Badge>
        );
    };

    return (
        <div className="glass-card p-6 flex flex-col md:flex-row gap-8 group/card transition-all duration-500 hover:border-[#FFB800]/20">
            <div className="flex-1 flex gap-6 italic">
                {order.listing?.images?.[0] ? (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 group-hover/card:border-[#FFB800]/20 transition-all">
                        <Image src={order.listing.images[0]} alt={order.listing.title} fill className="object-cover group-hover/card:scale-110 transition-transform duration-700" />
                    </div>
                ) : (
                    <div className="h-24 w-24 shrink-0 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <Package className="h-8 w-8 text-zinc-700" />
                    </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-heading">Ref: #{order.id.slice(-8).toUpperCase()}</span>
                        {getStatusBadge(order.status)}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter truncate font-heading">{order.listing?.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-700 underline">buyer:</span> <span className="text-zinc-300 font-bold">{order.buyer?.display_name}</span></span>
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-700 underline">value:</span> <span className="text-[#FFB800] font-black">₦{order.amount.toLocaleString()}</span></span>
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-700 underline">date:</span> <span>{new Date(order.created_at).toLocaleDateString()}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex md:flex-col justify-end gap-3 shrink-0">
                <Button variant="outline" onClick={() => onOpenChat(order)} className="flex-1 md:w-40 h-12 rounded-xl bg-white/5 border-white/10 hover:border-[#FFB800]/30 hover:bg-white/5 text-white font-black uppercase tracking-widest text-[10px] gap-2 font-heading transition-all">
                    <MessageCircle className="h-4 w-4" /> Message Buyer
                </Button>

                {order.status === 'pending' && (
                    <Select onValueChange={(value) => onUpdateStatus(order.id, value as any)} disabled={isUpdating}>
                        <SelectTrigger className="flex-1 md:w-40 h-12 rounded-xl bg-[#FFB800] border-none text-black font-black uppercase tracking-widest text-[10px] font-heading shadow-lg shadow-[#FFB800]/10 hover:bg-[#FFD700] transition-all">
                            <SelectValue placeholder="Dispatch" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white font-heading text-[10px] uppercase font-black tracking-widest">
                            <SelectItem value="confirmed" className="focus:bg-[#FFB800] focus:text-black">Mark Shipped</SelectItem>
                            <SelectItem value="cancelled" className="focus:bg-red-500 focus:text-white">Cancel Order</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
}
