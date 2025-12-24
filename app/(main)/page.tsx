'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight, ShieldCheck, Truck, Star, MapPin, Sparkles
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
    // ... rest of state ...
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
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-12 md:py-32 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
                <div className="container px-4 mx-auto text-center relative z-10">
                    <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full">
                        <span className="text-sm font-semibold text-primary px-2">Nigeria's Most Trusted Business Marketplace</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Shop Without <span className="text-primary">Fear</span>
                        {user?.location && (
                            <span className="block text-2xl md:text-3xl text-muted-foreground mt-2 font-medium">
                                Shop the best deals in <span className="text-primary/80 font-bold">{user.location}</span>
                            </span>
                        )}
                    </h1>
                    <p className="text-lg md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto px-2">
                        Starting with new and used cars, we connect verified dealers with customers through transparency and trust. From small businesses to large enterprises, we're building Nigeria's most reliable marketplace.
                    </p>

                    {/* Location Search */}
                    <div className="max-w-md mx-auto mb-8 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            placeholder={user?.location ? `Search dealers in ${user.location}...` : "Search dealers near you (e.g. Ikeja)"}
                            className="w-full pl-10 pr-4 py-3 rounded-full border border-input bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/listings?location=${e.currentTarget.value}`;
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild className="text-lg px-8">
                            <Link href="/listings">Browse Products</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="text-lg px-8">
                            <Link href="/about">Learn More</Link>
                        </Button>
                    </div>
                </div>

                {/* Background Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
            </section>

            {/* Authenticated User Quick Actions */}
            {user && (
                <section className="py-12 bg-primary/5">
                    <div className="container px-4 mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-background p-8 rounded-2xl border border-primary/10 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold italic tracking-tighter uppercase">Welcome back, {user.displayName.split(' ')[0]}!</h3>
                                    <p className="text-muted-foreground text-sm italic">Pick up where you left off in your marketplace journey.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" asChild size="sm">
                                    <Link href="/settings">Account Settings</Link>
                                </Button>
                                <Button variant="outline" asChild size="sm">
                                    <Link href="/wishlist">Saved Items</Link>
                                </Button>
                                <Button variant="outline" asChild size="sm">
                                    <Link href="/orders">Order History</Link>
                                </Button>
                                {user.role === 'dealer' && (
                                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                                        <Link href="/dealer/dashboard">Dealer Portal</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Guest Value Proposition - Why MarketBridge? */}
            {!user && (
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-4">Nigeria's Most Trusted Marketplace</h2>
                            <p className="text-muted-foreground text-lg">
                                We are bridging the trust gap by verifying every dealer and securing every transaction.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-4 text-center p-8 bg-background rounded-3xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight">Verified Sellers</h3>
                                <p className="text-muted-foreground text-sm">Every dealer is physically and legally vetted. No ghosts. No scams.</p>
                            </div>
                            <div className="space-y-4 text-center p-8 bg-background rounded-3xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                    <Truck className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight">Escrow Security</h3>
                                <p className="text-muted-foreground text-sm">Your payment stays in our vault until you've inspected and accepted your item.</p>
                            </div>
                            <div className="space-y-4 text-center p-8 bg-background rounded-3xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                    <Star className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight">Verified Reviews</h3>
                                <p className="text-muted-foreground text-sm">Only customers with completed purchases can leave reviews. 100% authentic feedback.</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Shop by Category */}
            <section className="py-16 container px-4 mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Explore Marketplace</h2>
                        <p className="text-muted-foreground mt-2 italic">Find premium vehicles and high-value items from trusted Nigerian dealers.</p>
                    </div>
                    {user?.role !== 'dealer' && (
                        <div className="flex bg-muted p-1 rounded-xl">
                            <Button size="sm" variant="ghost" className="rounded-lg font-bold">Buy</Button>
                            <Button size="sm" asChild variant="ghost" className="rounded-lg text-muted-foreground hover:text-primary">
                                <Link href="/signup?role=dealer">Sell</Link>
                            </Button>
                        </div>
                    )}
                </div>
                {/* ... rest of the categories grid remains the same ... */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {CATEGORIES.map((category) => (
                        <div key={category.name}>
                            {category.isActive ? (
                                <Link
                                    href={`/listings?category=${category.name}`}
                                    className="flex flex-col items-center justify-center p-6 bg-card hover:bg-muted/50 border border-border/50 rounded-xl transition-all hover:shadow-md group h-full"
                                >
                                    <div className={`h-14 w-14 ${category.bg} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                        <category.icon className={`h-7 w-7 ${category.color}`} />
                                    </div>
                                    <span className="font-medium text-sm md:text-base">{category.name}</span>
                                </Link>
                            ) : (
                                <div
                                    onClick={() => handleCategoryClick(category)}
                                    className="flex flex-col items-center justify-center p-6 bg-muted/20 border border-border/30 rounded-xl cursor-pointer hover:bg-muted/30 transition-all h-full relative overflow-hidden"
                                >
                                    <div className="absolute top-2 right-2 bg-muted-foreground/20 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider text-muted-foreground">
                                        Soon
                                    </div>
                                    <div className={`h-14 w-14 ${category.bg} opacity-50 rounded-full flex items-center justify-center mb-3 grayscale`}>
                                        <category.icon className={`h-7 w-7 ${category.color}`} />
                                    </div>
                                    <span className="font-medium text-sm md:text-base text-muted-foreground">{category.name}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <Dialog open={!!comingSoonCategory} onOpenChange={(open) => {
                if (!open) {
                    setComingSoonCategory(null);
                    setWaitlistSubmitted(false);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle className="text-center text-xl">
                            {waitlistSubmitted ? "You're on the list!" : "Coming Soon"}
                        </DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            {waitlistSubmitted ? (
                                <>
                                    We&apos;ve added you to the <strong>{comingSoonCategory?.name}</strong> waitlist.
                                    We&apos;ll notify you as soon as we launch this category with verified partners.
                                </>
                            ) : (
                                <>
                                    We&apos;re currently perfecting our verification process for <strong>{comingSoonCategory?.name}</strong>.
                                    Join the waitlist to be notified when this category goes live.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {!waitlistSubmitted ? (
                        <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3 mt-4">
                            <div className="space-y-1">
                                <Label htmlFor="waitlist-email" className="text-xs">Email Address</Label>
                                <input
                                    id="waitlist-email"
                                    type="email"
                                    required
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="waitlist-phone" className="text-xs">Phone Number (Optional)</Label>
                                <input
                                    id="waitlist-phone"
                                    type="tel"
                                    value={waitlistPhone}
                                    onChange={(e) => setWaitlistPhone(e.target.value)}
                                    placeholder="08012345678"
                                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <Button type="submit" className="w-full mt-2">
                                Join Waitlist
                            </Button>
                            <Button variant="ghost" type="button" onClick={() => setComingSoonCategory(null)} className="w-full">
                                Not now
                            </Button>
                        </form>
                    ) : (
                        <div className="mt-4">
                            <Button onClick={() => setComingSoonCategory(null)} className="w-full">
                                Great, thanks!
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Featured Listings */}
            <section className="py-16 container px-4 mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">Featured Listings</h2>
                    <Button variant="ghost" asChild>
                        <Link href="/listings" className="flex items-center gap-2">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            id: 1,
                            title: "2018 Toyota Camry XLE",
                            price: 18500000,
                            location: "Maitama, Abuja",
                            rating: 4.9,
                            image: "/toyota-camry.png"
                        },
                        {
                            id: 2,
                            title: "2020 Honda Accord Sport",
                            price: 15200000,
                            location: "Wuse II, Abuja",
                            rating: 4.8,
                            image: "/honda-accord.png"
                        },
                        {
                            id: 3,
                            title: "2015 Lexus RX 350",
                            price: 12400000,
                            location: "Garki, Abuja",
                            rating: 5.0,
                            image: "/lexus-rx350.png"
                        },
                        {
                            id: 4,
                            title: "2017 Mercedes-Benz C300",
                            price: 22500000,
                            location: "Asokoro, Abuja",
                            rating: 4.7,
                            image: "/mercedes-c300.png"
                        },
                    ].map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-border/50">
                            <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                            </div>
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <CardTitle className="text-lg line-clamp-1 font-semibold">{item.title}</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" aria-label="Verified Dealer" />
                                </div>
                                <p className="text-primary font-bold text-lg">₦{item.price.toLocaleString()}</p>
                            </CardHeader>
                            <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex justify-between">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
                                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" /> {item.rating}</span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Coming Soon Features */}
            <section className="py-16 container px-4 mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full">
                        <span className="text-sm font-semibold text-primary">Coming in Full Release</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Exciting Features on the Way</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        We're working hard to bring you even more features. Here's what's coming soon!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-muted/30 rounded-xl border border-border">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Live Chat System</h3>
                        <p className="text-sm text-muted-foreground">Real-time messaging with dealers, complete with image sharing and chat history.</p>
                    </div>
                    <div className="p-6 bg-muted/30 rounded-xl border border-border">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <span className="text-2xl">⭐</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Advanced Reviews</h3>
                        <p className="text-sm text-muted-foreground">Detailed product reviews with photos, verified purchase badges, and helpful voting.</p>
                    </div>
                    <div className="p-6 bg-muted/30 rounded-xl border border-border">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Dealer Analytics</h3>
                        <p className="text-sm text-muted-foreground">Comprehensive insights and performance metrics for dealer accounts.</p>
                    </div>
                    <div className="p-6 bg-muted/30 rounded-xl border border-border">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                            <span className="text-2xl">📱</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Mobile App</h3>
                        <p className="text-sm text-muted-foreground">Native iOS and Android apps for shopping on the go.</p>
                    </div>
                </div>
            </section>

            {/* Dealer Plans - Show only to non-dealers */}
            {user?.role !== 'dealer' && (
                <>
                    <section className="py-20 bg-muted/20 border-y border-border/50">
                        <div className="container px-4 mx-auto">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-4">Grow Your Business</h2>
                                <p className="text-muted-foreground text-lg">
                                    Join hundreds of verified dealers reaching thousands of customers across Nigeria.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                {/* Starter Plan */}
                                <Card className="flex flex-col bg-background">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Starter</CardTitle>
                                        <p className="text-sm text-muted-foreground">For new sellers</p>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold">Free</span>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Up to 5 active listings</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Basic analytics</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>5% transaction fee</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" variant="outline" asChild>
                                            <Link href="/signup?role=dealer">Start Selling</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>

                                {/* Pro Plan */}
                                <Card className="flex flex-col bg-background border-primary shadow-lg relative transform md:-translate-y-4">
                                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                        POPULAR
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-xl">Professional</CardTitle>
                                        <p className="text-sm text-muted-foreground">For growing businesses</p>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold">₦5,000</span>
                                            <span className="text-muted-foreground">/month</span>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Up to 50 active listings</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Verified Dealer Badge</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Priority Support</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>2.5% transaction fee</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" asChild>
                                            <Link href="/signup?role=dealer">Get Pro</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>

                                {/* Enterprise Plan */}
                                <Card className="flex flex-col bg-background">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Enterprise</CardTitle>
                                        <p className="text-sm text-muted-foreground">For large dealerships</p>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold">₦20,000</span>
                                            <span className="text-muted-foreground">/month</span>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Unlimited listings</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>Dedicated Account Manager</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>API Access</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <span>1% transaction fee</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" variant="outline" asChild>
                                            <Link href="/contact">Contact Sales</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section className="py-16 bg-muted/30">
                        <div className="container px-4 mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-4">Why Choose MarketBridge?</h2>
                            <p className="text-center text-sm text-muted-foreground mb-12">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                    BETA VERSION - More features coming soon!
                                </span>
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                                <div className="flex flex-col items-center p-6 bg-background rounded-xl shadow-sm">
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Verified Dealers</h3>
                                    <p className="text-muted-foreground">Every dealer undergoes a strict verification process to ensure your safety.</p>
                                </div>
                                <div className="flex flex-col items-center p-6 bg-background rounded-xl shadow-sm">
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                        <Truck className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Secure Delivery</h3>
                                    <p className="text-muted-foreground">Track your orders and enjoy reliable delivery services across Nigeria.</p>
                                </div>
                                <div className="flex flex-col items-center p-6 bg-background rounded-xl shadow-sm">
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                        <Star className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Quality Assured</h3>
                                    <p className="text-muted-foreground">Read real reviews from other customers and shop with confidence.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
