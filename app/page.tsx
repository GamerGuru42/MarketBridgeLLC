'use client';

import React from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    ShoppingBag,
    Store,
    MapPin,
    Zap,
    CheckCircle2,
    User,
    Package,
    MessageCircle,
    Wallet,
    PlusCircle,
    TrendingUp,
    Compass,
    Bell,
    ChevronRight,
    Star,
    Clock,
    Heart,
    ShieldCheck,
    AlertCircle,
    Search
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

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
        return <AuthenticatedHome user={user} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-[#FF6200] selection:text-white">
            <Header />
            <main className="flex-1 w-full flex flex-col items-center pt-16">

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
                            Buy and sell fast within your uni. Order fresh food, textbooks, and services from verified students. Zero middlemen. Zero delays.
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link
                                href="/seller-onboard"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03] shadow-[0_8px_30px_rgba(255,98,0,0.3)] group"
                            >
                                START SELLING <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/marketplace"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground border border-zinc-200 dark:border-zinc-700 font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.03]"
                            >
                                Browse Listings
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 pt-6 opacity-70">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                <CheckCircle2 className="w-4 h-4 text-[#FF6200]" /> Verified Users
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Students Only", icon: MapPin, color: "text-foreground", bg: "bg-zinc-100 dark:bg-zinc-900", desc: "Every user passes strict ID verification. Ensure you're trading with real, safe peers." },
                                { title: "Fast Delivery", icon: Zap, color: "text-[#FF6200]", bg: "bg-[#FF6200]/10", desc: "Sellers are in your hostels or faculty. From ordering to eating in minutes, not hours." },
                                { title: "Grow Your Hustle", icon: Store, color: "text-foreground", bg: "bg-zinc-100 dark:bg-zinc-900", desc: "Easily set up a storefront, list products (food, gadgets, fashion), and start taking orders today." }
                            ].map((feat, i) => (
                                <div key={i} className="flex flex-col items-center p-8 bg-background rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
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
                <section className="w-full max-w-5xl mx-auto px-6 py-32">
                    <div className="bg-[#111111] p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
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

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-[#F0F0F0] selection:bg-primary selection:text-white overflow-x-hidden">
            <Header />

            {/* Sidebar-lite Overlay / Side Effects */}
            <div className="fixed top-20 left-6 bottom-6 w-1 space-y-2 hidden xl:flex flex-col items-center pointer-events-none opacity-20">
                <div className="w-1 flex-1 bg-gradient-to-b from-transparent via-primary to-transparent" />
                <div className="text-[10px] font-black uppercase tracking-[1em] rotate-180 [writing-mode:vertical-lr]">MARKETBRIDGE_OS</div>
                <div className="w-1 flex-1 bg-gradient-to-t from-transparent via-primary to-transparent" />
            </div>

            <main className="flex-1 w-full pt-28 px-4 md:px-12 lg:px-20 space-y-16 pb-32 max-w-[1920px] mx-auto">

                {/* ─── Tactical Intelligence Header ─── */}
                <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-12 group">
                    <div className="space-y-6 max-w-2xl relative z-10">
                        <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-[0.3em] text-[10px] py-1.5 px-4 rounded-full flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Uplink Active
                            </Badge>
                            <div className="flex items-center gap-2 text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest italic">
                                <Clock className="h-3 w-3" />
                                Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                <span className="opacity-40">HELLO,</span> <br />
                                <span className="text-primary drop-shadow-[0_0_30px_rgba(255,98,0,0.15)]">{firstName}</span>.
                            </h1>
                        </div>

                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-lg opacity-60 italic animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                            Operational sector <span className="text-white font-bold">AbujaHQ</span> is online. Your marketplace influence is currently <span className="text-primary font-black uppercase text-sm tracking-widest">Active</span>.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4 animate-in fade-in zoom-in-95 duration-500 delay-300">
                            <Link href="/marketplace">
                                <Button className="h-16 px-10 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 border-none group">
                                    Enter Market <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/seller-onboard">
                                <Button variant="outline" className="h-16 px-10 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl backdrop-blur-sm">
                                    Provision Hustle
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats HUD */}
                    <div className="grid grid-cols-2 gap-4 lg:w-[450px] relative animate-in fade-in slide-in-from-right-8 duration-700 delay-400">
                        <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none -z-10" />
                        <Card className="bg-card/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between h-48 hover:border-primary/20 transition-colors group">
                            <Wallet className="h-10 w-10 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Balance</p>
                                <p className="text-3xl font-black italic tracking-tighter">₦{user?.coins_balance?.toLocaleString() || '0'}</p>
                            </div>
                        </Card>
                        <Card className="bg-card/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between h-48 hover:border-primary/20 transition-colors group">
                            <TrendingUp className="h-10 w-10 text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Impact</p>
                                <p className="text-3xl font-black italic tracking-tighter">Level 1</p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ─── Grid Activity & Modules ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Main Feed */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Recommended <span className="text-primary">Ops</span></h2>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 mt-0.5">Scanned Listings Matching Portfolio</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/5">
                                <Button size="sm" variant="ghost" className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary">Hot</Button>
                                <Button size="sm" variant="ghost" className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nearby</Button>
                                <Button size="sm" variant="ghost" className="rounded-full px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">New</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { title: 'Premium Jollof Box', price: '4,500', seller: 'Chef K.', rating: '4.9', category: 'Food' },
                                { title: 'Dorm Desk Lamp LED', price: '8,500', seller: 'HomeGear', rating: '5.0', category: 'Home' },
                                { title: 'Economics 101 Guide', price: '2,500', seller: 'BookWorm', rating: '4.8', category: 'Books' },
                                { title: 'Wireless Pods Gen 2', price: '12,000', seller: 'TechPlug', rating: '4.7', category: 'Gadgets' },
                            ].map((item, i) => (
                                <Card key={i} className="bg-[#0A0A0A] border-white/5 rounded-[3rem] overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 shadow-2xl">
                                    <div className="aspect-[16/10] bg-zinc-900 overflow-hidden relative">
                                        <div className="absolute top-6 left-6 z-10">
                                            <Badge className="bg-black/50 backdrop-blur-md text-[9px] font-black uppercase tracking-widest border-white/10 px-3 py-1">{item.category}</Badge>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                    </div>
                                    <CardContent className="p-10 space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">{item.seller} • Campus A</p>
                                            <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">{item.title}</h4>
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-30">Acquisition Cost</p>
                                                <p className="text-2xl font-black italic tracking-tighter text-white">₦{item.price}</p>
                                            </div>
                                            <Button size="icon" className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-primary hover:text-white border border-white/5 transition-all text-white">
                                                <PlusCircle className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar HUD */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Identity Sector */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Compass className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-black uppercase tracking-widest italic">Identity <span className="text-primary">Node</span></h2>
                            </div>
                            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ShieldCheck className="h-24 w-24 text-primary rotate-12" />
                                </div>

                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24 border-4 border-[#050505] shadow-2xl ring-2 ring-primary">
                                            <AvatarImage src={user?.photoUrl} />
                                            <AvatarFallback className="text-3xl font-black bg-zinc-900 text-primary">{firstName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-green-500 border-4 border-[#050505] rounded-full" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">{user?.displayName}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest rounded-md px-2">
                                                {user?.role?.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] font-black text-muted-foreground opacity-30 italic">#EST-2026</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-2">Acquisitions</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-3xl font-black italic tracking-tighter leading-none">12</p>
                                                <Package className="h-4 w-4 text-primary opacity-40 mb-1" />
                                            </div>
                                        </div>
                                        <div className="bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-2">Intelligence</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-3xl font-black italic tracking-tighter leading-none">05</p>
                                                <MessageCircle className="h-4 w-4 text-primary opacity-40 mb-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <Button className="w-full h-16 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-xs">
                                        Nexus Profile Settings
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Alerts */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-primary" />
                                    <h2 className="text-xl font-black uppercase tracking-widest italic">Signal <span className="text-primary">Logs</span></h2>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">03 NEW</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { icon: Package, text: 'Order #4102 Delivered', time: '12m', color: 'text-primary' },
                                    { icon: MessageCircle, text: 'Signal from Chef K.', time: '1h', color: 'text-blue-500' },
                                    { icon: AlertCircle, text: 'New Market Regulation', time: '4h', color: 'text-yellow-500' },
                                ].map((alert, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-card/20 hover:bg-card/40 border border-white/5 rounded-3xl transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <alert.icon className={`h-4 w-4 ${alert.color}`} />
                                            <p className="text-xs font-black uppercase tracking-tight italic text-zinc-400 group-hover:text-white transition-colors">{alert.text}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-muted-foreground opacity-30">{alert.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Bottom CTA / Quick Access ─── */}
                <div className="pt-10 border-t border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Marketplace', icon: Compass, href: '/marketplace' },
                            { label: 'Support Node', icon: ShieldCheck, href: '/contact' },
                            { label: 'Network FAQ', icon: AlertCircle, href: '/faq' },
                            { label: 'Privacy Protocol', icon: Star, href: '/privacy' },
                        ].map((link, i) => (
                            <Link key={i} href={link.href} className="p-6 rounded-3xl bg-white/5 hover:bg-primary/5 border border-white/5 hover:border-primary/20 transition-all flex flex-col items-center gap-3 text-center group">
                                <link.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full ${className}`} />;
}
