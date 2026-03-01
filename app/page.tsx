'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import {
    ArrowRight, ShoppingBag, ShieldCheck, Zap,
    CheckCircle2, Heart, TrendingUp, Loader2, Clock, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { CATEGORIES } from '@/lib/categories';

interface LiveCategory {
    slug: string;
    count: number;
}

export default function HomePage() {
    const { user, signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [recentListings, setRecentListings] = useState<any[]>([]);
    const [liveCategories, setLiveCategories] = useState<LiveCategory[]>([]);
    const [listingCount, setListingCount] = useState<number | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const fetchData = async () => {
            // Fetch recent listings for hero cards
            const { data: recentData } = await supabase
                .from('listings')
                .select(`id, title, price, category, created_at, images, dealer:users!listings_dealer_id_fkey(display_name)`)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentData && recentData.length > 0) setRecentListings(recentData);

            // Fetch live category counts — only show categories with active listings
            const { data: catData } = await supabase
                .from('listings')
                .select('category')
                .eq('status', 'active');

            if (catData) {
                const counts: Record<string, number> = {};
                catData.forEach((row: { category: string }) => {
                    const slug = (row.category || '').toLowerCase().trim();
                    counts[slug] = (counts[slug] || 0) + 1;
                });
                const sorted = Object.entries(counts)
                    .map(([slug, count]) => ({ slug, count }))
                    .sort((a, b) => b.count - a.count);
                setLiveCategories(sorted);
            }
            // Fetch live listing count
            const { count: lCount } = await supabase
                .from('listings')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active');
            if (lCount !== null) setListingCount(lCount);
        };

        fetchData();
    }, []);

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=/listings`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Merge live DB category counts with our static CATEGORIES metadata
    const displayCategories = (() => {
        if (liveCategories.length === 0) {
            // Fallback: show first 8 from static list while DB loads
            return CATEGORIES.filter(c => c.isActive).slice(0, 8).map(c => ({ ...c, count: 0 }));
        }
        // Map live slugs back to CATEGORIES metadata
        const result: Array<typeof CATEGORIES[0] & { count: number }> = [];
        liveCategories.forEach(({ slug, count }) => {
            const match = CATEGORIES.find(c =>
                c.slug === slug ||
                c.id === slug ||
                c.name.toLowerCase() === slug ||
                slug.includes(c.id.toLowerCase())
            );
            if (match && !result.find(r => r.id === match.id)) {
                result.push({ ...match, count });
            }
        });
        // Append any active static categories with no listings yet (keep ecosystem complete)
        CATEGORIES.filter(c => c.isActive && !result.find(r => r.id === c.id)).forEach(c => {
            result.push({ ...c, count: 0 });
        });
        return result.slice(0, 10);
    })();

    const features = [
        {
            icon: Zap,
            title: 'Instant Campus Trading',
            desc: 'No shipping delays. Deal directly with students on your campus and get your items the same day.',
            accent: 'from-[#FF6200]/25 to-transparent',
            iconBg: 'bg-[#FF6200]/15 border-[#FF6200]/20',
        },
        {
            icon: ShieldCheck,
            title: '100% Verified Students',
            desc: 'Every seller passes strict identity verification. No scams — just genuine campus businesses you can trust.',
            accent: 'from-emerald-500/20 to-transparent',
            iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        },
        {
            icon: Heart,
            title: 'Support Local Hustle',
            desc: 'From late-night food to thrifters — your money stays on campus, helping student entrepreneurs grow.',
            accent: 'from-pink-500/20 to-transparent',
            iconBg: 'bg-pink-500/10 border-pink-500/20',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#080808] text-white selection:bg-[#FF6200] selection:text-black">



            <main className="flex-1 w-full">

                {/* ─── Hero ─── */}
                <section className="relative min-h-[calc(100vh-65px)] flex items-center overflow-hidden px-6 md:px-10 lg:px-16">
                    {/* Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,98,0,0.13),transparent)]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6200]/20 to-transparent" />
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.035] pointer-events-none" />
                    <div className="absolute -bottom-20 right-0 w-[60%] h-[80%] bg-[#FF6200]/[0.035] rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute top-[25%] -left-[10%] w-[40%] h-[50%] bg-indigo-500/[0.025] rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 xl:gap-20 items-center py-16 lg:py-0">

                        {/* Left */}
                        <motion.div
                            initial="hidden" animate="visible"
                            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                            className="flex flex-col space-y-7"
                        >
                            {/* Badge */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/25 text-[#FF6200] text-[11px] font-black uppercase tracking-[0.25em] backdrop-blur-md">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]" />
                                    </span>
                                    Campus Open Beta · Live Now
                                </div>
                            </motion.div>

                            {/* Headline */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                <h1 className="text-[clamp(3.2rem,8.5vw,7rem)] font-black uppercase leading-[0.86] tracking-tighter text-white">
                                    Your Campus<br />
                                    <span className="relative">
                                        <span className="text-[#FF6200] italic drop-shadow-[0_0_50px_rgba(255,98,0,0.45)]">Super App.</span>
                                        <span className="absolute -inset-3 bg-[#FF6200]/8 blur-3xl rounded-full" />
                                    </span>
                                </h1>
                            </motion.div>

                            {/* Subtext */}
                            <motion.p
                                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                className="text-base md:text-[1.1rem] text-white/48 leading-relaxed max-w-lg font-medium"
                            >
                                Buy, sell, and trade safely with verified students. From fresh food delivery to textbooks and side-hustles — it all happens here.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div
                                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                className="flex flex-wrap gap-3 pt-1"
                            >
                                {user ? (
                                    <>
                                        <Link href="/listings" className="flex items-center gap-3 px-7 py-4 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.03] shadow-[0_8px_32px_rgba(255,98,0,0.45)] group">
                                            Explore Assets <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <Link
                                            href={['admin', 'ceo', 'cofounder'].includes(user.role) ? '/admin' : ['dealer', 'student_seller', 'seller'].includes(user.role) ? '/seller/dashboard' : '/settings'}
                                            className="flex items-center gap-3 px-7 py-4 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.03] backdrop-blur-md cursor-pointer"
                                        >
                                            My Dashboard
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/signup" className="flex items-center gap-3 px-7 py-4 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.03] shadow-[0_8px_32px_rgba(255,98,0,0.45)] group">
                                            Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <Link href="/login" className="flex items-center gap-3 px-7 py-4 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.03] backdrop-blur-md cursor-pointer">
                                            Sign In
                                        </Link>
                                    </>
                                )}
                            </motion.div>

                            {/* Trust pills */}
                            <motion.div
                                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.35 } } }}
                                className="flex flex-wrap items-center gap-5 pt-1"
                            >
                                {['Verified Users', 'Escrow Protection', 'Paystack Secured'].map(t => (
                                    <span key={t} className="flex items-center gap-2 text-[11px] font-bold text-white/30 uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4 text-[#FF6200]" /> {t}
                                    </span>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* Right — floating cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                            className="relative h-[500px] hidden lg:block"
                        >
                            <div className="absolute inset-0 bg-[#FF6200]/6 blur-[90px] rounded-full" />

                            {/* Product card */}
                            <motion.div
                                animate={{ y: [0, -18, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                                className="absolute top-[4%] left-[0%] w-[240px] bg-zinc-900/90 border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-xl z-20"
                            >
                                <div className="relative h-32 bg-gradient-to-br from-[#FF6200]/25 to-zinc-800 flex items-center justify-center overflow-hidden">
                                    {recentListings[0]?.images?.[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={recentListings[0].images[0]} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <><div className="absolute inset-0 bg-[#FF6200] opacity-12 blur-2xl" /><ShoppingBag className="w-12 h-12 text-[#FF6200] z-10" /></>
                                    )}
                                    <div className="absolute top-3 left-3 bg-[#FF6200] text-black text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">New</div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-black text-white text-sm uppercase tracking-tight truncate">{recentListings[0]?.title || 'Nike Dunks'}</h3>
                                        <span className="font-black text-[#FF6200] text-sm bg-[#FF6200]/10 px-2 py-0.5 rounded-lg shrink-0">₦{recentListings[0]?.price?.toLocaleString() || '45k'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        {recentListings[0]?.created_at ? formatDistanceToNow(new Date(recentListings[0].created_at)) + ' ago' : '2 mins ago'}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Seller card */}
                            <motion.div
                                animate={{ y: [0, 16, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.8 }}
                                className="absolute top-[38%] right-[-2%] w-[270px] bg-zinc-900/90 border border-white/10 rounded-[2rem] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-xl z-30"
                            >
                                <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-white/[0.07]">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF6200] to-amber-400 flex items-center justify-center text-xs font-black text-black shrink-0">
                                        {recentListings[1]?.dealer?.display_name?.substring(0, 2).toUpperCase() || 'AK'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-black text-white text-sm uppercase tracking-wide truncate">{recentListings[1]?.dealer?.display_name || "Ada's Kitchen"}</h3>
                                        <div className="flex items-center gap-1 text-[#FF6200] text-[10px] font-bold mt-0.5 uppercase tracking-widest">
                                            <Star className="w-3 h-3 fill-current shrink-0" />{recentListings[1]?.category || 'Food & Dining'}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/[0.04] rounded-xl p-3 text-[13px] text-white/55 font-medium italic">
                                    &ldquo;{recentListings[1]?.title || 'Jollof rice and chicken, ordering now!'}&rdquo;
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Active now</span>
                                    <div className="flex -space-x-1">
                                        {[...Array(3)].map((_, i) => <div key={i} className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-900" />)}
                                        <div className="w-5 h-5 rounded-full bg-[#FF6200] border border-zinc-900 flex items-center justify-center text-[7px] font-black text-black">+7</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Price card */}
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 2 }}
                                className="absolute bottom-[2%] left-[12%] w-[210px] bg-[#FF6200] rounded-[2rem] p-5 shadow-[0_20px_60px_rgba(255,98,0,0.5)] z-40"
                            >
                                <div className="bg-black/12 rounded-[1.5rem] p-3 mb-3">
                                    <p className="font-black text-black/50 text-[9px] uppercase tracking-widest mb-0.5">Listed Now</p>
                                    <h3 className="font-black uppercase tracking-tight text-lg text-black truncate">{recentListings[2]?.category || 'Textbook'}</h3>
                                    <p className="text-black/65 text-[10px] font-bold truncate">{recentListings[2]?.title || 'MTH 101 — Almost New'}</p>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <span className="font-black text-2xl tracking-tighter text-black">₦{recentListings[2]?.price?.toLocaleString() || '8.5k'}</span>
                                    <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center shadow-xl shrink-0">
                                        <ArrowRight className="w-4 h-4 text-[#FF6200]" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Live Listings pill */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                                className="absolute top-[14%] right-[4%] bg-black/80 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-xl z-50 flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/25 uppercase font-bold tracking-widest">Live Listings</p>
                                    <p className="text-white font-black text-sm">
                                        {listingCount !== null ? listingCount.toLocaleString() : '—'}
                                    </p>
                                </div>
                            </motion.div>

                        </motion.div>
                    </div>
                </section>

                {/* ─── Features ─── */}
                <section className="py-28 px-6 md:px-10 bg-[#050505] border-t border-white/[0.05] relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/25 to-transparent" />
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <p className="text-[#FF6200] uppercase tracking-[0.35em] text-[10px] font-black mb-4">Why MarketBridge</p>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white italic">
                                Zero Hassle. <span className="text-[#FF6200]">Just Moves.</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {features.map((feat, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="relative p-8 bg-zinc-950 border border-white/[0.06] rounded-[2.5rem] group overflow-hidden transition-all hover:border-[#FF6200]/25"
                                >
                                    <div className={`absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl ${feat.accent} rounded-bl-full blur-[50px] opacity-70 group-hover:opacity-100 transition-opacity`} />
                                    <div className="relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feat.iconBg}`}>
                                            <feat.icon className="h-7 w-7 text-[#FF6200]" />
                                        </div>
                                        <h3 className="font-black text-xl text-white mb-3 uppercase tracking-tight italic">{feat.title}</h3>
                                        <p className="text-white/40 leading-relaxed text-sm font-medium">{feat.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Live Categories ─── */}
                <section className="py-24 px-6 md:px-10 bg-[#080808] border-t border-white/[0.05]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-5">
                            <div>
                                <p className="text-[#FF6200] uppercase tracking-[0.35em] text-[10px] font-black mb-3">Shop by Category</p>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white italic">
                                    Campus <span className="text-[#FF6200]">Essentials</span>
                                </h2>
                                <p className="text-white/30 font-medium text-sm mt-2">
                                    100% live — categories grow as new sellers join.
                                </p>
                            </div>
                            <Link href="/listings" className="flex items-center gap-2 text-[#FF6200] font-black uppercase tracking-widest text-xs hover:text-white transition-colors group shrink-0">
                                Browse Everything <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {displayCategories.map((cat, idx) => (
                                <Link href={`/listings?category=${encodeURIComponent(cat.name)}`} key={cat.id}>
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.04 }}
                                        className="group relative bg-zinc-950 border border-white/[0.06] rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-3.5 hover:border-[#FF6200]/30 transition-all cursor-pointer overflow-hidden"
                                    >
                                        {/* hover glow */}
                                        <div className="absolute inset-0 bg-[#FF6200]/0 group-hover:bg-[#FF6200]/[0.03] transition-colors rounded-3xl" />
                                        <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <cat.icon className={`w-6 h-6 ${cat.color}`} />
                                        </div>
                                        <div>
                                            <span className="block text-white font-bold text-[11px] uppercase tracking-wider leading-tight group-hover:text-[#FF6200] transition-colors">
                                                {cat.name}
                                            </span>
                                            {cat.count > 0 && (
                                                <span className="block text-white/25 text-[10px] font-bold mt-1">
                                                    {cat.count} listing{cat.count !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-12 p-8 bg-gradient-to-r from-[#FF6200]/10 to-transparent border border-[#FF6200]/15 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 uppercase tracking-tighter italic">
                            <div>
                                <p className="text-[#FF6200] uppercase tracking-widest text-[10px] font-black mb-1">Join the Ecosystem</p>
                                <h3 className="text-white font-black text-xl uppercase tracking-tight italic">List your assets on campus</h3>
                            </div>
                            <Link
                                href="/signup"
                                className="flex items-center gap-3 px-7 py-4 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-105 shadow-[0_8px_30px_rgba(255,98,0,0.4)] shrink-0 group"
                            >
                                Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─── Bottom CTA ─── */}
                <section className="py-32 px-6 md:px-10 bg-[#050505] border-t border-white/[0.05] relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF6200]/10 blur-[160px] rounded-full pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/20 to-transparent" />
                    <div className="max-w-3xl mx-auto text-center relative z-10 flex flex-col items-center">
                        <div className="flex flex-col md:flex-row items-center gap-4 justify-center mb-8">
                            <Logo size="xl" />
                            <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase text-center md:text-left">
                                Stop Waiting.<br />
                                <span className="text-[#FF6200] drop-shadow-[0_0_40px_rgba(255,98,0,0.45)]">Start Trading.</span>
                            </h2>
                        </div>
                        <p className="text-lg text-white/38 font-medium mb-10 max-w-md mx-auto leading-relaxed">
                            Join thousands of students securely buying and selling on campus right now.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/signup" className="flex items-center gap-3 px-10 py-5 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-sm rounded-full transition-all hover:scale-105 shadow-[0_10px_40px_rgba(255,98,0,0.4)] group">
                                Create Free Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/login" className="flex items-center gap-3 px-10 py-5 bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-sm rounded-full transition-all hover:scale-105 backdrop-blur-md">
                                Log In
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className="w-full bg-[#030303] border-t border-white/[0.05] py-16 px-6 md:px-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Logo size="md" className="mb-5" />
                        <p className="text-white/30 text-[13px] font-medium max-w-md leading-relaxed">
                            The secure, student-only marketplace. Bridging the gap between campus buyers and student businesses.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white/50 font-black uppercase tracking-[0.25em] mb-6 text-[10px]">Platform</h4>
                        <ul className="space-y-4">
                            {[
                                { href: '/listings', label: 'Browse Market' },
                                { href: '/login', label: 'Log In' },
                                { href: '/signup?role=student_seller', label: 'Become a Seller' },
                            ].map(l => <li key={l.href}><Link href={l.href} className="text-white/35 hover:text-[#FF6200] font-bold text-sm transition-colors">{l.label}</Link></li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white/50 font-black uppercase tracking-[0.25em] mb-6 text-[10px]">Legal</h4>
                        <ul className="space-y-4">
                            {[
                                { href: '/terms', label: 'Terms of Service' },
                                { href: '/privacy', label: 'Privacy Policy' },
                                { href: 'mailto:support@marketbridge.com.ng', label: 'Support', external: true },
                            ].map(l => <li key={l.label}>
                                {l.external
                                    ? <a href={l.href} className="text-white/35 hover:text-[#FF6200] font-bold text-sm transition-colors">{l.label}</a>
                                    : <Link href={l.href} className="text-white/35 hover:text-[#FF6200] font-bold text-sm transition-colors">{l.label}</Link>
                                }
                            </li>)}
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/18 text-[11px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} MarketBridge LLC. All rights reserved.</p>
                    <p className="text-white/15 text-[11px] font-medium">Built for campus. Powered by Paystack.</p>
                </div>
            </footer>
        </div >
    );
}
