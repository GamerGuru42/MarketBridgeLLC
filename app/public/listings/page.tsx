'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, SlidersHorizontal, MapPin, ShoppingBag, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Vehicles', 'Home Goods', 'Services', 'General'];
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
];

interface Listing {
    id: string;
    title: string;
    price: number;
    images: string[];
    location: string;
    category: string;
    created_at: string;
    seller?: { display_name: string };
}

function PublicListingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchListings();
    }, [activeCategory, sortBy]);

    const fetchListings = async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('listings')
                .select('id, title, price, images, location, category, created_at, users!listings_seller_id_fkey(display_name)')
                .eq('status', 'active');

            if (activeCategory && activeCategory !== 'all') {
                query = query.ilike('category', `%${activeCategory}%`);
            }

            if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
            else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
            else query = query.order('created_at', { ascending: false });

            const { data, error: fetchError } = await query.limit(24);
            if (fetchError) throw fetchError;
            setListings(data || []);
        } catch (err: any) {
            console.error('Failed to fetch listings:', err);
            setError('Failed to load listings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/public/listings?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            fetchListings();
        }
    };

    const filteredListings = searchQuery
        ? listings.filter(l =>
            l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.location?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : listings;

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#FF6200] selection:text-black">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Public Market</span>
                    </Link>

                    <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search listings..."
                                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6200]/50 transition-all"
                            />
                        </div>
                        <button type="submit" className="h-11 px-5 bg-[#FF6200] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#FF7A29] transition-all shrink-0">
                            Search
                        </button>
                    </form>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => {
                            const catKey = cat.toLowerCase();
                            const isActive = activeCategory === catKey || (cat === 'All' && activeCategory === 'all');
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(catKey === 'all' ? 'all' : catKey)}
                                    className={`h-9 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border ${isActive
                                            ? 'bg-[#FF6200] text-black border-[#FF6200]'
                                            : 'bg-white/5 text-zinc-400 border-white/10 hover:border-[#FF6200]/30 hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-9 bg-white/5 border border-white/10 rounded-xl px-4 text-[10px] text-white font-black uppercase tracking-widest appearance-none focus:border-[#FF6200]/50 focus:outline-none"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="rounded-[1.5rem] bg-white/[0.02] border border-white/5 overflow-hidden animate-pulse">
                                <div className="h-48 bg-white/5" />
                                <div className="p-4 space-y-3">
                                    <div className="h-3 bg-white/5 rounded-full w-3/4" />
                                    <div className="h-4 bg-white/10 rounded-full w-1/2" />
                                    <div className="h-2 bg-white/5 rounded-full w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-[2rem]">
                        <ShoppingBag className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs mb-6">{error}</p>
                        <button
                            onClick={fetchListings}
                            className="h-12 px-8 bg-[#FF6200] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#FF7A29] transition-all inline-flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-[2rem]">
                        <ShoppingBag className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">No listings found</p>
                        <p className="text-zinc-600 text-sm mt-2">Try a different search or category</p>
                    </div>
                ) : (
                    <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {filteredListings.map((listing) => (
                                <Link key={listing.id} href={`/listings/${listing.id}`} className="group">
                                    <div className="rounded-[1.5rem] bg-white/[0.02] border border-white/5 group-hover:border-[#FF6200]/30 overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,98,0,0.08)]">
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
                                            {listing.category && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest text-zinc-300 rounded-lg">
                                                        {listing.category}
                                                    </span>
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
                    </>
                )}
            </div>
        </div>
    );
}

export default function PublicListingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
            </div>
        }>
            <PublicListingsContent />
        </Suspense>
    );
}
