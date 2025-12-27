'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight, ShieldCheck, Truck, Star, MapPin, Sparkles, Box, Search, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { CATEGORIES, Category } from '@/lib/categories';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function HomePage() {
    const { user } = useAuth();
    const [comingSoonCategory, setComingSoonCategory] = useState<Category | null>(null);
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
            setWaitlistSubmitted(true);
            setWaitlistEmail('');
            setWaitlistPhone('');
        } catch (err) {
            console.error('Waitlist error:', err);
            alert('Failed to join waitlist. Please try again.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black overflow-x-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFB800]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[60%] bg-[#FF8A00]/10 blur-[100px] rounded-full rotate-45" />
                <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-[#FFB800]/5 blur-[80px] rounded-full" />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 z-10">
                <div className="container px-4 mx-auto relative">
                    {/* Glass Hero Card */}
                    <div className="max-w-4xl mx-auto glass-card rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden group">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex justify-center mb-8 animate-float">
                                <div className="h-20 w-20 bg-gold-gradient rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.4)] rotate-12">
                                    <Box className="h-10 w-10 text-black" fill="currentColor" />
                                </div>
                            </div>

                            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase">
                                shop <br className="md:hidden" />
                                <span className="font-extralight italic lowercase opacity-80">without</span> <br className="md:hidden" />
                                <span className="text-[#FFB800] text-glow italic">Fear!</span>
                            </h1>

                            <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto mb-12 font-medium leading-relaxed">
                                market bridge is connecting you to verified dealers with through transparency and trust.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Button size="lg" asChild className="bg-gold-gradient text-black font-black uppercase tracking-widest px-10 h-14 rounded-full glow-on-hover border-none">
                                    <Link href="/signup">Get started</Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="bg-transparent border-white/20 text-white font-bold uppercase tracking-widest px-10 h-14 rounded-full hover:bg-white/5 transition-all">
                                    <Link href="/listings">Explore listings</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom blurred shape */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-gradient-to-t from-black to-transparent z-20" />
            </section>

            {/* Verification & Features Section */}
            <section className="relative py-24 z-10">
                <div className="container px-4 mx-auto text-center mb-16">
                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-zinc-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search for dealers near you (e.g Ikeja)"
                                className="w-full max-w-lg pl-12 pr-6 py-4 rounded-full glass-border bg-white/5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium"
                            />
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">
                            Nigeria's most trusted <br />
                            <span className="text-[#FFB800] text-glow italic">Marketplace</span>
                        </h2>
                        <p className="text-zinc-500 mt-6 text-lg font-medium">
                            we are bridging the trust gap by verifying every dealer and <br className="hidden md:block" /> securing every transactions with
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <Card className="glass-card border-none rounded-[2rem] p-8 text-left group hover:bg-white/[0.08] transition-all duration-500">
                            <div className="h-16 w-16 glass-card rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-8 w-8 text-[#FFB800]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-tight">Escrow Security</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Your payment stays in our vault until you've inspected and accepted your item to ensure satisfaction on both ends.
                            </p>
                        </Card>

                        <Card className="glass-card border-none rounded-[2rem] p-8 text-left group hover:bg-white/[0.08] transition-all duration-500">
                            <div className="h-16 w-16 glass-card rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Star className="h-8 w-8 text-[#FFB800]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-tight">Verified Dealers</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Every dealer is physically and legally vetted. No ghost, No scams. All dealers remains within the system.
                            </p>
                        </Card>

                        <Card className="glass-card border-none rounded-[2rem] p-8 text-left group hover:bg-white/[0.08] transition-all duration-500">
                            <div className="h-16 w-16 glass-card rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="h-8 w-8 text-[#FFB800]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-tight">Verified Reviews</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Only customers with completed purchases can leave reviews, to ensure 100% authentic feedback.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Featured Listings Section */}
            <section className="relative py-24 z-10 bg-zinc-950/20">
                <div className="container px-4 mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Featured Listings</h2>
                            <p className="text-zinc-500 mt-2 text-lg italic lowercase">explore our price listings</p>
                        </div>
                        <Button variant="outline" asChild className="rounded-full h-12 w-12 p-0 glass-border bg-white/5 hover:bg-[#FFB800] hover:text-black transition-all">
                            <Link href="/listings"><ChevronRight className="h-6 w-6" /></Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: "ROMANS 2018 V12 NIGHT RUNNER", price: "267.3m", dealer: "Motowns Abuja", rating: "4.9", image: "/images/featured/red_porsche.png" },
                            { title: "BMW 2013 M3 COMPETITION", price: "127.3m", dealer: "Motowns Abuja", rating: "4.9", image: "/images/featured/white_bmw.png" },
                            { title: "ASTON MARTIN 2022 V8 SPORT", price: "227.3m", dealer: "Motowns Abuja", rating: "4.8", image: "/images/featured/teal_aston.png" },
                            { title: "BYD WILDLANDS 2025 V12", price: "207.3m", dealer: "Motowns Abuja", rating: "4.9", image: "/images/featured/byd_front.png" },
                            { title: "PORSCHE 911 V 2 2024 SPORT MOD", price: "347.3m", dealer: "Motowns Abuja", rating: "4.9", image: "/images/featured/olive_porsche.png" },
                            { title: "BYD WILDLANDS 2025 V12", price: "207.3m", dealer: "Motowns Abuja", rating: "4.9", image: "/images/featured/byd_side.png" },
                        ].map((item, idx) => (
                            <Card key={idx} className="bg-zinc-900/40 border-white/5 rounded-[2.2rem] overflow-hidden group cursor-pointer hover:translate-y-[-8px] transition-all duration-500 flex flex-col h-full border-none">
                                <div className="aspect-[4/3] relative overflow-hidden">
                                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />

                                    {/* Shimmer on image */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                </div>

                                <CardHeader className="p-8 pt-6 relative space-y-4">
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {['Brand new', 'Coffee interior', 'Negotiable', 'Direct owner availability'].map(tag => (
                                            <span key={tag} className="text-[7px] font-bold uppercase tracking-widest text-zinc-600 bg-white/5 px-2 py-1 rounded-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <h3 className="text-white font-black text-[13px] uppercase tracking-tighter line-clamp-1 mb-2 italic">
                                        {item.title}
                                    </h3>

                                    <div className="flex justify-between items-center">
                                        <p className="text-[#FFB800] text-2xl font-black italic">₦{item.price}</p>
                                        <div className="text-right">
                                            <p className="text-white text-[9px] uppercase font-bold flex items-center gap-1 justify-end">
                                                <MapPin className="h-2 w-2" /> {item.dealer}
                                            </p>
                                            <p className="text-[#00FF85] text-[9px] font-bold flex items-center gap-1 justify-end italic">
                                                <Star className="h-2 w-2 fill-[#00FF85]" /> {item.rating} rated
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="relative py-32 z-10">
                <div className="container px-4 mx-auto text-center">
                    <div className="inline-block mb-6 px-4 py-2 bg-[#FFB800]/10 rounded-full glass-border">
                        <span className="text-xs font-black text-[#FFB800] uppercase tracking-widest">Coming in Full Release</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">Grow your Business</h2>
                    <p className="text-zinc-500 mb-20 max-w-xl mx-auto font-medium lowercase">
                        join hundreds of verified dealers reaching thousands of <br /> customers across nigeria.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { name: "Starter", sub: "for new dealers", price: "Freemium", features: ["Up to 5 active listings", "basic analytics", "5% transaction fee"], btn: "Start Selling" },
                            { name: "Professional", sub: "for growing businesses", price: "₦ 5,000", period: "/monthly", features: ["Up to 50 active listings", "Verified Dealer Badge", "Priority Support", "2.5% transaction fee"], btn: "Get Pro", popular: true },
                            { name: "Enterprise", sub: "for large dealership", price: "₦ 20,000", period: "/monthly", features: ["Unlimited listings", "Dedicated Account Manager", "API ACCESS", "1% transaction fee"], btn: "Contact Sales" }
                        ].map((plan, idx) => (
                            <Card key={idx} className="glass-card relative border-none rounded-[2.5rem] p-10 text-left overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                                {/* Background Blob in card */}
                                <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-gold-gradient blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />

                                {plan.popular && (
                                    <div className="absolute top-6 right-6 bg-gold-gradient text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                        Popular
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-white uppercase italic">{plan.name}</h3>
                                    <p className="text-zinc-500 text-xs mb-8 font-medium italic">{plan.sub}</p>

                                    <div className="mb-10">
                                        <span className="text-3xl font-black text-[#FFB800] italic">{plan.price}</span>
                                        {plan.period && <span className="text-zinc-600 text-xs font-bold uppercase ml-1">{plan.period}</span>}
                                    </div>

                                    <ul className="space-y-4 mb-12">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-center gap-3 text-zinc-400 text-xs font-semibold uppercase tracking-tight">
                                                <div className="h-5 w-5 glass-card rounded-md flex items-center justify-center text-[#FFB800]">
                                                    <ShieldCheck className="h-3 w-3" />
                                                </div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all ${plan.popular ? 'bg-gold-gradient text-black glow-on-hover' : 'bg-black border border-white/10 text-white hover:bg-white/5'}`}>
                                        {plan.btn}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Category Dialog */}
            <Dialog open={!!comingSoonCategory} onOpenChange={(open) => {
                if (!open) {
                    setComingSoonCategory(null);
                    setWaitlistSubmitted(false);
                }
            }}>
                <DialogContent className="bg-black border-white/10 rounded-[2rem] text-white">
                    <DialogHeader>
                        <div className="mx-auto bg-[#FFB800]/10 h-16 w-16 rounded-3xl flex items-center justify-center mb-6">
                            <Sparkles className="h-8 w-8 text-[#FFB800]" />
                        </div>
                        <DialogTitle className="text-center text-3xl font-black uppercase italic tracking-tighter">
                            {waitlistSubmitted ? "You're on the list!" : "Coming Soon"}
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-2 font-medium">
                            {waitlistSubmitted ? (
                                <>
                                    We&apos;ve added you to the <span className="text-[#FFB800]">{comingSoonCategory?.name}</span> waitlist.
                                </>
                            ) : (
                                <>
                                    We&apos;re currently perfecting our verification process for <span className="text-[#FFB800]">{comingSoonCategory?.name}</span>.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {!waitlistSubmitted ? (
                        <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4 mt-6">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-zinc-600 ml-1">Email Address</Label>
                                <input
                                    type="email"
                                    required
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    placeholder="founder@example.com"
                                    className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-gold-gradient text-black font-black uppercase tracking-widest rounded-2xl glow-on-hover transition-all mt-4">
                                Join Waitlist
                            </Button>
                        </form>
                    ) : (
                        <div className="mt-8 text-center pb-4">
                            <p className="text-zinc-400 mb-6 font-medium">We'll reach out once the gate opens.</p>
                            <Button onClick={() => setComingSoonCategory(null)} className="w-full h-14 bg-white/5 border border-white/10 text-white font-bold rounded-2xl">
                                Return to Terminal
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
