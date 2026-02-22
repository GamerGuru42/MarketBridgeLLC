import { notFound } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function PublicIndexPage() {
    // Server-side guard: enforce env var + DB flag
    const envEnabled = process.env.ENABLE_PUBLIC_SECTION === 'true'
    if (!envEnabled) return notFound()

    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'public_section_enabled')
            .limit(1)

        if (error) {
            console.error('Public index DB check failed', error)
            return notFound()
        }

        const dbEnabled = data?.[0]?.value === true || data?.[0]?.value === 'true'
        if (!dbEnabled) return notFound()
    } catch (e) {
        console.error('Public index guard error', e)
        return notFound()
    }

    return (
        <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' }}>
                <div style={{ fontWeight: 700, color: '#FF6200', fontSize: 20 }}>MarketBridge</div>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>
                <h1 style={{ color: '#FF6200', background: '#000000', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>Public Marketplace</h1>
                <p style={{ color: '#FFFFFF', opacity: 0.85, marginTop: 12 }}>Open to all Nigerians</p>

                <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                    <Link href="/public/listings" style={{ background: '#FF6200', color: '#000000', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 800 }}>Browse Listings</Link>
                    <Link href="/public/onboarding" style={{ background: '#111111', color: '#FFFFFF', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', border: '1px solid #222' }}>Become a Seller</Link>
                </div>
            </main>

            <footer style={{ padding: 18, textAlign: 'center', borderTop: '1px solid #111', marginTop: 40 }}>
                <div>
                    <a href="mailto:support@marketbridge.com.ng" style={{ color: '#FF6200', textDecoration: 'none', marginRight: 12 }}>Tech Support: support@marketbridge.com.ng</a>
                    <a href="mailto:ops-support@marketbridge.com.ng" style={{ color: '#FF6200', textDecoration: 'none' }}>Ops Support: ops-support@marketbridge.com.ng</a>
                </div>
            </footer>
        </div>
    )
}
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
    ShoppingBag, Smartphone, Car, Sofa, Shirt, Wrench, ArrowRight,
    Search, Loader2, MapPin, Star, TrendingUp
} from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';

const PUBLIC_CATEGORIES = [
    { icon: Smartphone, label: 'Electronics', desc: 'Phones, laptops, gadgets' },
    { icon: Shirt, label: 'Fashion', desc: 'Clothing, shoes, accessories' },
    { icon: Car, label: 'Vehicles', desc: 'Cars, bikes, spare parts' },
    { icon: Sofa, label: 'Home Goods', desc: 'Furniture, appliances' },
    { icon: Wrench, label: 'Services', desc: 'Repairs, freelance, gigs' },
    { icon: ShoppingBag, label: 'General', desc: 'Everything else' },
];

export default function PublicMarketplacePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const { data } = await supabase
                .from('listings')
                .select('id, title, price, images, location, created_at, users!listings_seller_id_fkey(display_name)')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(12);
            setListings(data || []);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/public/listings?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#FF6200] selection:text-black">

            {/* ── Minimal Header ── */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black">
                <Logo />
                <div className="flex items-center gap-6">
                    {user ? (
                        <Link href="/seller/dashboard" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:text-white transition-all">
                            My Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                                Sign In
                            </Link>
                            <Link href="/signup" className="h-10 px-6 bg-[#FF6200] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#FF7A29] transition-all flex items-center">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* ── Hero Section ── */}
            <section className="flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,98,0,0.06)_0%,_transparent_70%)] pointer-events-none" />

                <div className="relative max-w-4xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/20 text-[10px] font-black uppercase tracking-widest text-[#FF6200]">
                        <TrendingUp className="h-3 w-3" />
                        Nigeria&apos;s Open Marketplace
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.95]">
                        Buy & Sell <br /><span className="text-[#FF6200]">Anything</span> in Nigeria
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium max-w-xl mx-auto">
                        Electronics, fashion, vehicles, home goods, and services – all secured by Paystack.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl mx-auto w-full">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for anything..."
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6200]/50 focus:ring-1 focus:ring-[#FF6200]/20 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="h-14 px-8 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF7A29] transition-all whitespace-nowrap flex items-center gap-2"
                        >
                            Search <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </section>

            {/* ── Categories ── */}
            <section className="px-6 py-10 max-w-6xl mx-auto w-full">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Browse Categories</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {PUBLIC_CATEGORIES.map((cat) => (
                        <Link
                            key={cat.label}
                            href={`/public/listings?category=${encodeURIComponent(cat.label.toLowerCase())}`}
                            className="group flex flex-col items-center p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem] hover:border-[#FF6200]/30 hover:bg-[#FF6200]/5 transition-all text-center"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-white/5 group-hover:bg-[#FF6200]/10 flex items-center justify-center mb-3 transition-colors">
                                <cat.icon className="h-6 w-6 text-zinc-400 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-white">{cat.label}</span>
                            <span className="text-[10px] text-zinc-600 mt-1">{cat.desc}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Recent Listings ── */}
            <section className="px-6 py-6 pb-12 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Recent Listings</h2>
                    <Link href="/public/listings" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:text-white transition-all flex items-center gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-[1.5rem] bg-white/[0.02] border border-white/5 overflow-hidden animate-pulse">
                                <div className="h-48 bg-white/5" />
                                <div className="p-4 space-y-3">
                                    <div className="h-3 bg-white/5 rounded-full w-3/4" />
                                    <div className="h-4 bg-white/10 rounded-full w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-[2rem]">
                        <ShoppingBag className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">No listings yet – be the first to sell!</p>
                        <Link href="/onboarding?role=student_seller" className="inline-flex mt-6 h-12 px-8 bg-[#FF6200] text-black font-black uppercase tracking-widest text-[10px] rounded-xl items-center hover:bg-[#FF7A29] transition-all">
                            Start Selling
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <Link key={listing.id} href={`/listings/${listing.id}`} className="group">
                                <div className="rounded-[1.5rem] bg-white/[0.02] border border-white/5 group-hover:border-[#FF6200]/30 overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,98,0,0.1)]">
                                    <div className="relative h-48 bg-zinc-900 overflow-hidden">
                                        {listing.images?.[0] ? (
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="h-10 w-10 text-zinc-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <p className="text-xs font-black uppercase tracking-tighter text-white line-clamp-2">{listing.title}</p>
                                        <p className="text-lg font-black text-[#FF6200]">₦{Number(listing.price).toLocaleString()}</p>
                                        {listing.location && (
                                            <div className="flex items-center gap-1 text-zinc-500">
                                                <MapPin className="h-3 w-3" />
                                                <span className="text-[10px] uppercase font-bold tracking-wide">{listing.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Sell CTA ── */}
            <section className="px-6 py-16 max-w-6xl mx-auto w-full">
                <div className="bg-[#FF6200] rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-black space-y-3">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Start Selling Today</h2>
                        <p className="text-black/70 font-bold max-w-md">Join thousands of Nigerians buying and selling safely on MarketBridge. ₦1,000/month – cancel anytime.</p>
                    </div>
                    <Link
                        href="/signup?intent=sell"
                        className="h-16 px-10 bg-black text-white font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-zinc-900 transition-all flex items-center gap-3 shrink-0 whitespace-nowrap"
                    >
                        Create Seller Account <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* ── Minimal Footer ── */}
            <footer className="w-full border-t border-white/5 px-6 py-10 bg-black">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600">Tech Support:</span>
                            <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors underline decoration-[#FF6200]/20 underline-offset-4">
                                support@marketbridge.com.ng
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600">Ops Support:</span>
                            <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors underline decoration-[#FF6200]/20 underline-offset-4">
                                ops-support@marketbridge.com.ng
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
