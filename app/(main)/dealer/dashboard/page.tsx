'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { startConversation } from '@/lib/chat';
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
    ChevronRight,
    Loader2,
    Mail,
    ShieldAlert,
    RefreshCw
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
import { TrialBanner } from '@/components/subscription/TrialBanner';

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
    const { user, sessionUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
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
        bankCode: '',
        accountNumber: '',
        accountName: ''
    });

    const fetchBankDetails = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('users')
            .select('bank_details, bank_name, account_number, account_name')
            .eq('id', user.id)
            .single();

        if (data) {
            setBankDetails({
                bankName: data.bank_name || '',
                bankCode: data.bank_details?.bank_code || '',
                accountNumber: data.account_number || '',
                accountName: data.account_name || ''
            });
        }
        fetchBanks();
    };

    const [sessionLost, setSessionLost] = useState(false);

    useEffect(() => {
        // 1. Loading Guard: Don't make any decisions while auth/profile is loading
        if (authLoading) return;

        // 2. Auth Guard: If no session exists after loading, they must login
        if (!sessionUser) {
            setSessionLost(true);
            router.push('/login'); // Force redirect to login if session is truly missing
            return;
        }

        // 3. Profile Guard: Wait for the user profile to be fully loaded
        if (!user) return;

        // 4. Access Control: Only redirect IF we have the user and the role is objectively wrong
        const validRoles = ['dealer', 'student_seller'];
        if (!validRoles.includes(user.role)) {
            console.warn("Access Denied: Role mismatch for dealer dashboard", user.role);
            router.push('/');
            return;
        }

        // 5. Success: Session is active and role is correct
        setSessionLost(false);
        fetchOrders();
        fetchBankDetails();
        const unsubscribe = subscribeToOrders();
        checkSubscriptionStatus();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, sessionUser, authLoading, router]);

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

            // Refresh data without page reload
            fetchOrders();
        }
    };

    const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
    const [isResolving, setIsResolving] = useState(false);
    const [submittingBank, setSubmittingBank] = useState(false);

    const fetchBanks = async () => {
        try {
            const res = await fetch('/api/paystack/banks');
            const data = await res.json();
            if (data.status) {
                setBanks(data.data.map((b: any) => ({ name: b.name, code: b.code })));
            }
        } catch (err) {
            console.error('Failed to fetch banks:', err);
        }
    };

    const resolveAccount = async () => {
        if (bankDetails.accountNumber.length !== 10 || !bankDetails.bankCode) return;

        setIsResolving(true);
        try {
            const res = await fetch(`/api/paystack/resolve?accountNumber=${bankDetails.accountNumber}&bankCode=${bankDetails.bankCode}`);
            const data = await res.json();
            if (data.status) {
                setBankDetails(prev => ({ ...prev, accountName: data.data.account_name }));
            } else {
                alert('Could not resolve account name. Please verify details.');
            }
        } catch (err) {
            console.error('Resolution error:', err);
        } finally {
            setIsResolving(false);
        }
    };

    useEffect(() => {
        if (bankDetails.accountNumber.length === 10 && bankDetails.bankCode) {
            const timer = setTimeout(() => resolveAccount(), 1000);
            return () => clearTimeout(timer);
        }
    }, [bankDetails.accountNumber, bankDetails.bankCode]);

    const updateBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingBank(true);
        try {
            const selectedBank = banks.find(b => b.code === bankDetails.bankCode);

            const res = await fetch('/api/paystack/subaccount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...bankDetails,
                    bankName: selectedBank?.name,
                    businessName: user?.displayName
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Payout system synchronized with Paystack. Your earnings will now settle automatically.');
        } catch (err: any) {
            console.error('Failed to update bank details:', err);
            alert(err.message || 'Failed to update bank details');
        } finally {
            setSubmittingBank(false);
        }
    };

    const [nodeMetrics, setNodeMetrics] = useState({
        activeBuyers: 1420,
        demandLevel: 'High',
        popularCategory: 'Electronics',
        growthIndex: '+12.4%'
    });

    useEffect(() => {
        // Sync with active node for market data
        const savedNode = localStorage.getItem('mb-preferred-node');
        if (savedNode === 'FCT - Abuja') {
            setNodeMetrics({
                activeBuyers: 2840,
                demandLevel: 'Apex',
                popularCategory: 'Automotive',
                growthIndex: '+18.2%'
            });
        }
    }, []);

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
            const pendingOrders = data?.filter((o: Order) => o.status === 'pending').length || 0;
            const completedOrders = data?.filter((o: Order) => o.status === 'completed').length || 0;
            const totalRevenue = data?.filter((o: Order) => o.status === 'completed')
                .reduce((sum: number, o: Order) => sum + o.amount, 0) || 0;

            setStats({
                totalOrders,
                pendingOrders,
                completedOrders,
                totalRevenue,
            });

            // Fetch Financial Stats from sales_transactions
            const { data: financialData } = await supabase
                .from('sales_transactions')
                .select('amount_seller')
                .eq('seller_id', user.id)
                .eq('status', 'success');

            if (financialData) {
                const totalSellerEarnings = financialData.reduce((sum, t) => sum + Number(t.amount_seller), 0);
                setStats(prev => ({
                    ...prev,
                    totalRevenue: totalSellerEarnings || totalRevenue // Fallback to orders revenue if no transactions yet
                }));
            }
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
                try {
                    const conversationId = await startConversation(user!.id, order.buyer_id, order.listing_id);

                    let message = '';
                    if (newStatus === 'confirmed') {
                        message = `📦 Your order #${orderId.slice(-8).toUpperCase()} has been marked as shipped!`;
                    } else if (newStatus === 'cancelled') {
                        message = `❌ Order #${orderId.slice(-8).toUpperCase()} has been cancelled.`;
                    }

                    if (message) {
                        await supabase.from('messages').insert({
                            conversation_id: conversationId,
                            sender_id: user!.id,
                            content: message,
                        });
                    }
                } catch (chatErr) {
                    console.error('Failed to notify buyer via chat:', chatErr);
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
            const conversationId = await startConversation(user!.id, order.buyer_id, order.listing_id);
            router.push(`/chats/${conversationId}`);
        } catch (err) {
            console.error('Failed to open chat:', err);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (authLoading || loading || (!mounted && !sessionLost)) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-black relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />
                <div className="relative text-center">
                    <div className="h-24 w-24 rounded-2xl border-2 border-[#FF6600]/20 flex items-center justify-center relative animate-pulse mx-auto">
                        <Zap className="h-10 w-10 text-[#FF6600] animate-bounce" />
                        <div className="absolute inset-0 rounded-2xl border border-[#FF6600] animate-ping opacity-25" />
                    </div>
                    <p className="mt-8 text-zinc-500 font-black uppercase tracking-[0.3em] text-xs font-heading">Syncing Terminal...</p>
                </div>
            </div>
        );
    }

    if (sessionLost) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
                <div className="max-w-md w-full glass-card p-8 rounded-[2rem] text-center relative z-10 border border-white/10">
                    <AlertCircle className="h-16 w-16 text-[#FF6600] mx-auto mb-6" />
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Signal Dropped</h2>
                    <p className="text-zinc-500 font-medium mb-8">Secure connection to the terminal was interrupted. Please re-establish identity.</p>
                    <Button onClick={() => window.location.reload()} className="w-full h-14 bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FF8533] transition-all">
                        Reconnect Node
                    </Button>
                    <Button variant="ghost" onClick={() => router.push('/login')} className="w-full mt-4 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px]">
                        Return to Gate
                    </Button>
                </div>
            </div>
        );
    }

    if (user && !user.isVerified) {
        // Safe access to metadata
        const verificationMethod = (user as any).metadata?.verification_method;
        const isEmailMethod = verificationMethod === 'school_email';

        const resendEmail = async () => {
            alert("Re-transmitting verification signal...");
            try {
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: user.email,
                });
                if (error) alert(error.message);
                else alert("Signal transmitted. Check your inbox.");
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
                <div className="max-w-xl w-full glass-card p-12 rounded-[3rem] text-center relative z-10 border border-white/10 shadow-2xl">
                    <div className="h-24 w-24 rounded-3xl bg-[#FF6600]/10 border border-[#FF6600]/20 flex items-center justify-center mx-auto mb-8 relative">
                        {isEmailMethod ? (
                            <Mail className="h-10 w-10 text-[#FF6600]" />
                        ) : (
                            <ShieldAlert className="h-10 w-10 text-[#FF6600]" />
                        )}
                        <div className="absolute inset-0 rounded-3xl border border-[#FF6600]/30 animate-pulse" />
                    </div>

                    <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
                        {isEmailMethod ? "Verify Identity" : "Protocol Pending"}
                    </h2>

                    <p className="text-zinc-500 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                        {isEmailMethod
                            ? <span>We have transmitted a secure link to <span className="text-white font-bold">{user.email}</span>. Please authorize this node to activate your dashboard.</span>
                            : (
                                <>
                                    Your merchant credentials are under review by central command. Access will be granted upon successful ID verification.
                                    <br /><br />
                                    <span className="text-[10px] uppercase font-bold text-zinc-600">
                                        For questions, email <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6600] hover:underline">support@marketbridge.com.ng</a>
                                    </span>
                                </>
                            )
                        }
                    </p>

                    {isEmailMethod ? (
                        <div className="space-y-4">
                            <Button onClick={() => window.location.reload()} className="w-full h-16 bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF8533] transition-all shadow-[0_0_30px_rgba(255,102,0,0.2)]">
                                <RefreshCw className="mr-3 h-5 w-5" /> I Have Verified
                            </Button>
                            <button onClick={resendEmail} className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#FF6600] transition-colors">
                                Re-transmit Signal
                            </button>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Estimated Arrival</p>
                            <p className="text-xl font-black text-white italic">~24 Hours</p>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <Button variant="ghost" onClick={() => router.push('/listings')} className="text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px]">
                            Return to Base
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col selection:bg-[#FF6600] selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <DealerGuide />

            <div className="container mx-auto py-12 px-6 relative z-10 space-y-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
                    {/* ... Header Section content ... */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6600] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading leading-tight">Live Operation Panel</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Dealer <span className="text-[#FF6600]">Hub</span>
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
                        <a
                            href={`mailto:support@marketbridge.com.ng?subject=Seller Support – ${user?.displayName || 'Merchant'} / ${user?.university || 'Node'}`}
                            className="hidden md:flex h-16 px-6 items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] transition-all font-heading"
                        >
                            Need Help?
                        </a>
                        <Button onClick={fetchOrders} className="h-16 px-8 bg-[#FF6600] text-black hover:bg-[#FF6600] rounded-2xl font-black uppercase tracking-widest transition-all font-heading">
                            Sync Data
                        </Button>
                    </div>
                </div>

                {/* Subscription Banners */}
                <TrialBanner />

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
                                    ? "bg-[#FF6600] border-[#FF6600] text-black"
                                    : "bg-white/5 border-white/10 text-white hover:border-[#FF6600]/30"
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
                                    <TabsTrigger value="orders" className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Orders Queue</TabsTrigger>
                                    <TabsTrigger value="settings" className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Payout Settings</TabsTrigger>
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
                                        <TabsTrigger key={t} value={t} className="data-[state=active]:text-[#FF6600] data-[state=active]:border-[#FF6600] bg-transparent border-b-2 border-transparent rounded-none px-0 pb-4 font-black uppercase tracking-widest text-[10px] transition-all font-heading shadow-none">
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
                                            orders.map((order: Order) => (
                                                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onOpenChat={openChat} isUpdating={updatingOrder === order.id} />
                                            ))
                                        )}
                                    </TabsContent>
                                    {['pending', 'confirmed', 'completed'].map(status => (
                                        <TabsContent key={status} value={status} className="space-y-6 m-0 border-none">
                                            {orders.filter((o: Order) => o.status === status).length === 0 ? (
                                                <div className="text-center py-24 glass-card border-dashed">
                                                    <Package className="h-16 w-16 text-zinc-700 mx-auto mb-6" />
                                                    <p className="text-zinc-500 font-black uppercase tracking-widest text-xs font-heading italic">No {status} orders found</p>
                                                </div>
                                            ) : (
                                                orders.filter((o: Order) => o.status === status).map((order: Order) => (
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
                                    <p className="text-zinc-500 text-sm italic mb-4">Establishing secure Paystack subaccount for auto-payouts.</p>
                                    <div className="bg-[#00FF85]/5 border border-[#00FF85]/10 p-4 rounded-2xl flex items-start gap-4 mb-8">
                                        <Zap className="h-5 w-5 text-[#00FF85] shrink-0 mt-1" />
                                        <p className="text-[10px] text-[#00FF85] font-black uppercase tracking-widest leading-relaxed">
                                            Beta Feature: Funds are split automatically. You receive the net amount minus platform commission directly to this bank via Paystack settlement.
                                        </p>
                                    </div>
                                </div>
                                <form onSubmit={updateBankDetails} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-heading">Select Bank</Label>
                                            <Select
                                                value={bankDetails.bankCode}
                                                onValueChange={(val) => setBankDetails(prev => ({ ...prev, bankCode: val }))}
                                                required
                                            >
                                                <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl font-heading text-[10px] font-black uppercase tracking-widest text-left">
                                                    <SelectValue placeholder="CHOOSE INSTITUTION" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-white/10 text-white font-heading text-[10px] font-black uppercase tracking-widest">
                                                    {banks.map((bank) => (
                                                        <SelectItem key={bank.code} value={bank.code} className="focus:bg-[#FF6600] focus:text-black py-3">
                                                            {bank.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-heading">Account Serial</Label>
                                            <div className="relative">
                                                <Input
                                                    value={bankDetails.accountNumber}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                    placeholder="0123456789"
                                                    className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-colors font-mono tracking-widest"
                                                    required
                                                />
                                                {isResolving && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FF6600]" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-heading">Entity Name</Label>
                                        <Input
                                            value={bankDetails.accountName}
                                            readOnly
                                            placeholder="AUTO-RESOLVING NAME..."
                                            className="h-14 bg-white/[0.02] border-white/10 rounded-xl font-heading text-sm uppercase tracking-widest text-[#00FF85] cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={submittingBank || isResolving} className="h-14 px-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest font-heading transition-all whitespace-nowrap shadow-xl shadow-white/5 group">
                                        {submittingBank ? (
                                            <>
                                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                                Syncing Protocol...
                                            </>
                                        ) : (
                                            <>
                                                Sync Payout Profile <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="border-t border-white/5 pt-8 text-center pb-8">
                    <p className="text-[10px] text-zinc-600 font-medium">
                        This is a Beta version – for support or questions, email <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6600] hover:underline">support@marketbridge.com.ng</a>
                    </p>
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
        <div className="glass-card p-6 flex flex-col md:flex-row gap-8 group/card transition-all duration-500 hover:border-[#FF6600]/20">
            <div className="flex-1 flex gap-6 italic">
                {order.listing?.images?.[0] ? (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 group-hover/card:border-[#FF6600]/20 transition-all">
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
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-700 underline">value:</span> <span className="text-[#FF6600] font-black">₦{order.amount.toLocaleString()}</span></span>
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-700 underline">date:</span> <span>{new Date(order.created_at).toLocaleDateString()}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex md:flex-col justify-end gap-3 shrink-0">
                <Button variant="outline" onClick={() => onOpenChat(order)} className="flex-1 md:w-40 h-12 rounded-xl bg-white/5 border-white/10 hover:border-[#FF6600]/30 hover:bg-white/5 text-white font-black uppercase tracking-widest text-[10px] gap-2 font-heading transition-all">
                    <MessageCircle className="h-4 w-4" /> Message Buyer
                </Button>

                {order.status === 'pending' && (
                    <Select onValueChange={(value: string) => onUpdateStatus(order.id, value as 'pending' | 'confirmed' | 'completed' | 'cancelled')} disabled={isUpdating}>
                        <SelectTrigger className="flex-1 md:w-40 h-12 rounded-xl bg-[#FF6600] border-none text-black font-black uppercase tracking-widest text-[10px] font-heading shadow-lg shadow-[#FF6600]/10 hover:bg-[#FF6600] transition-all">
                            <SelectValue placeholder="Dispatch" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white font-heading text-[10px] uppercase font-black tracking-widest">
                            <SelectItem value="confirmed" className="focus:bg-[#FF6600] focus:text-black">Mark Shipped</SelectItem>
                            <SelectItem value="cancelled" className="focus:bg-red-500 focus:text-white">Cancel Order</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
}
