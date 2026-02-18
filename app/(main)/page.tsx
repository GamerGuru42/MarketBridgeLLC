'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    ShieldCheck, Lock, CheckCircle2, Users, Search, RefreshCw, Zap, Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/landing/HeroSection';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { Category } from '@/lib/categories';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const supabase = createClient();

export default function HomePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [comingSoonCategory, setComingSoonCategory] = useState<Category | null>(null);

    // Waitlist Form State
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistPhone, setWaitlistPhone] = useState('');
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

    const handleCategoryClick = (category: Category) => {
        setComingSoonCategory(category);
        setWaitlistSubmitted(false);
    };

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([
                    {
                        email: waitlistEmail,
                        phone: waitlistPhone,
                        category: comingSoonCategory?.name
                    }
                ]);

            if (error) throw error;

            // Trigger Email Notification (Optional, fail-safe)
            try {
                await fetch('/api/waitlist/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: waitlistEmail,
                        phone: waitlistPhone,
                        category: comingSoonCategory?.name
                    })
                });
            } catch (e) { console.error('Notify failed', e); }

            setWaitlistSubmitted(true);
            setWaitlistEmail('');
            setWaitlistPhone('');
        } catch (err) {
            console.error('Waitlist error:', err);
            alert('Failed to join waitlist. Please try again.');
        }
    };


    return (
        <div className="flex flex-col min-h-screen bg-black overflow-x-hidden selection:bg-[#FF6600] selection:text-black">

            {/* 1. Hero Section (New Interactive Chowdeck-style) */}
            <HeroSection />

            {/* 2. Protocol/Verification Strip (Compact Marquee) */}
            <section className="bg-[#0A0A0A] border-y border-white/5 overflow-hidden py-6">
                <div className="flex gap-12 animate-scroll-text whitespace-nowrap min-w-full justify-center">
                    {[...Array(10)].map((_, i) => (
                        <React.Fragment key={i}>
                            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                <ShieldCheck className="h-6 w-6 text-[#FF6600]" />
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Student Verified</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                <Lock className="h-6 w-6 text-[#FF6600]" />
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Safe Payments</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                <CheckCircle2 className="h-6 w-6 text-[#FF6600]" />
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Quality Checked</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </section>

            {/* 3. Categories Grid (New Interactive) */}
            <CategoryGrid onCategoryClick={handleCategoryClick} />

            {/* 4. How It Works - "The Protocol" */}
            <section className="py-24 relative overflow-hidden bg-black">
                <div className="container px-4 mx-auto">
                    <div className="mb-16">
                        <h2 className="text-xs font-black text-[#FF6600] uppercase tracking-[0.3em] mb-4">The Campus Protocol</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Trust is good. <br />
                            <span className="text-zinc-500">Verification is better.</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: "01", title: "Join", desc: "Sign up with your student details. Get verified to unlock selling privileges.", icon: Users },
                            { step: "02", title: "Discover", desc: "Browse thousands of student listings. From textbooks to tech, it's all here.", icon: Search },
                            { step: "03", title: "Chat", desc: "Connect directly with sellers. Negotiate safely within our secure terminal.", icon: Lock },
                            { step: "04", title: "Exchange", desc: "Meet on campus or arrange delivery. Close the deal with confidence.", icon: RefreshCw }
                        ].map((item, idx) => (
                            <div key={idx} className="group relative p-6 border border-white/5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#FF6600] transition-all duration-500" />
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-5xl font-black text-white/20 group-hover:text-[#FF6600] transition-colors duration-300">{item.step}</span>
                                    <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center group-hover:border-[#FF6600] group-hover:shadow-[0_0_15px_rgba(255,102,0,0.3)] transition-all">
                                        <item.icon className="h-6 w-6 text-zinc-400 group-hover:text-[#FF6600] transition-colors" />
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-wide mb-3">{item.title}</h4>
                                <p className="text-zinc-400 text-sm font-medium leading-relaxed group-hover:text-zinc-200 transition-colors">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Waitlist Dialog */}
            <Dialog open={!!comingSoonCategory} onOpenChange={(open) => {
                if (!open) {
                    setComingSoonCategory(null);
                    setWaitlistSubmitted(false);
                }
            }}>
                <DialogContent className="bg-black border-white/10 rounded-3xl border-l-4 border-l-[#FF6600] text-white max-w-md">
                    <DialogHeader>
                        <div className="text-[#FF6600] mb-4">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                            {waitlistSubmitted ? "Access Granted" : "Restricted Access"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 pt-2 font-mono text-xs">
                            {waitlistSubmitted ? (
                                <>
                                    YOU HAVE BEEN ADDED TO THE PRIORITY QUEUE FOR <span className="text-[#FF6600]">{comingSoonCategory?.name}</span>.
                                </>
                            ) : (
                                <>
                                    MODULE <span className="text-[#FF6600]">{comingSoonCategory?.name}</span> IS CURRENTLY LOCKED. ENTER CREDENTIALS FOR NOTIFICATION.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {!waitlistSubmitted ? (
                        <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4 mt-6">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-zinc-600 ml-1">Communication Channel</Label>
                                <input
                                    type="email"
                                    required
                                    value={waitlistEmail}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWaitlistEmail(e.target.value)}
                                    placeholder="ENTER EMAIL ADDRESS"
                                    className="w-full px-6 py-4 bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] font-mono text-sm placeholder:text-zinc-700 rounded-xl"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-[#FF6600] text-black font-black uppercase tracking-widest hover:bg-[#FF8533] transition-all mt-4 border-none rounded-xl">
                                Request Access
                            </Button>
                        </form>
                    ) : (
                        <div className="mt-8 pb-4">
                            <Button onClick={() => setComingSoonCategory(null)} className="w-full h-14 bg-zinc-900 border-2 border-white/10 text-white font-bold hover:bg-white/5 uppercase tracking-widest rounded-xl">
                                Acknowledge
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
