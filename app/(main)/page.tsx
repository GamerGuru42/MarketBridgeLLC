'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    ArrowRight, ShieldCheck, Truck, Star, MapPin, Sparkles, Box, Search, ChevronRight,
    Lock, CheckCircle2, TrendingUp, Users, RefreshCw, Zap
} from 'lucide-react';
import Image from 'next/image';
import { CATEGORIES, Category } from '@/lib/categories';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function HomePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [comingSoonCategory, setComingSoonCategory] = useState<Category | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleMainSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistPhone, setWaitlistPhone] = useState('');
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Parallax effect for hero
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            setOffset(window.scrollY * 0.5);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

            // Trigger Email Notification
            await fetch('/api/waitlist/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: waitlistEmail,
                    phone: waitlistPhone,
                    category: comingSoonCategory?.name
                })
            });


            if (error) throw error;
            setWaitlistSubmitted(true);
            setWaitlistEmail('');
            setWaitlistPhone('');
        } catch (err) {
            console.error('Waitlist error:', err);
            alert('Failed to join waitlist. Please try again.');
        }
    };

    const [currentNode, setCurrentNode] = useState<string>('Abuja');

    useEffect(() => {
        const saved = localStorage.getItem('mb-preferred-node');
        if (saved) setCurrentNode(saved === 'global' ? 'Global' : saved);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-black overflow-x-hidden selection:bg-[#FFB800] selection:text-black">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FFB800]/5 rounded-full blur-[150px] opacity-40 mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF5500]/5 rounded-full blur-[150px] opacity-30 mix-blend-screen" />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-20 z-10 overflow-hidden">
                <div className="container px-4 mx-auto relative h-full flex flex-col justify-center">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Text Content */}
                        <div className="relative z-20 space-y-8">
                            {/* Beta Tag */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-[#00FF85] animate-pulse shadow-[0_0_10px_#00FF85]" />
                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-300">Beta Access v0.1</span>
                            </div>

                            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.9]">
                                TRUST <br />
                                IS THE <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-[#FF9500] italic pr-2">CURRENCY.</span>
                            </h1>

                            <p className="text-zinc-400 text-lg md:text-xl max-w-lg font-medium leading-relaxed border-l-2 border-[#FFB800] pl-6 ml-2">
                                {currentNode === 'Abuja' ? "Abuja's" : (currentNode === 'Global' ? "Nigeria's" : `${currentNode}'s`)} #1 Student Marketplace. Buy, sell, and connect safely on campus. Zero stress. Zero scams.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button size="lg" asChild className="bg-[#FFB800] text-black font-black uppercase tracking-widest px-10 h-16 hover:bg-[#FFD700] hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(255,184,0,0.2)]">
                                    <Link href={user ? (['dealer', 'student_seller'].includes(user.role) ? '/dealer/dashboard' : '/onboarding?role=student_seller') : '/signup?role=dealer'}>
                                        <span className="inline-block">{user && ['dealer', 'student_seller'].includes(user.role) ? 'MERCHANT TERMINAL' : 'START SELLING'}</span>
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-widest px-10 h-16 hover:bg-white hover:text-black transition-all duration-300">
                                    <Link href="/listings">
                                        <span className="inline-block">EXPLORE DEALS</span>
                                    </Link>
                                </Button>
                            </div>

                        </div>

                        {/* Interactive Hero Visual */}
                        <div className="relative z-10 w-full lg:h-screen lg:absolute lg:right-0 lg:top-0 lg:w-1/2 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-20" />

                            {/* Student Lifestyle Image - Higher Quality Multi-Student Shot */}
                            <Image
                                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"
                                alt="Student Lifestyle Hub"
                                fill
                                className="object-cover object-center scale-105"
                                style={{ transform: `translateY(${offset * 0.15}px)` }}
                                priority
                            />

                            {/* Node Location Overlay */}
                            <div className="absolute bottom-[30%] left-[20%] z-30 flex flex-col items-center">
                                <div className="p-5 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center gap-4 shadow-2xl">
                                    <div className="h-10 w-10 rounded-full bg-[#FFB800]/20 flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-[#FFB800] animate-pulse" />
                                    </div>
                                    <span className="text-2xl font-black text-white uppercase italic tracking-tighter">{currentNode} HUB</span>
                                </div>
                                <div className="h-16 w-[1px] bg-gradient-to-b from-white/20 to-transparent mt-2 mr-[110px]" />
                            </div>

                            {/* Overlay Grid */}
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 z-10 mix-blend-overlay" />
                        </div>
                    </div>
                </div>
            </section>



            {/* Protocol/Verification Strip */}
            <section className="bg-[#0A0A0A] border-y border-white/5 overflow-hidden py-6">
                <div className="flex gap-12 animate-scroll-text whitespace-nowrap min-w-full justify-center">
                    {[...Array(20)].map((_, i: number) => (
                        <React.Fragment key={i}>
                            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                <ShieldCheck className="h-6 w-6 text-[#FFB800]" />
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Student Verified</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                <Lock className="h-6 w-6 text-[#FFB800]" />
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Safe Payments</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                <CheckCircle2 className="h-6 w-6 text-[#FFB800]" />
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Quality Checked</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </section>

            {/* How It Works - "The Protocol" */}
            <section className="py-24 relative overflow-hidden">
                <div className="container px-4 mx-auto">
                    <div className="mb-16">
                        <h2 className="text-xs font-black text-[#FFB800] uppercase tracking-[0.3em] mb-4">The Campus Protocol</h2>
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
                        ].map((item, idx: number) => (
                            <div key={idx} className="group relative p-6 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#FFB800] transition-all duration-500" />

                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-5xl font-black text-white/20 group-hover:text-[#FFB800] transition-colors duration-300">{item.step}</span>
                                    <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center group-hover:border-[#FFB800] group-hover:shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-all">
                                        <item.icon className="h-6 w-6 text-zinc-400 group-hover:text-[#FFB800] transition-colors" />
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


            {/* Categories Marquee / Grid */}
            <section className="py-24">
                <div className="container px-4 mx-auto text-center mb-16">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Support Channels</h2>
                    <p className="text-zinc-500">From gadgets to fashion, find it on campus.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
                    {CATEGORIES.map((cat: Category, idx: number) => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleCategoryClick(cat)}
                                className={`relative bg-white/5 border border-white/5 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 group overflow-hidden ${cat.locked
                                    ? 'opacity-60 grayscale cursor-not-allowed hover:opacity-100 hover:grayscale-0'
                                    : 'hover:bg-[#FFB800] hover:text-black hover:border-transparent'
                                    }`}
                            >
                                {cat.locked && (
                                    <div className="absolute top-2 right-2">
                                        <Lock className="h-3 w-3 text-[#FFB800]" />
                                    </div>
                                )}
                                <span className="transition-all">
                                    <Icon className="h-8 w-8" />
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                                {cat.locked && (
                                    <span className="absolute bottom-1 text-[8px] font-bold text-[#FFB800] uppercase tracking-tighter">Locked</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Dealers/CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#FFB800] clip-diagonal-section transform -skew-y-3 origin-bottom-right translate-y-12 opacity-5 pointer-events-none" />

                <div className="container px-4 mx-auto relative z-10">
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[2rem] p-8 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent opacity-50" />

                        <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-8 leading-[0.9]">
                            Ready to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-[#FF9500] italic">Hustle?</span>
                        </h2>

                        <p className="text-zinc-400 max-w-xl mx-auto mb-12 text-lg font-medium">
                            Join the fastest growing network of student entrepreneurs. Start your business journey today.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Button size="lg" asChild className="bg-[#FFB800] text-black font-black uppercase tracking-widest px-12 h-16 rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,184,0,0.3)]">
                                <Link href={user ? (['dealer', 'student_seller'].includes(user.role) ? '/dealer/dashboard' : '/onboarding?role=student_seller') : '/signup?role=dealer'}>
                                    {user && ['dealer', 'student_seller'].includes(user.role) ? 'MERCHANT TERMINAL' : 'BECOME A DEALER'}
                                </Link>
                            </Button>
                            <Button size="lg" variant="ghost" asChild className="text-white border border-white/10 font-bold uppercase tracking-widest px-12 h-16 rounded-full hover:bg-white/10">
                                <Link href="mailto:emailseconder@gmail.com">
                                    Contact Sales
                                </Link>
                            </Button>
                        </div>
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
                <DialogContent className="bg-black border-white/10 rounded-none border-l-4 border-l-[#FFB800] text-white max-w-md">
                    <DialogHeader>
                        <div className="text-[#FFB800] mb-4">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                            {waitlistSubmitted ? "Access Granted" : "Restricted Access"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 pt-2 font-mono text-xs">
                            {waitlistSubmitted ? (
                                <>
                                    YOU HAVE BEEN ADDED TO THE PRIORITY QUEUE FOR <span className="text-[#FFB800]">{comingSoonCategory?.name}</span>.
                                </>
                            ) : (
                                <>
                                    MODULE <span className="text-[#FFB800]">{comingSoonCategory?.name}</span> IS CURRENTLY LOCKED. ENTER CREDENTIALS FOR NOTIFICATION.
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
                                    className="w-full px-6 py-4 bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] font-mono text-sm placeholder:text-zinc-700"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-[#FFB800] text-black font-black uppercase tracking-widest hover:bg-[#FFD700] transition-all mt-4 border-none">
                                Request Access
                            </Button>
                        </form>
                    ) : (
                        <div className="mt-8 pb-4">
                            <Button onClick={() => setComingSoonCategory(null)} className="w-full h-14 bg-zinc-900 border-2 border-white/10 text-white font-bold hover:bg-white/5 uppercase tracking-widest">
                                Acknowledge
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

