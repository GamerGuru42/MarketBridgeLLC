'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { LaunchCountdown } from '@/components/LaunchCountdown';

export default function HomePage() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user && ['student_seller', 'seller', 'dealer'].includes(user.role)) {
            window.location.assign('/seller/dashboard');
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (user) {
        if (['student_seller', 'seller', 'dealer'].includes(user.role)) {
            // Sellers have their own distinct Premium Command Center (handling redirect via useEffect)
            return (
                <div className="flex h-screen items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Redirecting...</p>
                    </div>
                </div>
            );
        }
        return <AuthenticatedHome user={user} />;
    }

    // Default entry for the Genesis Countdown phase
    return (
        <main className="min-h-screen w-full">
            <LaunchCountdown />
        </main>
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
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Welcome Back</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                            Welcome, <br />
                            <span className="text-primary">{firstName}</span>.
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm md:text-lg leading-relaxed max-w-sm italic">
                            Your campus marketplace is ready.
                        </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 md:text-right">
                        <div className="flex items-center gap-4 px-5 md:px-8 py-4 md:py-5 bg-card border border-border rounded-2xl md:rounded-[2.5rem] shadow-sm hover:border-primary/20 transition-colors w-full md:w-auto">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Wallet Balance</p>
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
                                <h2 className="text-xl font-black uppercase tracking-widest italic leading-none">Recommended</h2>
                            </div>
                            <Link href="/marketplace" className="text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-all flex items-center gap-2">
                                See All <ArrowRight className="h-3 w-3" />
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
                                    <p className="text-xs font-black uppercase tracking-[0.3em] italic text-muted-foreground">No listings yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Identity Sync */}
                    <div className="lg:col-span-4 space-y-6 md:space-y-12">
                        <div className="flex items-center gap-3 border-b border-border/50 pb-6">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-black uppercase tracking-widest italic leading-none">Profile</h2>
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
                                    My Account <ChevronRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </Card>

                        {/* Quick Context Alerts */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Activity</span>
                                <Badge className="bg-primary text-white text-[8px] font-black rounded-full px-2">Live</Badge>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-3xl opacity-30 hover:opacity-100 transition-all cursor-not-allowed group">
                                <div className="flex items-center gap-4">
                                    <Clock className="h-4 w-4 text-primary group-hover:animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground">No recent activity</p>
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
