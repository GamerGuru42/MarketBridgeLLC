'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/ToastContext';
import { 
    Crown, 
    Sparkles, 
    Zap, 
    ShieldCheck, 
    Users, 
    Target, 
    TrendingUp, 
    CheckCircle,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AmbassadorPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [campus, setCampus] = useState('');
    const [motivation, setMotivation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        if (user) {
            checkApplicationStatus();
        }
    }, [user]);

    const checkApplicationStatus = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('ambassador_applications')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (data) setHasApplied(true);
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            router.push('/login?redirect=/ambassador');
            return;
        }

        // Must be a verified seller
        if (user.role !== 'seller') {
            toast('You must be a verified seller to apply for the Lead program.', 'error');
            router.push('/seller/onboard');
            return;
        }

        if (!campus || !motivation) {
            toast('Please fill in all mission fields.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('ambassador_applications')
                .insert({
                    user_id: user.id,
                    campus,
                    motivation,
                    status: 'pending'
                });

            if (error) throw error;

            toast('Mission data transmitted. Our HQ team will vet your terminal.', 'success');
            setHasApplied(true);
        } catch (err: any) {
            toast(err.message || 'Transmission failed.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-[#FF6200] selection:text-black">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden border-b border-zinc-200 dark:border-white/5">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 dark:opacity-[0.03] pointer-events-none" />
                <div className="absolute -top-24 -right-24 h-96 w-96 bg-[#FF6200]/10 blur-[120px] rounded-full animate-pulse" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl space-y-8"
                    >
                        <div className="flex items-center gap-3">
                            <span className="h-0.5 w-12 bg-[#FF6200]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6200] font-heading">The vanguard initiative</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] font-heading">
                            Own Your Campus. <br />
                            <span className="text-[#FF6200]">Lead the Bridge.</span>
                        </h1>
                        <p className="text-xl text-zinc-500 dark:text-white/40 font-medium italic max-w-xl">
                            MarketBridge is a student-first movement. We're looking for campus leaders to scale the bridge at Baze, Nile, Veritas, and Cosmopolitan. 
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-32 border-b border-zinc-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10 order-2 lg:order-1">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-heading">The Mission Profile</h2>
                            <p className="text-lg text-zinc-500 dark:text-white/40 leading-relaxed font-medium">
                                We're solving campus scams and payment unreliability through a native escrow network. 
                                As a Lead, you are the face of trust on your campus. Your mission is to recruit the best student merchants, 
                                facilitate safe trades, and grow the MarketBridge ecosystem within your university node.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { title: "Exclusive Access", desc: "Direct uplink to HQ operations.", icon: Target },
                                { title: "Node Authority", desc: "Manage your campus marketplace flow.", icon: ShieldCheck },
                                { title: "Network Growth", desc: "Earn rewards for every new verified user.", icon: Users },
                                { title: "Executive Status", desc: "Professional recognition for your future.", icon: TrendingUp },
                            ].map((mission, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FF6200] group-hover:text-black transition-colors">
                                        <mission.icon className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black uppercase tracking-widest">{mission.title}</h4>
                                        <p className="text-[11px] text-zinc-400 font-medium">{mission.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative order-1 lg:order-2">
                        <div className="aspect-square rounded-[3rem] bg-zinc-100 dark:bg-white/5 overflow-hidden border border-zinc-200 dark:border-white/10 p-2">
                             <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-[#FF6200]/20 to-transparent flex items-center justify-center">
                                <Crown className="h-48 w-48 text-[#FF6200] opacity-20 rotate-12" />
                             </div>
                        </div>
                        {/* Status Card Overlay */}
                        <div className="absolute -bottom-10 -left-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl max-w-xs space-y-4">
                             <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full bg-[#FF6200] flex items-center justify-center text-black">
                                     <Zap className="h-5 w-5" />
                                 </div>
                                 <span className="text-xs font-black uppercase tracking-widest">Active Operative</span>
                             </div>
                             <p className="text-[10px] text-zinc-500 italic">"The Lead program turned my campus hustle into a local empire." - Nile Lead</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Perks Section */}
            <section className="py-32 bg-zinc-50 dark:bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-20">
                         <h2 className="text-5xl font-black uppercase tracking-tighter italic font-heading">Lead Rewards</h2>
                         <p className="text-zinc-500 dark:text-white/40 font-medium tracking-widest uppercase text-[10px]">What you get for owning your campus</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { 
                                title: "Ambassador Badge", 
                                perk: "Verification Status", 
                                desc: "Gain a unique badge on your profile that signals authority and high trust to all campus buyers.", 
                                icon: Sparkles,
                                val: "ELITE STATUS"
                            },
                            { 
                                title: "44 Days Free Pro", 
                                perk: "Subscription Boost", 
                                desc: "Unlock unlimited listings, advanced analytics, and priority placement in the market for 44 days.", 
                                icon: Crown,
                                val: "WORTH ₦5,200"
                            },
                            { 
                                title: "500 MarketCoins", 
                                perk: "Joining Bonus", 
                                desc: "Receive immediate liquidity in MC on approval. Use them to boost your items or earn discounts.", 
                                icon: Zap,
                                val: "₦500 VALUE"
                            },
                        ].map((reward, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-10 space-y-8 group hover:border-[#FF6200]/30 transition-all duration-500">
                                <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center text-[#FF6200] group-hover:scale-110 transition-transform">
                                    <reward.icon className="h-8 w-8" />
                                </div>
                                <div className="space-y-3">
                                    <div className="text-[9px] font-black text-[#FF6200] tracking-widest uppercase">{reward.perk}</div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter font-heading leading-tight">{reward.title}</h3>
                                    <p className="text-xs text-zinc-500 font-medium italic leading-relaxed">{reward.desc}</p>
                                </div>
                                <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{reward.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Application Section */}
            <section id="apply-section" className="py-40 bg-white dark:bg-zinc-950">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center space-y-12">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6200] to-transparent" />
                         
                         <div className="space-y-6">
                            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white font-heading">Initiate Application</h2>
                            <p className="text-zinc-400 font-medium italic max-w-xl mx-auto">
                                If you lead your university node, you lead the bridge. Are you ready to own your campus?
                            </p>
                         </div>

                         {hasApplied ? (
                             <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 p-10 rounded-3xl space-y-6 animate-in zoom-in-95 duration-500">
                                 <CheckCircle className="h-16 w-16 text-[#FF6200] mx-auto" />
                                 <div className="space-y-2">
                                     <h4 className="text-2xl font-black uppercase text-[#FF6200]">Data Transmitted</h4>
                                     <p className="text-white/60 text-sm italic">Our Ops HQ is currently vetting your credentials. You will receive an uplink on your school email (.edu.ng) once the review is complete.</p>
                                 </div>
                                 <Button onClick={() => router.push('/seller/dashboard')} variant="outline" className="border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">
                                     Dashboard
                                 </Button>
                             </div>
                         ) : (
                            <form onSubmit={handleApply} className="text-left space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 font-heading">Primary Campus Node</Label>
                                    <Input 
                                        placeholder="e.g. Baze University" 
                                        value={campus}
                                        onChange={(e) => setCampus(e.target.value)}
                                        className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-[#FF6200] transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 font-heading">Mission Motivation</Label>
                                    <Textarea 
                                        placeholder="Why should we trust you to lead your university node?" 
                                        rows={4}
                                        value={motivation}
                                        onChange={(e) => setMotivation(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-[#FF6200] transition-all resize-none"
                                    />
                                </div>
                                <Button 
                                    className="w-full h-16 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest transition-all rounded-2xl shadow-xl shadow-[#FF6200]/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorize Transmission"}
                                </Button>
                                <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-widest italic">
                                    * Application subject to manual HQ review. 44 days Pro status activates on approval.
                                </p>
                            </form>
                         )}
                    </div>
                </div>
            </section>
        </div>
    );
}
