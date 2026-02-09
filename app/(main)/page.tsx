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
                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-300">{currentNode} Node v0.1</span>
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
                                <Button size="lg" asChild className="bg-[#FFB800] text-black font-black uppercase tracking-widest px-8 h-14 hover:bg-[#FFD700] hover:scale-105 transition-all duration-300">
                                    <Link href={user ? (user.role === 'dealer' ? '/dealer/dashboard' : '/onboarding') : '/login?role=dealer'}>
                                        <span className="inline-block">{user && user.role === 'dealer' ? 'Seller Dashboard' : 'Start Selling'}</span>
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-widest px-8 h-14 hover:bg-white hover:text-black transition-all duration-300">
                                    <Link href="/listings">
                                        <span className="inline-block">Explore Deals</span>
                                    </Link>
                                </Button>
                            </div>

                            {/* Sector Intelligence */}
                            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-4 gap-4 backdrop-blur-md mb-8 max-w-sm">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20">
                                    <Zap className="h-4 w-4 text-[#FFB800]" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1 text-left">Sector Intelligence</span>
                                    <span className="text-[10px] font-bold text-white uppercase italic tracking-wider text-left">
                                        {currentNode === 'Abuja'
                                            ? "Syncing: Suncity Estate to Garki Core..."
                                            : currentNode === 'Lagos'
                                                ? "Mapping: Ikeja to Victoria Island..."
                                                : "Global Grid Connected: Sector Unknown"}
                                    </span>
                                </div>
                            </div>

                            {/* Node Activity Monitor */}
                            <div className="pt-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp className="h-4 w-4 text-[#FFB800]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Node Activity: {currentNode}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-8 p-6 bg-white/5 border border-white/5 backdrop-blur-sm rounded-2xl max-w-md">
                                    <div>
                                        <p className="text-2xl font-black text-white">{currentNode === 'Abuja' ? 'High' : 'Active'}</p>
                                        <p className="text-[8px] uppercase text-zinc-600 font-bold tracking-widest">Trade Volume</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-white">{currentNode === 'Abuja' ? 'Peak' : 'Mid'}</p>
                                        <p className="text-[8px] uppercase text-zinc-600 font-bold tracking-widest">Growth Index</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-white">{currentNode === 'Abuja' ? '12ms' : '24ms'}</p>
                                        <p className="text-[8px] uppercase text-zinc-600 font-bold tracking-widest">Latency hub</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Hero Visual */}
                        <div className="relative z-10 w-full aspect-square md:aspect-video lg:h-screen lg:absolute lg:right-0 lg:top-0 lg:w-1/2 overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-20" />
                            <div className="absolute inset-0 bg-gold-gradient opacity-10 mix-blend-overlay z-10" />

                            {/* Student Lifestyle Image */}
                            <Image
                                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                                alt="Student Lifestyle"
                                fill
                                className="object-cover object-center lg:object-left"
                                style={{ transform: `translateY(${offset * 0.2}px)` }}
                                priority
                            />

                            {/* Node Location Overlay */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
                                <div className="p-4 bg-black/60 backdrop-blur-xl border border-[#FFB800]/30 rounded-full flex items-center gap-3">
                                    <MapPin className="h-6 w-6 text-[#FFB800] animate-bounce" />
                                    <span className="text-2xl font-black text-white uppercase italic tracking-tighter">{currentNode} HUB</span>
                                </div>
                                <div className="h-12 w-px bg-gradient-to-b from-[#FFB800] to-transparent mt-2" />
                            </div>

                            {/* Overlay Grid */}
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 z-20 mix-blend-overlay" />
                        </div>
                    </div>
                </div>

                {/* Search Bar - Floating */}
                <div className="absolute bottom-10 left-0 right-0 z-30 px-4">
                    <div className="container mx-auto">
                        <form onSubmit={handleMainSearch} className="bg-black/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl max-w-3xl flex items-center gap-2 mx-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] focus-within:ring-2 focus-within:ring-[#FFB800] transition-all">
                            <Search className="h-6 w-6 text-zinc-500 ml-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${currentNode} Node for assets...`}
                                className="bg-transparent border-none text-white placeholder:text-zinc-600 w-full h-12 focus:outline-none focus:ring-0 text-lg font-medium"
                            />
                            <Button type="submit" className="bg-[#FFB800] text-black hover:bg-[#FFD700] h-12 px-8 font-bold uppercase tracking-widest shadow-none">
                                Search
                            </Button>
                        </form>
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

            {/* Featured Listings - Masonry/Grid */}
            <section className="py-24 bg-zinc-900/20 border-y border-white/5">
                <div className="container px-4 mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Campus <span className="text-[#FFB800] italic">Live</span></h2>
                            <p className="text-zinc-500 mt-2 text-lg font-medium">Real-time listings from students near you.</p>
                        </div>
                        <Button variant="outline" asChild className="group border-white/10 hover:bg-[#FFB800] hover:border-[#FFB800] hover:text-black transition-all">
                            <Link href="/listings" className="flex items-center gap-2">
                                View All Assets <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "iPhone 12 Pro (UK Used)", price: "320,000", dealer: "Campus Gadgets", image: "https://images.unsplash.com/photo-1603539268574-e3fb65e4ff8a?auto=format&fit=crop&w=800&q=80" },
                            { title: "Bone Straight Wig (24in)", price: "150,000", dealer: "Slay with Precious", image: "https://images.unsplash.com/photo-1635396603077-4b711739fe88?auto=format&fit=crop&w=800&q=80" },
                            { title: "Nike Air Force 1", price: "25,000", dealer: "Kicks by Jide", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80" },
                            { title: "HP EliteBook 840 G5", price: "280,000", dealer: "Campus Gadgets", image: "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=800&q=80" },
                            { title: "Student Indomie Pack", price: "8,500", dealer: "Nile Foodies", image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80" },
                            { title: "Math 101 Textbook", price: "5,000", dealer: "Bookworm Hub", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" },
                        ].map((item, idx: number) => (
                            <Link href={`/listings/${item.title.startsWith('iPhone') ? 'mock-1' : item.title.startsWith('Bone') ? 'mock-2' : item.title.startsWith('Nike') ? 'mock-4' : item.title.startsWith('HP') ? 'mock-6' : item.title.startsWith('Student') ? 'mock-5' : 'mock-3'}`} key={idx}>
                                <Card className="group bg-black/40 border-white/5 hover:border-[#FFB800]/50 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,184,0,0.1)] rounded-none h-full">
                                    <div className="aspect-[16/10] relative overflow-hidden bg-zinc-900">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                        />
                                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur text-[#FFB800] text-xs font-black px-3 py-1 uppercase tracking-wider border border-[#FFB800]/20">
                                            Verified
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-12 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                            <p className="text-[#FFB800] text-xl font-black italic mb-1">₦{item.price}</p>
                                            <h3 className="text-white font-bold text-sm uppercase tracking-tight line-clamp-1">{item.title}</h3>
                                            <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {item.dealer}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
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
                            <Button size="lg" className="bg-[#FFB800] text-black font-black uppercase tracking-widest px-12 h-16 rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,184,0,0.3)]">
                                <Link href={user ? (user.role === 'dealer' ? '/dealer/dashboard' : '/onboarding') : '/signup?role=dealer'}>
                                    {user && user.role === 'dealer' ? 'Go to Dashboard' : 'Become a Dealer'}
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

