'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, ShieldCheck, Zap, Globe, Star, Clock, CheckCircle2, Heart, Pizza, BookOpen, Smartphone, Shirt, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [recentListings, setRecentListings] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchRecent = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('listings')
                .select(`
                    id, title, price, description, category, created_at,
                    dealer:users!listings_dealer_id_fkey(display_name)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                setRecentListings(data);
            }
        };
        fetchRecent();
    }, []);

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            // For both signup and login, if they use Google they become buyers by default unless they change it later or have a matching seller profile.
            // As per instructions, "google signup are meant to be there for signup for buyers and google login for buyers"
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=/listings`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF6200] selection:text-white overflow-hidden">
            {/* Nav */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full px-6 py-4 md:px-12 md:py-6 flex items-center justify-between absolute top-0 z-50 backdrop-blur-md bg-transparent"
            >
                <Logo size="lg" />
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/login" className="text-white hover:text-[#FF6200] font-bold text-sm tracking-widest uppercase transition-colors">
                        Log In
                    </Link>
                    <Link href="/signup" className="px-6 py-3 bg-[#FF6200] hover:bg-[#FF7A29] text-black rounded-full font-black text-xs tracking-widest uppercase transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,98,0,0.4)]">
                        Sign Up Free
                    </Link>
                </div>
            </motion.header>

            <main className="flex-1 w-full pt-32 lg:pt-0">
                {/* Hero Section */}
                <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 lg:px-20 border-b border-white/5 pb-16 lg:pb-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6200]/15 blur-[120px] rounded-full pointer-events-none" />

                    <div className="z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-12 lg:mt-0">
                        {/* Left Content */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0, x: -40 },
                                visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                            }}
                            className="flex flex-col space-y-8"
                        >
                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,98,0,0.1)]">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]"></span>
                                    </span>
                                    Campus Open Beta
                                </div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter text-white leading-[0.9]">
                                    Your Campus <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6200] to-[#FF8533] italic drop-shadow-[0_0_20px_rgba(255,98,0,0.4)]">
                                        Super App.
                                    </span>
                                </h1>
                            </motion.div>

                            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-lg md:text-xl font-medium text-white/50 leading-relaxed max-w-xl">
                                Buy, sell, and trade safely with verified students. From fresh food delivery to textbooks and side-hustles—it all happens here.
                            </motion.p>

                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/signup"
                                    className="px-8 py-5 bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all hover:scale-105 shadow-[0_10px_40px_rgba(255,98,0,0.4)] flex items-center justify-center gap-3 group"
                                >
                                    Start Buying
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={handleGoogleAuth}
                                    disabled={isLoading}
                                    className="px-8 py-5 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-sm rounded-2xl transition-all hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group cursor-pointer"
                                >
                                    <Globe className="h-5 w-5 text-black" />
                                    Google Sign Up
                                </button>
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="flex items-center gap-6 text-xs font-bold text-white/40 uppercase tracking-widest pt-4">
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#FF6200]" /> Verified Users</span>
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#FF6200]" /> Escrow Protection</span>
                            </motion.div>
                        </motion.div>

                        {/* Right Content - Real Data Floating Cards */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            className="relative h-[550px] hidden lg:block"
                        >
                            {/* Card 1 */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                                className="absolute top-[5%] left-[5%] w-64 glass-card bg-zinc-900/90 border border-white/10 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl z-20"
                            >
                                <div className="w-full h-36 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[#FF6200] opacity-20 blur-[30px]" />
                                    <ShoppingBag className="w-16 h-16 text-[#FF6200] relative z-10" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white uppercase tracking-wider text-sm truncate max-w-[120px]">
                                            {recentListings[0]?.title || 'Nike Dunks'}
                                        </h3>
                                        <span className="font-black text-[#FF6200] bg-[#FF6200]/10 px-2 py-1 rounded-lg">
                                            ₦{recentListings[0]?.price?.toLocaleString() || '45k'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2">
                                        <Clock className="w-3 h-3" />
                                        {recentListings[0]?.created_at ? formatDistanceToNow(new Date(recentListings[0].created_at)) + ' ago' : '2 mins ago'}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2 */}
                            <motion.div
                                animate={{ y: [0, 20, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                                className="absolute top-[45%] right-[-5%] w-72 glass-card bg-zinc-900/90 border border-white/10 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl z-30"
                            >
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF6200] to-yellow-500 flex items-center justify-center p-[2px]">
                                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-sm font-black text-white/80">
                                            {recentListings[1]?.dealer?.display_name?.substring(0, 2).toUpperCase() || 'AK'}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-black text-white text-sm uppercase tracking-wide truncate">
                                            {recentListings[1]?.dealer?.display_name || "Ada's Kitchen"}
                                        </h3>
                                        <div className="flex items-center gap-1 text-[#FF6200] text-[10px] font-bold mt-1 uppercase tracking-widest truncate">
                                            <Star className="w-3 h-3 fill-current flex-shrink-0" /> {recentListings[1]?.category || 'Food & Dining'}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-white/5 rounded-xl p-3 text-sm text-white/70 font-medium italic line-clamp-2">
                                    "{recentListings[1]?.title || 'Jollof rice and chicken, ordering now!'}"
                                </div>
                            </motion.div>

                            {/* Card 3 */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 2 }}
                                className="absolute bottom-[0%] left-[15%] w-60 glass-card bg-[#FF6200] border-none rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(255,98,0,0.4)] z-40 text-black mt-8"
                            >
                                <div className="border border-black/10 rounded-[1.5rem] p-4 mb-4 bg-black/5">
                                    <h3 className="font-black uppercase tracking-tight text-xl mb-1 truncate">
                                        {recentListings[2]?.category || 'Textbook'}
                                    </h3>
                                    <p className="text-black/60 text-[10px] font-black uppercase tracking-widest truncate">
                                        {recentListings[2]?.title || 'MTH 101 - Almost New'}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="font-black text-2xl tracking-tighter truncate max-w-[120px]">
                                        ₦{recentListings[2]?.price?.toLocaleString() || '8.5k'}
                                    </span>
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-black flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-xl">
                                        <ArrowRight className="w-5 h-5 text-[#FF6200]" />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-6 md:px-12 bg-black relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4 italic">Why MarketBridge?</h2>
                            <p className="text-[#FF6200] uppercase tracking-[0.3em] text-[10px] font-black">Zero hassle. Just moves.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div whileHover={{ y: -8, scale: 1.02 }} className="p-10 bg-zinc-950 border border-white/5 rounded-[2.5rem] group transition-all hover:bg-white/[0.04] hover:border-[#FF6200]/50 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6200]/10 rounded-bl-full blur-[40px] transition-all group-hover:bg-[#FF6200]/20" />
                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#FF6200]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,102,0,0.2)]">
                                    <Zap className="h-8 w-8 text-[#FF6200]" />
                                </div>
                                <h3 className="font-black text-2xl text-white mb-4 uppercase tracking-tight italic">Instant Campus Trading</h3>
                                <p className="text-white/50 leading-relaxed font-bold text-sm">No shipping fees or long wait times. Deal directly with people on your campus and get your items the same day.</p>
                            </motion.div>

                            <motion.div whileHover={{ y: -8, scale: 1.02 }} className="p-10 bg-zinc-950 border border-white/5 rounded-[2.5rem] group transition-all hover:bg-white/[0.04] hover:border-[#FF6200]/50 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6200]/10 rounded-bl-full blur-[40px] transition-all group-hover:bg-[#FF6200]/20" />
                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#FF6200]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,102,0,0.2)]">
                                    <ShieldCheck className="h-8 w-8 text-[#FF6200]" />
                                </div>
                                <h3 className="font-black text-2xl text-white mb-4 uppercase tracking-tight italic">100% Verified Students</h3>
                                <p className="text-white/50 leading-relaxed font-bold text-sm">Every seller passes strict identity verification. No scams, no strangers—just genuine campus businesses you can trust.</p>
                            </motion.div>

                            <motion.div whileHover={{ y: -8, scale: 1.02 }} className="p-10 bg-zinc-950 border border-white/5 rounded-[2.5rem] group transition-all hover:bg-white/[0.04] hover:border-[#FF6200]/50 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6200]/10 rounded-bl-full blur-[40px] transition-all group-hover:bg-[#FF6200]/20" />
                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#FF6200]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,102,0,0.2)]">
                                    <Heart className="h-8 w-8 text-[#FF6200]" />
                                </div>
                                <h3 className="font-black text-2xl text-white mb-4 uppercase tracking-tight italic">Support Local Hustle</h3>
                                <p className="text-white/50 leading-relaxed font-bold text-sm">From late-night food vendors to thrifters—spend your money where it matters and help student entrepreneurs grow.</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-24 px-6 md:px-12 bg-[#050505] relative border-t border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2 italic">Campus <span className="text-[#FF6200]">Essentials</span></h2>
                                <p className="text-white/40 font-bold text-sm">Everything you need, 5 minutes away.</p>
                            </div>
                            <Link href="/listings" className="text-[#FF6200] font-black uppercase tracking-widest text-xs hover:text-white transition-colors group flex items-center gap-2 mt-4 md:mt-0">
                                View All Market <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { name: 'Late Night Food', icon: Pizza, color: 'bg-red-500/10 text-red-500' },
                                { name: 'Textbooks', icon: BookOpen, color: 'bg-blue-500/10 text-blue-500' },
                                { name: 'Tech & Gadgets', icon: Smartphone, color: 'bg-purple-500/10 text-purple-500' },
                                { name: 'Drip & Fashion', icon: Shirt, color: 'bg-pink-500/10 text-pink-500' },
                                { name: 'Services & Hustles', icon: Sparkles, color: 'bg-yellow-500/10 text-yellow-500' }
                            ].map((cat, idx) => (
                                <Link href={`/listings?q=${encodeURIComponent(cat.name)}`} key={idx}>
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.05 }}
                                        className="bg-black border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-white/20 transition-all cursor-pointer group h-full"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                                            <cat.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-white font-bold text-[11px] uppercase tracking-widest leading-tight">{cat.name}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="py-32 px-6 md:px-12 bg-black relative overflow-hidden border-t border-white/5">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[400px] bg-[#FF6200]/20 blur-[150px] rounded-full pointer-events-none" />
                    <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-[#FF6200] rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-[0_0_50px_rgba(255,98,0,0.5)]">
                            <Logo size="md" showText={false} className="scale-150 rotate-[-12deg] text-black" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6 italic leading-[0.9]">
                            Stop Waiting. <br /> <span className="text-[#FF6200]">Start Trading.</span>
                        </h2>
                        <p className="text-lg text-white/50 font-medium mb-10 max-w-xl mx-auto">
                            Join thousands of students securely buying and selling on campus right now.
                        </p>
                        <Link
                            href="/signup"
                            className="px-10 py-6 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-lg rounded-full transition-all hover:scale-105 shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center gap-3 group"
                        >
                            Create Free Account <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full bg-[#020202] border-t border-white/5 py-12 px-6 md:px-12 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Logo size="lg" className="mb-6" />
                        <p className="text-white/40 text-[13px] font-bold max-w-md leading-relaxed">
                            The secure, student-only marketplace. We're bridging the gap between campus buyers and student businesses.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 inline-block text-[11px]">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="/listings" className="text-white/50 hover:text-[#FF6200] font-bold text-[13px] transition-colors">Browse Market</Link></li>
                            <li><Link href="/login" className="text-white/50 hover:text-[#FF6200] font-bold text-[13px] transition-colors">Log In</Link></li>
                            <li><Link href="/signup?role=student_seller" className="text-white/50 hover:text-[#FF6200] font-bold text-[13px] transition-colors">Become a Seller</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 inline-block text-[11px]">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/terms" className="text-white/50 hover:text-[#FF6200] font-bold text-[13px] transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-white/50 hover:text-[#FF6200] font-bold text-[13px] transition-colors">Privacy Policy</Link></li>
                            <li><a href="mailto:support@marketbridge.com.ng" className="text-white/50 hover:text-[#FF6200] font-bold text-[13px] transition-colors">Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} MarketBridge LLC. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

