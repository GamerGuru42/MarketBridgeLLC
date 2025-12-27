'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, MapPin, Store, Globe, ShieldCheck, Star, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';

interface Listing {
    id: string;
    dealer_id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    status: string;
    location: string | null;
    created_at: string;
    make?: string;
    model?: string;
    year?: number;
    condition?: string;
    is_verified_listing?: boolean;
    verification_status?: string;
    dealer?: {
        id: string;
        display_name: string;
        is_verified: boolean;
        store_type?: 'physical' | 'online' | 'both';
    };
}

export default function ListingsPage() {
    const searchParams = useSearchParams();
    const initialLocation = searchParams?.get('location') || '';

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState(initialLocation);
    const [category, setCategory] = useState('Automotive');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [condition, setCondition] = useState('all');

    useEffect(() => {
        fetchListings();
    }, [category, condition, location]);

    const fetchListings = async () => {
        setLoading(true);
        setError('');
        try {
            let query = supabase
                .from('listings')
                .select(`
                    *,
                    dealer:users!listings_dealer_id_fkey(
                        id,
                        display_name,
                        is_verified,
                        store_type
                    )
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (category && category !== 'All Categories') {
                query = query.eq('category', category);
            }

            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            if (minPrice) {
                query = query.gte('price', parseInt(minPrice));
            }
            if (maxPrice) {
                query = query.lte('price', parseInt(maxPrice));
            }

            if (condition !== 'all') {
                query = query.eq('condition', condition);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setListings(data || []);
        } catch (err: any) {
            console.error('Error fetching listings:', err);
            setError('Failed to load listings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchListings();
    };

    return (
        <div className="min-h-screen bg-black pt-28 pb-20 relative overflow-hidden">
            {/* Background blobs */}
            <div className="fixed top-[10%] left-[10%] w-[40%] h-[40%] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container px-4 mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 italic">
                            Market <span className="text-[#FFB800]">Listings</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic lowercase">discover verified assets from premium dealers</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
                    <aside className="lg:col-span-1 space-y-8">
                        <div className="glass-card rounded-[2rem] p-8 border-none">
                            <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                                <SlidersHorizontal className="h-3 w-3 text-[#FFB800]" /> Refine Search
                            </h3>

                            <form onSubmit={handleSearch} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-zinc-500 ml-1">Keywords</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-black border border-white/5 rounded-xl text-white text-xs font-bold focus:ring-1 focus:ring-[#FFB800]/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-zinc-500 ml-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-12 px-4 bg-black border border-white/5 rounded-xl text-white text-xs font-bold focus:ring-1 focus:ring-[#FFB800]/50 outline-none uppercase"
                                    >
                                        <option value="All Categories">All Categories</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.id} value={cat.name} disabled={!cat.isActive} className="bg-zinc-900">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-zinc-500 ml-1">Price Range</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="MIN"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            className="h-12 px-4 bg-black border border-white/5 rounded-xl text-white text-xs font-bold outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="MAX"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            className="h-12 px-4 bg-black border border-white/5 rounded-xl text-white text-xs font-bold outline-none"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-12 bg-gold-gradient text-black font-black uppercase tracking-widest text-[10px] rounded-xl border-none glow-on-hover">
                                    Filter Results
                                </Button>
                            </form>
                        </div>
                    </aside>

                    <main className="lg:col-span-3">
                        {/* Loading State */}
                        {loading ? (
                            <div className="flex justify-center items-center py-32">
                                <Loader2 className="h-12 w-12 animate-spin text-[#FFB800]" />
                            </div>
                        ) : listings.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {listings.map((listing) => (
                                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                                        <Card className="bg-zinc-900/40 border-white/5 rounded-[2.2rem] overflow-hidden group cursor-pointer hover:translate-y-[-8px] transition-all duration-500 flex flex-col h-full border-none">
                                            <div className="aspect-[4/3] relative overflow-hidden">
                                                <Image
                                                    src={listing.images?.[0] || 'https://images.unsplash.com/photo-1616422285623-13ff0167c958?q=80&w=800&auto=format&fit=crop'}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-60" />

                                                {listing.is_verified_listing && (
                                                    <div className="absolute top-4 right-4 bg-blue-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                                                        <ShieldCheck className="h-3 w-3" /> Secure
                                                    </div>
                                                )}
                                            </div>

                                            <CardHeader className="p-8 pb-4">
                                                <CardTitle className="text-white font-black text-sm uppercase tracking-tight line-clamp-1 mb-2 italic">
                                                    {listing.title}
                                                </CardTitle>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[#FFB800] text-2xl font-black italic">₦{(listing.price / 1000000).toFixed(1)}m</p>
                                                    <div className="text-right">
                                                        <p className="text-white text-[9px] uppercase font-bold flex items-center gap-1 justify-end">
                                                            <MapPin className="h-2 w-2" /> {listing.location || 'Lagos'}
                                                        </p>
                                                        <p className="text-[#00FF85] text-[9px] font-bold flex items-center gap-1 justify-end italic">
                                                            <Star className="h-2 w-2 fill-[#00FF85]" /> 4.9 rated
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardFooter className="p-8 pt-4 mt-auto">
                                                <div className="flex items-center gap-3 pt-4 border-t border-white/5 w-full">
                                                    <div className="h-8 w-8 rounded-lg glass-card border-none flex items-center justify-center">
                                                        <Store className="h-4 w-4 text-zinc-500" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                                                        {listing.dealer?.display_name || 'Market Dealer'}
                                                    </p>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 glass-card rounded-[3rem] border-none">
                                <p className="text-zinc-600 font-black uppercase tracking-widest text-sm mb-4">No active terminal nodes found</p>
                                <Button variant="outline" onClick={() => { setSearch(''); setCategory('Automotive'); }} className="border-white/10 text-white rounded-full uppercase text-[10px] font-black tracking-widest h-12 px-8">Refresh Stream</Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
