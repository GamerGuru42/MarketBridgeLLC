'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { Loader2, Search, MapPin, Store, Globe, ShieldCheck, Star, SlidersHorizontal, Zap, Calendar, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { intelligentSearch, trackSearch } from '@/lib/ai-search';
import { SponsoredBadge } from '@/components/listings/SponsoredBadge';


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
    is_sponsored?: boolean;
    dealer?: {
        id: string;
        display_name: string;
        is_verified: boolean;
        store_type?: 'physical' | 'online' | 'both';
    };
}

import { Suspense } from 'react';

function ListingsContent() {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const initialLocation = searchParams?.get('location') || '';

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState(searchParams?.get('q') || searchParams?.get('search') || '');
    const [location, setLocation] = useState(initialLocation);
    const [category, setCategory] = useState('All Categories');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [condition, setCondition] = useState('all');

    useEffect(() => {
        // Sync with active Campus if no explicit location parameter is provided
        if (!initialLocation) {
            const savedCampus = localStorage.getItem('mb-preferred-Campus');
            if (savedCampus && savedCampus !== 'global') {
                setLocation(savedCampus);
            }
        }
    }, [initialLocation]);

    useEffect(() => {
        fetchListings();

        // Real-time subscription for new listings
        const channel = supabase
            .channel('public:listings')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'listings',
                    filter: 'status=eq.active'
                },
                (payload) => {
                    console.log('New listing detected:', payload);
                    // Refresh listings to get joined dealer data properly
                    fetchListings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [category, condition, location, search]);

    const fetchListings = async () => {
        setLoading(true);
        setError('');
        try {
            let resultData: Listing[] = [];

            // Use AI-powered intelligent search if there's a search query
            if (search && search.trim()) {
                const results = await intelligentSearch({
                    query: search,
                    category: category !== 'All Categories' ? category : undefined,
                    location: location || undefined,
                    minPrice: minPrice ? parseInt(minPrice) : undefined,
                    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
                    limit: 50
                });

                resultData = results as Listing[];

                // Track search for analytics
                await trackSearch({
                    userId: user?.id,
                    query: search,
                    resultsCount: results.length
                });
            } else {
                // Fallback to basic query if no search term
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

                if (location) {
                    query = query.ilike('location', `%${location}%`);
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
                resultData = data || [];
            }

            setListings(resultData);
        } catch (err: unknown) {
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

    // Auth Wall: Block access if not logged in
    if (!loading && !user) {
        return (
            <div className="min-h-screen bg-black text-white relative flex flex-col pt-28 pb-20 overflow-hidden">
                <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

                <div className="container px-6 mx-auto relative z-10 flex flex-col items-center justify-center flex-1 text-center space-y-8">
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-[#FF6200]/20 to-black border border-[#FF6200]/30 flex items-center justify-center shadow-[0_0_50px_rgba(255,98,0,0.2)] mb-4">
                        <Store className="h-12 w-12 text-[#FF6200]" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter max-w-3xl leading-tight">
                        Unlock Exclusive <span className="text-[#FF6200]">Details</span>
                    </h1>

                    <p className="text-white/60 text-lg md:text-xl font-medium max-w-xl">
                        Join thousands of students trading securely. Sign up to view prices, contact sellers, and access verified campus listings.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg pt-10">
                        <Button size="lg" asChild className="h-20 flex-1 bg-[#FF6200] text-black font-black uppercase tracking-[0.2em] hover:bg-[#FF7A29] rounded-[2rem] border-none shadow-[0_20px_40px_rgba(255,98,0,0.2)]">
                            <Link href="/signup">
                                Initialize Account
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-20 flex-1 border-white/10 text-white font-black uppercase tracking-[0.2em] hover:bg-white/5 rounded-[2rem]">
                            <Link href="/login">
                                Auth Session
                            </Link>
                        </Button>
                    </div>

                    {/* Teaser Background (Blurred Listings) - Real but hidden */}
                    <div className="absolute inset-x-0 bottom-0 h-64 opacity-30 mask-linear-fade pointer-events-none -z-10 overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 filter blur-xl transform translate-y-10">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="bg-zinc-900/50 rounded-xl h-48 border border-white/5 mx-2"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FF6200] selection:text-black flex flex-col pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 space-y-12">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 font-heading">Global Asset Index</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Market<span className="text-[#FF6200]">Place</span>
                    </h1>
                    <p className="text-white/40 font-medium italic">
                        Scanning <span className="text-white font-bold">{listings.length} live Notices</span> across the network.
                    </p>
                </div>

                {/* Search & Filters */}
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-[#FF6200] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search active Notices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 pl-16 pr-6 h-16 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6200]/50 rounded-2xl font-medium italic text-sm transition-all"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-6 h-16 text-white focus:outline-none focus:border-[#FF6200]/50 rounded-2xl font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
                        >
                            <option value="All Categories" className="bg-black text-white">All Categories</option>
                            {CATEGORIES.map((cat: any, idx: number) => (
                                <option key={idx} value={cat.name} className="bg-black text-white">{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-6 h-16 text-white focus:outline-none focus:border-[#FF6200]/50 rounded-2xl font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-black text-white">All Campuss</option>
                            <option value="Abuja" className="bg-black text-white">Abuja</option>
                            <option value="Lagos" className="bg-black text-white">Lagos</option>
                            <option value="Port Harcourt" className="bg-black text-white">Port Harcourt</option>
                        </select>
                    </div>

                    <Button type="submit" className="md:col-span-2 h-16 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest rounded-2xl border-none shadow-[0_10px_20px_rgba(255,98,0,0.1)]">
                        Fire Query
                    </Button>
                </form>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 p-6 text-[#FF6200] font-mono text-sm">
                        {error}
                    </div>
                )}

                {/* No Results State */}
                {!loading && !error && listings.length === 0 && (
                    <div className="text-center py-40 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
                        <div className="h-28 w-28 rounded-full bg-[#FF6200]/5 border border-[#FF6200]/20 flex items-center justify-center mx-auto">
                            <Search className="h-10 w-10 text-white/10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">Zero Matches Found</h3>
                            <p className="text-white/40 font-medium italic">Adjust your parameters to re-scan the marketplace.</p>
                        </div>
                        <Button
                            onClick={() => { setSearch(''); window.location.href = '/listings'; }}
                            variant="outline"
                            className="h-12 px-8 border-white/10 text-white/40 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                        >
                            Reset Network Scan
                        </Button>
                    </div>
                )}

                {/* Listings Grid */}
                {!loading && !error && listings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <Link key={listing.id} href={`/listings/${listing.id}`}>
                                <div className="glass-card rounded-[2rem] border-white/5 hover:border-[#FF6200]/40 transition-all duration-500 group overflow-hidden flex flex-col h-full shadow-2xl hover:shadow-[#FF6200]/10">
                                    <div className="relative h-64 w-full overflow-hidden bg-zinc-900 border-b border-white/5">
                                        {listing.images && listing.images[0] ? (
                                            <Image
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Store className="h-12 w-12 text-white/10" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                                            {listing.is_verified_listing && (
                                                <div className="px-3 py-1.5 rounded-full bg-[#FF6200] text-black font-black text-[8px] tracking-widest flex items-center gap-1.5 shadow-xl">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    VERIFIED
                                                </div>
                                            )}
                                        </div>

                                        {listing.is_sponsored && (
                                            <div className="absolute top-4 left-4">
                                                <SponsoredBadge />
                                            </div>
                                        )}

                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                            <div className="h-10 w-10 rounded-full bg-[#FF6200] flex items-center justify-center text-black">
                                                <ArrowUpRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black text-[#FF6200] uppercase tracking-widest">{listing.category.toUpperCase()}</span>
                                                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                                <span className="text-[9px] font-medium text-white/40 italic">{listing.location || 'Remote'}</span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter italic font-heading line-clamp-1 group-hover:text-[#FF6200] transition-colors leading-tight">
                                                {listing.title}
                                            </h3>
                                            <p className="text-white/40 text-xs font-medium italic line-clamp-2 leading-relaxed">
                                                {listing.description}
                                            </p>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Pricing Unit</span>
                                                <span className="text-2xl font-black text-white italic font-heading tracking-tighter">₦{listing.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {listing.dealer?.is_verified && (
                                                    <div className="h-8 w-8 rounded-full bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20">
                                                        <ShieldCheck className="h-4 w-4 text-[#FF6200]" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


export default function ListingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" /></div>}>
            <ListingsContent />
        </Suspense>
    );
}
