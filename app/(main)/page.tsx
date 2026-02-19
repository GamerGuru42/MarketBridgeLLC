'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Globe, ArrowRight, Sparkles, Zap, Lock, MapPin, Building2, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isAbuja, city, region } = useLocation();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || authLoading) {
        return <HomeSkeleton />;
    }

    const userLocation = city ? `${city}, ${region}` : (region || 'Unknown Sector');

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FF6600] selection:text-black font-manrope">
            <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF6600]/10 blur-[150px] -z-10 animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] -z-10" />

                <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-top-10 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#FF6600]">
                        <Sparkles className="h-3 w-3" />
                        {isAbuja ? 'Abuja Node Active' : 'Nigeria\'s Next-Gen Commerce Protocol'}
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-tight font-heading">
                        Market<span className="text-[#FF6600]">Bridge</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-zinc-400 text-lg md:text-xl font-medium leading-relaxed italic border-x border-white/5 px-8">
                        The hyper-local trade network connecting <span className="text-white font-bold underline decoration-[#FF6600] decoration-2 underline-offset-4">Verified Campus Nodes</span> and the national marketplace.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                        <MapPin className="h-3 w-3" />
                        Current Signal: <span className={cn(isAbuja ? "text-[#00FF85]" : "text-zinc-400")}>{userLocation}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    {/* Campus Card */}
                    <Card
                        onClick={() => router.push('/listings')}
                        className={cn(
                            "group relative border-2 rounded-[3rem] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] shadow-2xl",
                            isAbuja
                                ? "bg-[#FF6600]/5 border-[#FF6600]/40 hover:border-[#FF6600] border-solid"
                                : "bg-zinc-900/40 border-white/5 border-dashed hover:border-white/20"
                        )}
                    >
                        <CardHeader className="p-10 pb-0">
                            <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl",
                                isAbuja ? "bg-[#FF6600] shadow-[#FF6600]/20" : "bg-zinc-800 shadow-black"
                            )}>
                                <Building2 className={cn("h-8 w-8", isAbuja ? "text-black" : "text-zinc-500")} />
                            </div>
                            <CardTitle className={cn(
                                "text-4xl font-black uppercase italic tracking-tighter transition-colors",
                                isAbuja ? "text-white group-hover:text-[#FF6600]" : "text-zinc-500 group-hover:text-white"
                            )}>
                                Campus Marketplace
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-lg font-medium italic mt-2">
                                (University Community)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <p className="text-zinc-500 leading-relaxed font-bold uppercase text-xs tracking-widest">
                                {isAbuja
                                    ? "Buy, sell & trade safely within Abuja universities – open to all verified students, staff, and alumni."
                                    : "Live in Abuja. Browse current listings or teleport into the FCT hub to see what's happening."
                                }
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-2 text-center">
                                    <ShieldCheck className={cn("h-5 w-5", isAbuja ? "text-[#FF6600]" : "text-zinc-600")} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Verified Node</span>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-2 text-center">
                                    <MapPin className={cn("h-5 w-5", isAbuja ? "text-[#FF6600]" : "text-zinc-600")} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Hyper-Local</span>
                                </div>
                            </div>

                            <Button className={cn(
                                "w-full h-16 font-black uppercase tracking-[0.25em] rounded-2xl text-xs transition-all shadow-xl flex items-center justify-center gap-2",
                                isAbuja
                                    ? "bg-[#FF6600] text-black hover:bg-[#FF8533] shadow-[#FF6600]/20 group-hover:gap-4"
                                    : "bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                            )}>
                                {isAbuja ? 'Initializing Terminal' : 'Access Node'} <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                        {/* Status Pin */}
                        <div className={cn(
                            "absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full border",
                            isAbuja
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-zinc-800 border-white/5"
                        )}>
                            {isAbuja && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                isAbuja ? "text-emerald-500" : "text-zinc-500"
                            )}>
                                {isAbuja ? 'Live Beta' : 'Pilot Restricted'}
                            </span>
                        </div>
                    </Card>

                    {/* Public Card */}
                    <Card
                        onClick={() => router.push('/public')}
                        className="group relative bg-zinc-900/50 border-white/5 rounded-[3rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                        <CardHeader className="p-10 pb-0">
                            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:border-[#FF6600]/50 transition-all">
                                <Globe className="h-8 w-8 text-zinc-600 group-hover:text-blue-400" />
                            </div>
                            <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-zinc-400 group-hover:text-white transition-colors">
                                Public Marketplace
                            </CardTitle>
                            <CardDescription className="text-zinc-600 text-lg font-medium italic mt-2">
                                (Open to All Nigerians)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <p className="text-zinc-600 leading-relaxed font-bold uppercase text-xs tracking-widest">
                                The broad-spectrum exchange for all Nigerians. Buy & sell anything nationwide with Bridge-Escrow security.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-2 text-center opacity-40">
                                    <Smartphone className="h-5 w-5 text-zinc-500" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">OTP Secure</span>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-2 text-center opacity-40">
                                    <Zap className="h-5 w-5 text-zinc-500" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Fast Trade</span>
                                </div>
                            </div>

                            <Button className="w-full h-16 bg-white/5 text-zinc-600 group-hover:text-white group-hover:bg-blue-500/10 font-black uppercase tracking-[0.25em] rounded-2xl text-xs border border-white/10 flex items-center justify-center gap-2 transition-all">
                                Launching Protocol <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                        {/* Status Pin */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-white/5">
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">Phase 2</span>
                        </div>
                    </Card>
                </div>

                {/* Technical & Community Matrix */}
                <div className="mt-32 space-y-12">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 font-heading shrink-0 italic">Secure Support Matrix</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-[#FF6600]/5 to-transparent space-y-6">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter font-heading text-white">Technical <span className="text-[#FF6600]">Terminal</span></h3>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                                Encountering protocol errors or payout delays? Direct uplink for merchant synchronization and asset ledger issues.
                            </p>
                            <Button asChild variant="outline" className="h-14 w-full border-[#FF6600]/20 text-[#FF6600] font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#FF6600] hover:text-black transition-all">
                                <a href="mailto:support@marketbridge.com.ng">Open Tech Ticket</a>
                            </Button>
                        </div>

                        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent space-y-6">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter font-heading text-white">Community <span className="text-blue-400">Resolution</span></h3>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                                Report anomalies, scammers, or bad actors. Our enforcement node ensures the integrity of the Bridge exchange.
                            </p>
                            <Button asChild variant="outline" className="h-14 w-full border-blue-500/20 text-blue-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-400 hover:text-black transition-all">
                                <a href="mailto:safety@marketbridge.com.ng">Contact Integrity Node</a>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Additional Stats / Trust Area */}
                <div className="mt-40 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-20">
                    {[
                        { label: 'Platform Security', value: 'Bridge-Escrow v2', sub: 'Active' },
                        { label: 'Commission Rate', value: '5.3%', sub: 'Fixed' },
                        { label: 'Seller Entry', value: '₦1,000/mo', sub: 'Beta Rate' },
                        { label: 'MarketCoins', value: 'Earn/Redeem', sub: 'Rewards Active' }
                    ].map((stat, i) => (
                        <div key={i} className="text-center md:text-left space-y-1">
                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest font-heading">{stat.label}</p>
                            <p className="text-lg md:text-xl font-black italic uppercase text-white tracking-widest font-heading">{stat.value}</p>
                            <p className="text-[10px] font-black uppercase text-[#FF6600] tracking-widest font-heading">{stat.sub}</p>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 space-y-8">
            <Skeleton className="h-12 w-48 bg-zinc-900 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
                <Skeleton className="h-[500px] w-full bg-zinc-900 rounded-[3rem]" />
                <Skeleton className="h-[500px] w-full bg-zinc-900 rounded-[3rem]" />
            </div>
        </div>
    );
}
