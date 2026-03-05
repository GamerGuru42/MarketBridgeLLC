'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { startConversation } from '@/lib/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/contexts/ToastContext';
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
    RefreshCw,
    User,
    Crown,
    Star,
    Sparkles,
    X,
} from 'lucide-react';
import Link from 'next/link';

import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SellerGuide } from '@/components/SellerGuide';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { SellerWeatherWidget } from '@/components/seller-weather-widget';
import { checkAndHandleExpiredTrial } from '@/lib/subscription/utils';

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

interface Offer {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    offered_price: number;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
    message: string | null;
    created_at: string;
    buyer?: {
        display_name: string;
        photo_url: string | null;
        email?: string;
    };
    listing?: {
        title: string;
        price: number;
    };
}

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
}

interface OfferStats {
    totalPending: number;
}

export default function SellerDashboardPage() {
    const { user, sessionUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
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
    const [offers, setOffers] = useState<Offer[]>([]);
    const [offerStats, setOfferStats] = useState<OfferStats>({ totalPending: 0 });
    const [processingOffer, setProcessingOffer] = useState<string | null>(null);
    const [referralStats, setReferralStats] = useState({ totalInvited: 0, coinsEarned: 0 });
    const [revenueTrend, setRevenueTrend] = useState<string>('—');
    const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'loading'>('loading');
    const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null);
    const [showPlanPrompt, setShowPlanPrompt] = useState(false);

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

    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams?.get('subscription') === 'success') {
            toast('Subscription updated successfully! Need help? Contact ops-support@marketbridge.com.ng', 'success');
            router.replace('/seller/dashboard');
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!sessionUser) {
            setSessionLost(true);
            router.push('/login');
            return;
        }
        if (!user) return;

        const approvedRoles = ['dealer', 'student_seller', 'seller'];
        if (approvedRoles.includes(user.role)) {
            setApplicationStatus('approved');
            setSessionLost(false);
            // Check subscription/trial status for approved sellers too
            checkSubscriptionTrial();
            fetchOrders();
            fetchBankDetails();
            fetchOffers();
            fetchReferralStats();
            const unsubscribeOrders = subscribeToOrders();
            const unsubscribeOffers = subscribeToOffers();
            checkSubscriptionStatus();
            return () => {
                if (unsubscribeOrders) unsubscribeOrders();
                if (unsubscribeOffers) unsubscribeOffers();
            };
        }

        // Buyers who submitted a seller application — check application status
        if (user.role === 'student_buyer') {
            checkApplicationStatus();
            return;
        }

        // Completely unrelated role — redirect home
        console.warn('Seller dashboard: unrecognized role', user.role);
        router.push('/');
    }, [user, sessionUser, authLoading, router]);

    // Query the subscriptions table — the single source of truth for trial state
    const checkSubscriptionTrial = async () => {
        if (!user) return;
        try {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('status, trial_start, trial_end')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (sub?.status === 'trialing' && sub.trial_end) {
                const expires = new Date(sub.trial_end);
                setTrialExpiresAt(expires);

                // Show the plan prompt once per session
                const seenKey = `mb_plan_prompt_${user.id}`;
                if (!sessionStorage.getItem(seenKey) && new Date() < expires) {
                    setShowPlanPrompt(true);
                    sessionStorage.setItem(seenKey, '1');
                }
            }
        } catch (err) {
            console.error('Failed to check subscription trial:', err);
        }
    };

    const checkApplicationStatus = async () => {
        if (!user) return;
        try {
            const [appResult, subResult] = await Promise.all([
                supabase
                    .from('seller_applications')
                    .select('status, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from('subscriptions')
                    .select('status, trial_start, trial_end')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
            ]);

            const app = appResult.data;
            const sub = subResult.data;

            if (!app) {
                setApplicationStatus('none');
                setLoading(false);
                return;
            }

            const status = app.status as 'pending' | 'approved' | 'rejected';
            setApplicationStatus(status);

            if (status === 'pending') {
                // Use subscription trial_end if available (set by the API on submit)
                // Fall back to 14 days from application creation
                let expires: Date;
                if (sub?.status === 'trialing' && sub.trial_end) {
                    expires = new Date(sub.trial_end);
                } else {
                    const submittedAt = new Date(app.created_at);
                    expires = new Date(submittedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
                }
                setTrialExpiresAt(expires);

                const isTrialActive = new Date() < expires;
                if (isTrialActive) {
                    setSessionLost(false);
                    fetchOrders();
                    fetchBankDetails();
                    fetchOffers();
                    fetchReferralStats();
                    // Show plan prompt once per session
                    const seenKey = `mb_plan_prompt_${user.id}`;
                    if (!sessionStorage.getItem(seenKey)) {
                        setShowPlanPrompt(true);
                        sessionStorage.setItem(seenKey, '1');
                    }
                }
            }
        } catch (err) {
            console.error('Failed to check application/subscription status:', err);
            setApplicationStatus('none');
        } finally {
            setLoading(false);
        }
    };

    const fetchReferralStats = async () => {
        if (!user) return;
        try {
            // Count users referred by this user
            const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by_id', user.id);

            // Sum referral coins from transactions
            const { data: transData, error: transError } = await supabase
                .from('coins_transactions')
                .select('amount')
                .eq('user_id', user.id)
                .in('type', ['referral', 'referral_welcome']);

            if (countError || transError) throw countError || transError;

            const coinsEarned = transData?.reduce((sum, t) => sum + t.amount, 0) || 0;
            setReferralStats({ totalInvited: count || 0, coinsEarned });
        } catch (err) {
            console.error('Failed to fetch referral stats:', err);
        }
    };

    const checkSubscriptionStatus = async () => {
        if (!user) return;

        try {
            const hasExpired = await checkAndHandleExpiredTrial(user.id);
            if (hasExpired) {
                // If trial was handled, we might want to refresh user data or show a message
                console.log('Trial expiration handled');
                fetchOrders();
            }
        } catch (err) {
            console.error('Failed to check subscription status:', err);
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
                toast('Could not resolve account name. Please double-check your account number and bank.', 'error');
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

            toast('Payout account linked! Your earnings will now settle automatically.', 'success');
        } catch (err: any) {
            console.error('Failed to update bank details:', err);
            toast(err.message || 'Failed to update payout details', 'error');
        } finally {
            setSubmittingBank(false);
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
                const finalRevenue = totalSellerEarnings || totalRevenue;

                // Compute real month-over-month trend
                const now = new Date();
                const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

                const { data: lastMonthData } = await supabase
                    .from('sales_transactions')
                    .select('amount_seller')
                    .eq('seller_id', user!.id)
                    .eq('status', 'success')
                    .gte('created_at', startOfLastMonth)
                    .lte('created_at', endOfLastMonth);

                const { data: thisMonthData } = await supabase
                    .from('sales_transactions')
                    .select('amount_seller')
                    .eq('seller_id', user!.id)
                    .eq('status', 'success')
                    .gte('created_at', startOfThisMonth);

                const lastMonthRev = lastMonthData?.reduce((s, t) => s + Number(t.amount_seller), 0) || 0;
                const thisMonthRev = thisMonthData?.reduce((s, t) => s + Number(t.amount_seller), 0) || 0;

                if (lastMonthRev > 0) {
                    const pct = ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100;
                    setRevenueTrend(`${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`);
                } else if (thisMonthRev > 0) {
                    setRevenueTrend('+100%');
                } else {
                    setRevenueTrend('—');
                }

                setStats(prev => ({
                    ...prev,
                    totalRevenue: finalRevenue
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
            .channel('seller_orders')
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

    const fetchOffers = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    buyer:users(display_name, photo_url, email),
                    listing:listings(title, price)
                `)
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers(data || []);
            setOfferStats({
                totalPending: data?.filter(o => o.status === 'pending').length || 0
            });
        } catch (err) {
            console.error('Failed to fetch offers:', err);
        }
    };

    const subscribeToOffers = () => {
        if (!user) return;
        const subscription = supabase
            .channel('seller_offers')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'offers',
                    filter: `seller_id=eq.${user.id}`,
                },
                () => fetchOffers()
            )
            .subscribe();

        return () => subscription.unsubscribe();
    };

    const handleOfferAction = async (offer: Offer, action: 'accept' | 'reject') => {
        setProcessingOffer(offer.id);
        try {
            if (action === 'accept') {
                // 1. Update listing price
                const { error: listError } = await supabase
                    .from('listings')
                    .update({
                        current_offered_price: offer.offered_price
                    })
                    .eq('id', offer.listing_id);

                if (listError) throw listError;

                // 2. Update offer status
                const { error: offerError } = await supabase
                    .from('offers')
                    .update({ status: 'accepted' })
                    .eq('id', offer.id);

                if (offerError) throw offerError;

                // 3. Notify buyer via chat (Optional but good)
                try {
                    const conversationId = await startConversation(user!.id, offer.buyer_id, offer.listing_id);
                    await supabase.from('messages').insert({
                        conversation_id: conversationId,
                        sender_id: user!.id,
                        content: `✅ I've accepted your offer of ₦${offer.offered_price.toLocaleString()} for "${offer.listing?.title}". You can now proceed to Buy Now at this rate!`,
                    });
                } catch (e) {
                    console.error("Chat notification failed:", e);
                }

                toast('✅ Offer accepted! Buyer notified via chat.', 'success');
            } else {
                const { error: offerError } = await supabase
                    .from('offers')
                    .update({ status: 'rejected' })
                    .eq('id', offer.id);

                if (offerError) throw offerError;
                toast('Offer rejected.', 'info');
            }
            fetchOffers();
        } catch (err: any) {
            console.error("Offer action failed:", err);
            toast(err.message || 'Action failed. Please try again.', 'error');
        } finally {
            setProcessingOffer(null);
        }
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
            toast('Failed to update order status. Please try again.', 'error');
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

    if (authLoading || (loading && applicationStatus === 'loading') || (!mounted && !sessionLost)) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-[#FAFAFA] relative overflow-hidden text-zinc-900">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />
                <div className="relative text-center">
                    <div className="h-24 w-24 rounded-2xl border-2 border-[#FF6200]/20 flex items-center justify-center relative animate-pulse mx-auto">
                        <Zap className="h-10 w-10 text-[#FF6200] animate-bounce" />
                        <div className="absolute inset-0 rounded-2xl border border-[#FF6200] animate-ping opacity-25" />
                    </div>
                    <p className="mt-8 text-zinc-500 font-black uppercase tracking-[0.3em] text-xs font-heading">Syncing Dashboard...</p>
                </div>
            </div>
        );
    }

    if (sessionLost) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-zinc-900 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
                <div className="max-w-md w-full bg-white border border-zinc-200 shadow-sm p-8 rounded-[2rem] text-center relative z-10 border border-zinc-200">
                    <AlertCircle className="h-16 w-16 text-[#FF6200] mx-auto mb-6" />
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Error Occurred</h2>
                    <p className="text-zinc-500 font-medium mb-8">Secure connection to the Dashboard was interrupted. Please re-establish identity.</p>
                    <Button onClick={() => window.location.reload()} className="w-full h-14 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FF7A29] transition-all">
                        Reconnect Campus
                    </Button>
                    <Button variant="ghost" onClick={() => router.push('/login')} className="w-full mt-4 text-zinc-500 hover:text-zinc-900 font-black uppercase tracking-widest text-[10px]">
                        Return to Gate
                    </Button>
                </div>
            </div>
        );
    }

    // ─── NEW SELLER: No application yet — prompt them to onboard ───
    if (applicationStatus === 'none') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-white p-6">
                <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-12 rounded-[3rem] text-center space-y-6">
                    <div className="h-24 w-24 rounded-3xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center mx-auto">
                        <Package className="h-10 w-10 text-[#FF6200]" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Complete Your Setup</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                        You haven't submitted your seller application yet. Complete it in under 2 minutes to start selling on campus.
                    </p>
                    <Link href="/seller-onboard">
                        <Button className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl text-sm shadow-[0_8px_30px_rgba(255,98,0,0.3)] transition-all hover:scale-105">
                            Start Seller Application <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/marketplace" className="block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold transition-colors">
                        Browse Marketplace Instead
                    </Link>
                </div>
            </div>
        );
    }

    // ─── PENDING: check trial status ───
    if (applicationStatus === 'pending') {
        const trialActive = trialExpiresAt ? new Date() < trialExpiresAt : false;
        const daysLeft = trialExpiresAt
            ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0;

        // Trial expired — force upgrade wall
        if (!trialActive) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#FF6200]/8 blur-[150px] rounded-full pointer-events-none" />
                    <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-12 rounded-[3rem] text-center space-y-6 relative z-10">
                        <div className="h-24 w-24 rounded-3xl bg-[#FF6200]/10 border border-[#FF6200]/30 flex items-center justify-center mx-auto">
                            <Zap className="h-10 w-10 text-[#FF6200]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6200] mb-2">Free Trial Ended</p>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Pick Your Plan</h2>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                            Your 14-day free trial has ended. Choose a plan to keep selling on MarketBridge and unlock more features.
                        </p>
                        <div className="grid gap-3">
                            <Link href="/seller/upgrade">
                                <Button className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_30px_rgba(255,98,0,0.3)] transition-all hover:scale-105">
                                    <Crown className="h-4 w-4 mr-2" /> View Pricing Plans
                                </Button>
                            </Link>
                            <a href="https://wa.me/2349012345678?text=My%20MarketBridge%20seller%20trial%20expired" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full h-12 border-zinc-200 dark:border-zinc-700 font-black uppercase tracking-widest text-xs">
                                    Contact Support
                                </Button>
                            </a>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">
                            Plans start at <strong className="text-zinc-700 dark:text-zinc-200">₦2,500/month</strong>. Cancel anytime.
                        </p>
                    </div>
                </div>
            );
        }

        // Trial still active — fall through to render full dashboard below
        // (trialActive is passed to main return via trialExpiresAt/applicationStatus)
    }

    // ─── REJECTED ───
    if (applicationStatus === 'rejected') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-white p-6">
                <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-12 rounded-[3rem] text-center space-y-6">
                    <div className="h-24 w-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Application Declined</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                        Unfortunately, your application wasn't approved this time. You can re-apply with updated information.
                    </p>
                    <Link href="/seller-onboard">
                        <Button className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl text-sm shadow-[0_8px_30px_rgba(255,98,0,0.3)]">
                            Re-Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <a href="https://wa.me/2349012345678?text=My%20seller%20application%20was%20declined" target="_blank" rel="noopener noreferrer" className="block text-xs text-zinc-400 hover:text-red-500 font-bold transition-colors">
                        Contact support for more info →
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-white relative flex flex-col selection:bg-[#FF6200] selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            {/* ─── PLAN PROMPT MODAL (first-time, trial sellers) ─── */}
            {showPlanPrompt && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button
                            onClick={() => setShowPlanPrompt(false)}
                            aria-label="Close"
                            className="absolute top-5 right-5 h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6200] mb-1">Welcome to Your Dashboard</p>
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">You're on a Free Trial!</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-2">
                                Enjoy <strong className="text-zinc-900 dark:text-white">14 days free</strong> — then pick the plan that fits your hustle.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {[
                                { name: 'Starter', price: '₦0', period: 'Free forever', icon: Star, features: ['5 listings', 'Basic profile', 'Messaging'], highlight: false },
                                { name: 'Pro Seller', price: '₦2,500', period: '/month', icon: Zap, features: ['30 listings', 'Priority search', 'Analytics', 'Verified badge'], highlight: true },
                                { name: 'Elite Store', price: '₦6,000', period: '/month', icon: Crown, features: ['Unlimited listings', 'Homepage slot', 'Store banner', 'Account manager'], highlight: false },
                            ].map((plan) => (
                                <div key={plan.name} className={`relative rounded-2xl p-5 border ${plan.highlight
                                    ? 'border-[#FF6200] bg-[#FF6200]/5'
                                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                                    }`}>
                                    {plan.highlight && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6200] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                            Most Popular
                                        </div>
                                    )}
                                    <plan.icon className={`h-6 w-6 mb-3 ${plan.highlight ? 'text-[#FF6200]' : 'text-zinc-500'}`} />
                                    <p className="font-black text-sm uppercase tracking-tight">{plan.name}</p>
                                    <p className="text-xl font-black mt-1">{plan.price}<span className="text-xs font-bold text-zinc-400">{plan.period}</span></p>
                                    <ul className="mt-3 space-y-1">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                                                <CheckCircle className="h-3 w-3 text-[#FF6200] shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/seller/upgrade" className="flex-1">
                                <Button className="w-full h-12 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-xl text-xs shadow-[0_4px_20px_rgba(255,98,0,0.3)]">
                                    Choose a Plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={() => setShowPlanPrompt(false)}
                                className="flex-1 h-12 border-zinc-200 dark:border-zinc-700 font-black uppercase tracking-widest text-xs"
                            >
                                Continue with Free Trial
                            </Button>
                        </div>
                        <p className="text-center text-[10px] text-zinc-400 mt-4">You can upgrade anytime from your dashboard settings.</p>
                    </div>
                </div>
            )}

            {/* ─── TRIAL COUNTDOWN BANNER (pending sellers on trial) ─── */}
            {applicationStatus === 'pending' && trialExpiresAt && (() => {
                const daysLeft = Math.max(0, Math.ceil((trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                return (
                    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#FF6200] to-amber-500 text-white px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
                        <div className="flex items-center gap-3 text-sm font-bold">
                            <Zap className="h-4 w-4 shrink-0" />
                            <span>
                                <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> left on your free trial.
                                {daysLeft <= 3 && ' ⚠️ Trial ending soon!'}
                            </span>
                        </div>
                        <Link href="/seller/upgrade">
                            <Button size="sm" className="h-8 px-5 bg-white text-[#FF6200] hover:bg-zinc-100 font-black uppercase tracking-widest text-[10px] rounded-full shrink-0">
                                Upgrade Now
                            </Button>
                        </Link>
                    </div>
                );
            })()}

            <SellerGuide />
            <div className="container mx-auto px-6 mt-6 relative z-10"><SellerWeatherWidget /></div>

            <div className="container mx-auto py-6 px-6 relative z-10 space-y-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-12">
                    {/* ... Header Section content ... */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading leading-tight">Live Operation Panel</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Seller <span className="text-[#FF6200]">Hub</span>
                        </h1>
                        <p className="text-zinc-500 font-medium max-w-xl italic">
                            Command center for <span className="text-zinc-900 font-bold">{user?.displayName}</span>.
                            Managing <span className="text-zinc-900 font-bold">{stats.totalOrders} assets</span> in current cycle.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-16 px-8 rounded-2xl bg-white border border-zinc-200 flex flex-col justify-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 mb-1 pb-1 font-heading">Network Status</span>
                            <span className="text-sm font-black text-zinc-900 italic uppercase tracking-tighter flex items-center gap-2 font-heading">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200]" /> Connected
                            </span>
                        </div>
                        <div className="hidden md:flex gap-3">
                            <a
                                href={`mailto:support@marketbridge.com.ng?subject=Tech%20Support%20%E2%80%93%20${user?.displayName || 'Merchant'}`}
                                className="h-16 px-6 flex items-center justify-center bg-[#FF6200]/10 hover:bg-[#FF6200]/20 border border-[#FF6200]/20 rounded-2xl text-[#FF6200] font-black uppercase tracking-widest text-[10px] transition-all font-heading"
                            >
                                Report Bug / Tech Issue
                            </a>
                            <a
                                href={`mailto:ops-support@marketbridge.com.ng?subject=Seller%20Support%20%E2%80%93%20${user?.displayName || 'Merchant'}`}
                                className="h-16 px-6 flex items-center justify-center bg-white hover:bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-black uppercase tracking-widest text-[10px] transition-all font-heading"
                            >
                                Refund / Payment / Seller Help
                            </a>
                        </div>
                        <Button onClick={fetchOrders} className="h-16 px-8 bg-[#FF6200] text-black hover:bg-[#FF7A29] rounded-2xl font-black uppercase tracking-widest transition-all font-heading">
                            Sync Data
                        </Button>
                    </div>
                </div>

                {/* Subscription Banners */}
                <TrialBanner />

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Revenue Cycle", val: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: revenueTrend },
                        { label: "Active Orders", val: stats.totalOrders, icon: ShoppingBag, trend: "Stable" },
                        { label: "Pending Verification", val: stats.pendingOrders, icon: Clock, color: "text-[#FF6200]" },
                        { label: "Success Rate", val: `${Math.round((stats.completedOrders / (stats.totalOrders || 1)) * 100)}%`, icon: TrendingUp, color: "text-zinc-900" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-zinc-200 shadow-sm p-8 group relative overflow-hidden transition-all duration-500 hover:translate-y-[-5px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <stat.icon className="h-12 w-12" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading leading-tight">{stat.label}</span>
                                    {stat.trend && <span className="text-[9px] font-black text-[#FF6200] bg-[#FF6200]/5 px-2 py-0.5 rounded uppercase font-heading">{stat.trend}</span>}
                                </div>
                                <div className={cn("text-3xl font-black uppercase tracking-tighter font-heading", stat.color || "text-zinc-900")}>
                                    {stat.val}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Directive Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "New Listing", desc: "Deploy new asset to marketplace", href: "/seller/listings/new", icon: Package, primary: true },
                        { label: "Inventory", desc: "Audit and verify live assets", href: "/seller/listings", icon: Eye },
                        { label: "Messages", desc: "Check incoming communications", href: "/chats", icon: MessageCircle },
                        { label: "Upgrade Plan", desc: "Unlock pro features & visibility", href: "/seller/upgrade", icon: Crown, highlight: true },
                    ].map((action, i) => (
                        <Link key={i} href={action.href} className="group h-full">
                            <div className={cn(
                                "p-8 rounded-[2rem] transition-all duration-500 h-full flex flex-col justify-between border",
                                action.primary
                                    ? "bg-[#FF6200] border-[#FF6200] text-black"
                                    : action.highlight
                                        ? "bg-zinc-900 border-zinc-800 text-white hover:border-[#FF6200]/50"
                                        : "bg-white border-zinc-200 text-zinc-900 hover:border-[#FF6200]/30"
                            )}>
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 mb-6",
                                    action.primary ? "bg-white/10" : action.highlight ? "bg-[#FF6200]/10 text-[#FF6200]" : "bg-zinc-100"
                                )}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black uppercase tracking-tighter italic font-heading">{action.label}</h4>
                                    <p className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest font-heading lowercase italic opacity-60",
                                        action.highlight ? "text-[#FF6200]" : ""
                                    )}>
                                        {action.desc}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Execution Management Container */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-[3rem] p-10 overflow-hidden">
                    <Tabs defaultValue="orders" className="space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-100 pb-8">
                            <div className="flex bg-[#FAFAFA]/40 p-1.5 rounded-2xl border border-zinc-200">
                                <TabsList className="bg-transparent gap-2 h-auto p-0 border-none shadow-none">
                                    <TabsTrigger value="orders" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Orders Queue</TabsTrigger>
                                    <TabsTrigger value="offers" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading relative">
                                        Offers Dashboard
                                        {offerStats.totalPending > 0 && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#FF6200] rounded-full text-[8px] flex items-center justify-center text-black border-2 border-black animate-pulse">
                                                {offerStats.totalPending}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="rewards" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Rewards & Referrals</TabsTrigger>
                                    <TabsTrigger value="settings" className="data-[state=active]:bg-[#FF6200] data-[state=active]:text-black h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all font-heading">Payout Settings</TabsTrigger>
                                </TabsList>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest font-heading italic">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200] animate-pulse" /> Auto-sync enabled
                            </div>
                        </div>

                        <TabsContent value="orders" className="space-y-10 focus-visible:outline-none focus:outline-none">
                            <Tabs defaultValue="all" className="space-y-8">
                                <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-10 overflow-x-auto border-none shadow-none">
                                    {['all', 'pending', 'confirmed', 'completed'].map(t => (
                                        <TabsTrigger key={t} value={t} className="data-[state=active]:text-[#FF6200] data-[state=active]:border-[#FF6200] bg-transparent border-b-2 border-transparent rounded-none px-0 pb-4 font-black uppercase tracking-widest text-[10px] transition-all font-heading shadow-none">
                                            {t === 'confirmed' ? 'Shipped' : t}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div className="grid grid-cols-1 gap-6">
                                    <TabsContent value="all" className="space-y-6 m-0 border-none">
                                        {orders.length === 0 ? (
                                            <div className="text-center py-24 bg-white border border-zinc-200 shadow-sm border-dashed">
                                                <Package className="h-16 w-16 text-zinc-900/20 mx-auto mb-6" />
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
                                                <div className="text-center py-24 bg-white border border-zinc-200 shadow-sm border-dashed">
                                                    <Package className="h-16 w-16 text-zinc-900/20 mx-auto mb-6" />
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

                        <TabsContent value="offers" className="space-y-10 focus-visible:outline-none focus:outline-none">
                            <div className="grid grid-cols-1 gap-6">
                                {offers.length === 0 ? (
                                    <div className="text-center py-24 bg-white border border-zinc-200 shadow-sm border-dashed">
                                        <Zap className="h-16 w-16 text-zinc-900/20 mx-auto mb-6" />
                                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs font-heading italic">Zero negotiation Notices detected</p>
                                    </div>
                                ) : (
                                    offers.map((offer) => (
                                        <div key={offer.id} className="bg-white border border-zinc-200 shadow-sm p-6 flex flex-col md:flex-row gap-8 group/card transition-all duration-500 hover:border-[#FF6200]/20 italic">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-zinc-900/30 uppercase tracking-widest font-heading">System: #{offer.id.slice(-8).toUpperCase()}</span>
                                                        <Badge className={cn(
                                                            "px-3 py-1 font-black uppercase text-[9px] tracking-widest border font-heading italic",
                                                            offer.status === 'pending' ? 'bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20' :
                                                                offer.status === 'accepted' ? 'bg-white text-zinc-900 border-zinc-200' :
                                                                    'bg-zinc-100 text-zinc-600 border-zinc-700'
                                                        )}>
                                                            {offer.status}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-900/30 font-black uppercase font-heading">{new Date(offer.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tighter font-heading text-zinc-900">{offer.listing?.title}</h3>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Original: ₦{offer.listing?.price?.toLocaleString()}</span>
                                                        <ArrowRight className="h-3 w-3 text-zinc-900/20" />
                                                        <span className="text-lg font-black text-[#FF6200]">Offered: ₦{offer.offered_price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white/[0.02] border border-zinc-100 rounded-xl">
                                                    <p className="text-[10px] text-zinc-900/30 font-black uppercase tracking-widest mb-1">Transmission Message</p>
                                                    <p className="text-xs text-zinc-600 font-medium leading-relaxed">{offer.message || 'No additional data transmitted.'}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-white border border-zinc-100 flex items-center justify-center overflow-hidden">
                                                        {offer.buyer?.photo_url ? <Image src={offer.buyer.photo_url} alt="B" fill className="object-cover" /> : <User className="h-4 w-4 text-zinc-900/20" />}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900/70">Buyer: {offer.buyer?.display_name}</span>
                                                </div>
                                            </div>
                                            <div className="flex md:flex-col justify-end gap-3 shrink-0">
                                                {offer.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            onClick={() => handleOfferAction(offer, 'accept')}
                                                            disabled={processingOffer === offer.id}
                                                            className="flex-1 md:w-32 h-12 bg-[#FF6200] text-black font-black uppercase tracking-widest text-[10px] hover:bg-[#FF7A29]"
                                                        >
                                                            {processingOffer === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleOfferAction(offer, 'reject')}
                                                            disabled={processingOffer === offer.id}
                                                            variant="outline"
                                                            className="flex-1 md:w-32 h-12 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-white font-black uppercase tracking-widest text-[10px]"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    onClick={async () => {
                                                        const conversationId = await startConversation(user!.id, offer.buyer_id, offer.listing_id);
                                                        router.push(`/chats/${conversationId}`);
                                                    }}
                                                    variant="ghost"
                                                    className="flex-1 md:w-32 h-12 text-zinc-500 hover:text-zinc-900 font-black uppercase tracking-widest text-[10px] gap-2"
                                                >
                                                    <MessageCircle className="h-4 w-4" /> Message
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="rewards" className="divide-y divide-white/5 focus-visible:outline-none focus:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* MarketCoins Card */}
                                <div className="p-10 rounded-[3rem] border border-zinc-100 bg-white/[0.02] flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center">
                                                <Zap className="h-6 w-6 text-[#FF6200]" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">MarketCoins</h3>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Digital Loyalty System</p>
                                            </div>
                                        </div>

                                        <div className="py-8 border-y border-zinc-100">
                                            <p className="text-[10px] font-black uppercase text-zinc-900/30 tracking-[0.3em] mb-2 font-heading">Active Balance</p>
                                            <div className="flex items-baseline gap-2 font-heading">
                                                <span className="text-6xl font-black text-zinc-900 italic tracking-tighter">{(user?.coins_balance || 0).toLocaleString()}</span>
                                                <span className="text-xl font-black text-[#FF6200] italic">MC</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-medium text-zinc-500 italic leading-relaxed">
                                                Earn 1 MC for every ₦200 you sell. Redeem coins for listing promotions, platform perks, or trading discounts.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="border-zinc-200 text-zinc-600 font-black uppercase text-[8px] tracking-widest">1 MC = Reward System</Badge>
                                                <Badge variant="outline" className="border-zinc-200 text-zinc-600 font-black uppercase text-[8px] tracking-widest">Atomic Redemption</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Refer & Earn Card */}
                                <div className="p-10 rounded-[3rem] border border-zinc-100 bg-white/[0.02] space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">Refer & Earn</h3>
                                        <p className="text-zinc-500 text-xs italic">Expand the network and earn 100 MC for every verified referral.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-heading">Your Referral Transmission Code</Label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-[#FAFAFA]/40 border border-zinc-200 rounded-xl px-6 flex items-center h-14 font-mono text-lg font-black text-[#FF6200] tracking-widest">
                                                    {user?.referral_link_code || 'PROTOCOL_PENDING'}
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        const link = `${window.location.origin}/signup?ref=${user?.referral_link_code}`;
                                                        navigator.clipboard.writeText(link);
                                                        toast('Referral link copied to clipboard! 🔗', 'success');
                                                    }}
                                                    className="h-14 px-6 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors"
                                                >
                                                    Copy Link
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white/[0.02] border border-zinc-100 rounded-2xl">
                                            <div className="flex justify-between items-center mb-4 text-zinc-900/30">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Referral Stats</span>
                                                <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Total Invited</p>
                                                    <p className="text-2xl font-black text-zinc-900 italic font-heading">{referralStats.totalInvited}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Coins Earned</p>
                                                    <p className="text-2xl font-black text-[#FF6200] italic font-heading">{referralStats.coinsEarned} MC</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="focus-visible:outline-none focus:outline-none">
                            <div className="max-w-xl space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter font-heading italic">Payout Dashboard</h3>
                                    <p className="text-zinc-500 text-sm italic mb-4">Establishing secure Paystack subaccount for auto-payouts.</p>
                                    <div className="bg-[#FF6200]/5 border border-[#FF6200]/10 p-4 rounded-2xl flex items-start gap-4 mb-8">
                                        <Zap className="h-5 w-5 text-[#FF6200] shrink-0 mt-1" />
                                        <p className="text-[10px] text-[#FF6200] font-black uppercase tracking-widest leading-relaxed">
                                            Beta Feature: Funds are split automatically. You receive the net amount minus platform commission directly to this bank via Paystack settlement.
                                        </p>
                                    </div>
                                </div>
                                <form onSubmit={updateBankDetails} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 font-heading">Select Bank</Label>
                                            <Select
                                                value={bankDetails.bankCode}
                                                onValueChange={(val) => setBankDetails(prev => ({ ...prev, bankCode: val }))}
                                                required
                                            >
                                                <SelectTrigger className="h-14 bg-white border-zinc-200 rounded-xl font-heading text-[10px] font-black uppercase tracking-widest text-left">
                                                    <SelectValue placeholder="CHOOSE INSTITUTION" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-zinc-200 text-zinc-900 font-heading text-[10px] font-black uppercase tracking-widest">
                                                    {banks.map((bank) => (
                                                        <SelectItem key={bank.code} value={bank.code} className="focus:bg-[#FF6200] focus:text-black py-3">
                                                            {bank.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 font-heading">Account Serial</Label>
                                            <div className="relative">
                                                <Input
                                                    value={bankDetails.accountNumber}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                    placeholder="0123456789"
                                                    className="h-14 bg-white border-zinc-200 rounded-xl focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-colors font-mono tracking-widest"
                                                    required
                                                />
                                                {isResolving && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FF6200]" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 font-heading">Entity Name</Label>
                                        <Input
                                            value={bankDetails.accountName}
                                            readOnly
                                            placeholder="AUTO-RESOLVING NAME..."
                                            className="h-14 bg-white/[0.02] border-zinc-200 rounded-xl font-heading text-sm uppercase tracking-widest text-zinc-900 cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={submittingBank || isResolving} className="h-14 px-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest font-heading transition-all whitespace-nowrap shadow-xl shadow-white/5 group">
                                        {submittingBank ? (
                                            <>
                                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                                Syncing System...
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

                <div className="border-t border-zinc-100 pt-8 text-center pb-8">
                    <p className="text-[10px] text-zinc-900/30 font-medium leading-relaxed">
                        Beta platform – technical problems? Email <a href="mailto:support@marketbridge.com.ng?subject=Tech%20Support" className="text-[#FF6200] hover:underline">support@marketbridge.com.ng</a><br />
                        Refunds, subscriptions or seller questions? Email <a href="mailto:ops-support@marketbridge.com.ng?subject=Ops%20Support" className="text-[#FF6200] hover:underline">ops-support@marketbridge.com.ng</a>
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
            pending: 'bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20',
            confirmed: 'bg-zinc-100 text-zinc-600 border-zinc-700',
            completed: 'bg-white text-zinc-900 border-zinc-200',
            cancelled: 'bg-white text-zinc-600 border-zinc-700',
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
        <div className="bg-white border border-zinc-200 shadow-sm p-6 flex flex-col md:flex-row gap-8 group/card transition-all duration-500 hover:border-[#FF6200]/20">
            <div className="flex-1 flex gap-6 italic">
                {order.listing?.images?.[0] ? (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white group-hover/card:border-[#FF6200]/20 transition-all">
                        <Image src={order.listing.images[0]} alt={order.listing.title} fill className="object-cover group-hover/card:scale-110 transition-transform duration-700" />
                    </div>
                ) : (
                    <div className="h-24 w-24 shrink-0 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-zinc-900/20" />
                    </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-900/30 uppercase tracking-widest font-heading">Ref: #{order.id.slice(-8).toUpperCase()}</span>
                        {getStatusBadge(order.status)}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter truncate font-heading">{order.listing?.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-900/20 underline">buyer:</span> <span className="text-zinc-900/70 font-bold">{order.buyer?.display_name}</span></span>
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-900/20 underline">value:</span> <span className="text-[#FF6200] font-black">₦{order.amount.toLocaleString()}</span></span>
                        <span className="flex items-center gap-1.5 lowercase font-medium italic"><span className="text-zinc-900/20 underline">date:</span> <span>{new Date(order.created_at).toLocaleDateString()}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex md:flex-col justify-end gap-3 shrink-0">
                <Button variant="outline" onClick={() => onOpenChat(order)} className="flex-1 md:w-40 h-12 rounded-xl bg-white border-zinc-200 hover:border-[#FF6200]/30 hover:bg-white text-zinc-900 font-black uppercase tracking-widest text-[10px] gap-2 font-heading transition-all">
                    <MessageCircle className="h-4 w-4" /> Message Buyer
                </Button>

                {order.status === 'pending' && (
                    <Select onValueChange={(value: string) => onUpdateStatus(order.id, value as 'pending' | 'confirmed' | 'completed' | 'cancelled')} disabled={isUpdating}>
                        <SelectTrigger className="flex-1 md:w-40 h-12 rounded-xl bg-[#FF6200] border-none text-black font-black uppercase tracking-widest text-[10px] font-heading shadow-lg shadow-[#FF6200]/10 hover:bg-[#FF7A29] transition-all">
                            <SelectValue placeholder="Dispatch" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200 text-zinc-900 font-heading text-[10px] uppercase font-black tracking-widest">
                            <SelectItem value="confirmed" className="focus:bg-[#FF6200] focus:text-black">Mark Shipped</SelectItem>
                            <SelectItem value="cancelled" className="focus:bg-zinc-100 focus:text-zinc-900 text-[#FF6200]">Cancel Order</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
}
