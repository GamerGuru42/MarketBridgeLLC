'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    ShoppingBag,
    Store,
    MapPin,
    Zap,
    CheckCircle2,
    MessageCircle,
    Wallet,
    PlusCircle,
    Compass,
    ChevronRight,
    Star,
    Clock,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function HomePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Syncing Network...</p>
                </div>
            </div>
        );
    }

    if (user) {
        if (['student_seller', 'seller', 'dealer'].includes(user.role)) {
            // Sellers have their own distinct Premium Command Center
            typeof window !== 'undefined' && window.location.assign('/seller/dashboard');
            return (
                <div className="flex h-screen items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Routing to Seller Command Center...</p>
                    </div>
                </div>
            )
        }
        return <AuthenticatedHome user={user} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-[#FF6200] selection:text-white overflow-x-hidden">
            <Header />
            <main className="flex-1 w-full max-w-[100vw] flex flex-col items-center pt-16 overflow-x-hidden">

                {/* ─── Hero Section ─── */}
                <section className="w-full max-w-6xl mx-auto px-6 md:px-10 lg:px-16 pt-24 pb-32 flex flex-col md:flex-row items-center gap-12 lg:gap-24 relative">
                    <div className="flex-1 flex flex-col space-y-8 z-10 relative">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[12px] font-bold tracking-widest text-[#FF6200] uppercase">Live in Abuja</span>
                        </div>
                        <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
                            Abuja's Trusted<br />
                            Campus<br />
                            <span className="text-[#FF6200]">Marketplace.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-600 font-medium max-w-lg leading-relaxed">
                            Buy from any campus safely. Order fresh food, textbooks, and services from verified student sellers. Zero middlemen. Zero delays.
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link
                                href="/marketplace"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-wider text-base rounded-2xl transition-all hover:scale-[1.03] shadow-[0_8px_30px_rgba(255,98,0,0.3)] group"
                            >
                                Enter Campus Marketplace <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/seller-onboard"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground border border-zinc-200 dark:border-zinc-700 font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03]"
                            >
                                <Store className="h-4 w-4" /> Start Selling
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 pt-6 opacity-70">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" /> Verified Sellers
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" /> Secure Payments
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative h-[500px] lg:h-[600px] flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-500">
                        {/* Soft Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#FF6200]/10 dark:bg-[#FF6200]/20 rounded-full blur-[100px] pointer-events-none" />

                        {/* Phone Mockup Frame */}
                        <div className="relative z-10 w-[280px] h-[560px] bg-zinc-50 dark:bg-zinc-950 border-[8px] border-zinc-200 dark:border-zinc-800 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col items-center">
                            {/* Notch */}
                            <div className="absolute top-0 w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-b-2xl z-20" />

                            <div className="flex-1 w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-4 pt-12 space-y-4">
                                {/* Simulated App Header */}
                                <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 mt-2" />

                                {/* Food Card inside Phone */}
                                <div className="bg-white dark:bg-black p-4 rounded-[1.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800/50 w-full hover:-translate-y-1 transition-transform cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-[#FF6200]/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <ShoppingBag className="w-6 h-6 text-[#FF6200]" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Delivering</p>
                                            <h4 className="font-bold text-foreground text-sm leading-tight">Jollof & Chicken</h4>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                                        <p className="text-[#FF6200] font-black">₦3,500</p>
                                        <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Service Card inside Phone */}
                                <div className="bg-white dark:bg-black p-4 rounded-[1.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800/50 w-full hover:-translate-y-1 transition-transform cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                                            <Store className="w-6 h-6 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Fixed Cost</p>
                                            <h4 className="font-bold text-foreground text-sm leading-tight">MacBook Repair</h4>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                                        <p className="text-zinc-500 font-bold text-xs truncate">Campus A</p>
                                        <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <div className="absolute right-0 bottom-24 z-20 bg-[#111111] dark:bg-zinc-800 text-white dark:text-zinc-100 px-6 py-4 rounded-3xl shadow-2xl rotate-[4deg] animate-float border border-white/10 dark:border-white/5 hidden sm:block">
                            <div className="flex items-center gap-3">
                                <Zap className="w-6 h-6 text-[#FF6200]" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">ETA To Hostel</p>
                                    <p className="font-black text-xl leading-none mt-0.5">15 Mins</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-4 top-40 z-20 bg-white dark:bg-zinc-900 text-foreground px-5 py-3.5 rounded-2xl shadow-xl -rotate-[5deg] animate-float [animation-delay:1s] border border-zinc-100 dark:border-zinc-800 hidden sm:flex items-center gap-2.5">
                            <div className="h-6 w-6 rounded-full bg-[#FF6200]/10 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" />
                            </div>
                            <p className="font-black text-sm tracking-tight text-zinc-800 dark:text-zinc-200">Verified Seller</p>
                        </div>
                    </div>
                </section>

                {/* ─── Why MarketBridge ─── */}
                <section className="w-full bg-card border-y border-zinc-100 dark:border-zinc-900 py-24">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 text-center">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-16">
                            How it works on <span className="text-[#FF6200]">campus</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {[
                                { title: "Verified Student Sellers", icon: MapPin, color: "text-foreground", bg: "bg-zinc-100 dark:bg-zinc-900", desc: "Every seller passes strict ID verification. Ensure you're trading with real, safe peers." },
                                { title: "Fast Delivery", icon: Zap, color: "text-[#FF6200]", bg: "bg-[#FF6200]/10", desc: "Sellers are in your hostels or faculty. From ordering to eating in minutes, not hours." },
                                { title: "Grow Your Hustle", icon: Store, color: "text-foreground", bg: "bg-zinc-100 dark:bg-zinc-900", desc: "Easily set up a storefront, list products (food, gadgets, fashion), and start taking orders today." }
                            ].map((feat, i) => (
                                <div key={i} className="flex flex-col items-center p-6 md:p-8 bg-background rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                                    <div className={`w-20 h-20 rounded-3xl ${feat.bg} flex items-center justify-center mb-6`}>
                                        <feat.icon className={`w-10 h-10 ${feat.color}`} />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-3">{feat.title}</h3>
                                    <p className="text-zinc-600 font-medium leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Open Access CTA ─── */}
                <section className="w-full max-w-5xl mx-auto px-4 md:px-6 py-20 md:py-32">
                    <div className="bg-[#111111] p-8 md:p-20 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6200]/20 rounded-full blur-[80px]" />
                        <div className="relative z-10 flex-1 flex flex-col items-start text-left">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">
                                Join The <span className="text-[#FF6200]">Community.</span>
                            </h2>
                            <p className="text-white/60 font-medium text-lg max-w-xl mb-10">
                                Experience a vibrant marketplace for all your campus needs. Open for browsing and buying immediately—no waitlist, no delays.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <Link
                                    href="/signup"
                                    className="px-8 py-4 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.03] flex items-center justify-center shrink-0"
                                >
                                    Sign Up Now
                                </Link>
                                <Link
                                    href="/marketplace"
                                    className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold uppercase tracking-widest text-sm transition-all hover:scale-[1.03] flex items-center justify-center shrink-0"
                                >
                                    Browse Marketplace
                                </Link>
                            </div>
                        </div>

                        <div className="relative z-10 hidden md:flex flex-col items-center bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
                            <div className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
                                <QRCode
                                    value="https://marketbridge.com.ng/seller-onboard"
                                    size={120}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 120 120`}
                                />
                            </div>
                            <p className="text-white font-black uppercase tracking-widest text-xs">Scan to Sell Fast</p>
                            <p className="text-[#FF6200] text-[10px] uppercase font-bold tracking-widest mt-1">Opens Seller Form</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function AuthenticatedHome({ user }: { user: any }) {
    const firstName = user?.displayName?.split(' ')?.[0] || 'User';
    const [listings, setListings] = useState<any[]>([]);
    const [stats, setStats] = useState({ orders: 0, hustles: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPersonalSync() {
            try {
                // Fetch real listings from Supabase for recommendations
                const { data: listData } = await supabase
                    .from('listings')
                    .select('*, dealer:users(id, display_name, is_verified)')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(4);

                setListings(listData || []);

                // Fetch real stats for the user
                const [ordersCount, listingsCount] = await Promise.all([
                    supabase.from('orders').select('*', { count: 'exact', head: true }).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
                    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('dealer_id', user.id)
                ]);

                setStats({
                    orders: ordersCount.count || 0,
                    hustles: listingsCount.count || 0
                });

            } catch (err) {
                console.error('Personal sync error:', err);
            } finally {
                setLoading(false);
            }
        }
        if (user?.id) fetchPersonalSync();
    }, [user.id]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-all duration-300 selection:bg-primary selection:text-white overflow-x-hidden">
            <Header />

            <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden pt-20 md:pt-28 px-4 md:px-12 lg:px-24 space-y-10 md:space-y-20 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">

                {/* ─── Simplified Hero / Context HUD ─── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 pt-2 md:pt-4">
                    <div className="space-y-2 md:space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Identity Link Active</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                            Welcome, <br />
                            <span className="text-primary">{firstName}</span>.
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm md:text-lg leading-relaxed max-w-sm italic">
                            Your secure campus command is active.
                        </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 md:text-right">
                        <div className="flex items-center gap-4 px-5 md:px-8 py-4 md:py-5 bg-card border border-border rounded-2xl md:rounded-[2.5rem] shadow-sm hover:border-primary/20 transition-colors w-full md:w-auto">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Nexus Balance</p>
                                <p className="text-2xl md:text-3xl font-black italic tracking-tighter text-foreground">₦{user?.coins_balance?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 flex items-center justify-center ml-auto">
                                <Wallet className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Streamlined Action Nodes ─── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 px-0 md:px-2">
                    {[
                        { label: 'Market', icon: ShoppingBag, color: 'text-blue-500', href: '/marketplace' },
                        { label: 'Sell', icon: PlusCircle, color: 'text-primary', href: '/seller-onboard' },
                        { label: 'Orders', icon: Compass, color: 'text-zinc-500', href: '/orders' },
                        { label: 'Chats', icon: MessageCircle, color: 'text-green-500', href: '/messages' },
                    ].map((btn, i) => (
                        <Link key={i} href={btn.href} className="flex-1">
                            <Button variant="outline" className="w-full h-12 md:h-16 rounded-xl md:rounded-2xl border-border bg-card/60 hover:bg-card hover:border-primary/30 hover:scale-[1.02] transition-all flex items-center gap-2 md:gap-3 px-3 md:px-6 shadow-md group">
                                <btn.icon className={`h-4 w-4 md:h-5 md:w-5 ${btn.color} group-hover:scale-110 transition-transform`} />
                                <span className="font-black uppercase tracking-wider md:tracking-widest text-[9px] md:text-[11px] italic text-foreground">{btn.label}</span>
                            </Button>
                        </Link>
                    ))}
                </div>

                {/* ─── Decongested Content Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">

                    {/* Live Ops (Real Data Recommendations) */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-12">
                        <div className="flex items-center justify-between border-b border-border/50 pb-6">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-black uppercase tracking-widest italic leading-none">Live Ops</h2>
                            </div>
                            <Link href="/marketplace" className="text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-all flex items-center gap-2">
                                Scanned Index <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-64 bg-muted animate-pulse rounded-[2.5rem]" />
                                ))
                            ) : listings.length > 0 ? (
                                listings.map((item) => (
                                    <Link key={item.id} href={`/listings/${item.id}`}>
                                        <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl flex flex-col h-full bg-gradient-to-br from-card to-muted/5">
                                            <div className="aspect-[16/10] bg-muted relative overflow-hidden border-b border-border">
                                                {item.images?.[0] ? (
                                                    <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full opacity-10"><Store className="h-16 w-16" /></div>
                                                )}
                                                <Badge className="absolute top-6 left-6 bg-black/60 backdrop-blur-lg text-[8px] font-black uppercase border-white/10 px-3 py-1.5">{item.category}</Badge>
                                            </div>
                                            <div className="p-4 md:p-8 space-y-3 md:space-y-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 italic">{item.dealer?.display_name || 'Verified Seller'}</p>
                                                        {item.dealer?.is_verified && <ShieldCheck className="h-3 w-3 text-primary" />}
                                                    </div>
                                                    <h4 className="text-base md:text-xl font-black italic tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                                                </div>
                                                <div className="flex items-center justify-between pt-4">
                                                    <p className="text-xl md:text-2xl font-black italic tracking-tighter text-foreground leading-none">₦{item.price.toLocaleString()}</p>
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                        <ArrowRight className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-muted/20 border border-dashed border-border rounded-[3rem] opacity-40">
                                    <ShoppingBag className="h-16 w-16 mb-4 text-muted-foreground" />
                                    <p className="text-xs font-black uppercase tracking-[0.3em] italic text-muted-foreground">Market Node Idle.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Identity Sync */}
                    <div className="lg:col-span-4 space-y-6 md:space-y-12">
                        <div className="flex items-center gap-3 border-b border-border/50 pb-6">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-black uppercase tracking-widest italic leading-none">Sync</h2>
                        </div>

                        <Card className="bg-muted/40 border border-border rounded-2xl md:rounded-[3rem] p-6 md:p-10 flex flex-col items-center text-center space-y-5 md:space-y-8 shadow-sm">
                            <div className="relative group/avatar">
                                <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-card shadow-2xl transition-transform group-hover/avatar:scale-105 duration-500">
                                    <AvatarImage src={user?.photoUrl} />
                                    <AvatarFallback className="text-2xl md:text-4xl font-black bg-zinc-900 text-primary">{firstName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-card rounded-full shadow-lg" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-foreground leading-none">{user?.displayName}</h3>
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-[0.2em] rounded-md px-3 py-1">{user?.role?.replace('_', ' ')}</Badge>
                            </div>

                            <div className="w-full flex items-center justify-around py-2">
                                <div className="text-center group/stat">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-1 group-hover/stat:text-primary transition-colors">Orders</p>
                                    <p className="text-3xl font-black italic tracking-tighter text-foreground">{stats.orders}</p>
                                </div>
                                <div className="h-10 w-[1px] bg-border/50" />
                                <div className="text-center group/stat">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-1 group-hover/stat:text-primary transition-colors">Hustles</p>
                                    <p className="text-3xl font-black italic tracking-tighter text-foreground">{stats.hustles}</p>
                                </div>
                            </div>

                            <Link href="/settings" className="w-full">
                                <Button variant="outline" className="w-full h-14 rounded-2xl border-border bg-card/40 hover:border-primary font-black uppercase text-[10px] tracking-[0.2em] transition-all group/btn shadow-sm">
                                    Nexus Registry <ChevronRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </Card>

                        {/* Quick Context Alerts */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Context Logs</span>
                                <Badge className="bg-primary text-white text-[8px] font-black rounded-full px-2">Live</Badge>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-3xl opacity-30 hover:opacity-100 transition-all cursor-not-allowed group">
                                <div className="flex items-center gap-4">
                                    <Clock className="h-4 w-4 text-primary group-hover:animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground">Scanning Network Signals...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}
