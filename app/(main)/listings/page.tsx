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
        // Sync with active node if no explicit location parameter is provided
        if (!initialLocation) {
            const savedNode = localStorage.getItem('mb-preferred-node');
            if (savedNode && savedNode !== 'global') {
                setLocation(savedNode);
            }
        }
    }, [initialLocation]);

    useEffect(() => {
        fetchListings();
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
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-[#FF6600]/20 to-black border border-[#FF6600]/30 flex items-center justify-center shadow-[0_0_50px_rgba(255,102,0,0.2)] mb-4">
                        <Store className="h-12 w-12 text-[#FF6600]" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter max-w-3xl leading-tight">
                        Unlock Exclusive <span className="text-[#FF6600]">Details</span>
                    </h1>

                    <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl">
                        Join thousands of students trading securely. Sign up to view prices, contact sellers, and access over 300+ campus listings.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                        <Button size="lg" asChild className="h-14 flex-1 bg-[#FF6600] text-black font-black uppercase tracking-widest hover:bg-[#FF8533] hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,102,0,0.3)] rounded-xl">
                            <Link href="/signup">
                                Create Account
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-14 flex-1 border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-transparent transition-all rounded-xl">
                            <Link href="/login">
                                Sign In
                            </Link>
                        </Button>
                    </div>

                    {/* Teaser Background (Blurred Listings) */}
                    <div className="absolute inset-x-0 bottom-0 h-64 opacity-50 mask-linear-fade pointer-events-none -z-10 overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 filter blur-sm transform translate-y-10">
                            {COMPREHENSIVE_MOCK_LISTINGS.slice(0, 4).map((item, i) => (
                                <div key={i} className="bg-zinc-900/50 rounded-xl h-48 border border-white/5 mx-2"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FF6600] selection:text-black flex flex-col pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-4 text-sm font-mono transition-colors">
                            <ArrowLeft className="h-3 w-3" />
                            BACK TO HOME
                        </Link>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic">
                            Browse <span className="text-[#FF6600]">Marketplace</span>
                        </h1>
                        <p className="text-zinc-500 mt-3 font-mono text-sm">
                            {listings.length} listings available
                        </p>
                    </div>
                </div>

                {/* Search & Filters */}
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="Search products... (e.g., 'wig', 'laptop', 'shoes')"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 pl-12 pr-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6600] rounded-none font-mono text-sm"
                        />
                    </div>

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-zinc-900 border border-white/10 px-4 py-4 text-white focus:outline-none focus:border-[#FF6600] rounded-none font-mono text-sm"
                    >
                        <option value="All Categories">All Categories</option>
                        {CATEGORIES.map((cat: any, idx: number) => (
                            <option key={idx} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-zinc-900 border border-white/10 px-4 py-4 text-white focus:outline-none focus:border-[#FF6600] rounded-none font-mono text-sm"
                    >
                        <option value="">All Locations</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Lagos">Lagos</option>
                        <option value="Port Harcourt">Port Harcourt</option>
                    </select>

                    <Button type="submit" className="bg-[#FF6600] text-black hover:bg-[#FF6600] font-black uppercase tracking-widest rounded-none">
                        Search
                    </Button>
                </form>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#FF6600]" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 text-red-400 font-mono text-sm">
                        {error}
                    </div>
                )}

                {/* No Results State */}
                {!loading && !error && listings.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                            <Search className="h-10 w-10 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-black uppercase text-white">No Listings Found</h3>
                        <p className="text-zinc-500 max-w-md font-mono text-sm">
                            We couldn't find any items matching your search. Try different keywords or browse all categories.
                        </p>
                        <Button
                            onClick={() => { setSearch(''); window.location.href = '/listings'; }}
                            variant="outline"
                            className="mt-4 border-white/10 hover:bg-white/5 text-white font-mono uppercase text-xs tracking-widest"
                        >
                            Clear Search Filters
                        </Button>
                    </div>
                )}

                {/* Listings Grid */}
                {!loading && !error && listings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <Link key={listing.id} href={`/listings/${listing.id}`}>
                                <Card className="bg-zinc-900 border-white/10 hover:border-[#FF6600] transition-all cursor-pointer group overflow-hidden rounded-none">
                                    <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                                        {listing.images && listing.images[0] ? (
                                            <Image
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Store className="h-12 w-12 text-zinc-700" />
                                            </div>
                                        )}
                                        {listing.is_verified_listing && (
                                            <Badge className="absolute top-2 right-2 bg-[#00FF85] text-black font-black text-[10px]">
                                                <ShieldCheck className="h-3 w-3 mr-1" />
                                                VERIFIED
                                            </Badge>
                                        )}
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-white text-lg font-black uppercase tracking-tight line-clamp-2">
                                            {listing.title}
                                        </CardTitle>
                                        <p className="text-zinc-500 text-xs font-mono line-clamp-2 mt-2">
                                            {listing.description}
                                        </p>
                                    </CardHeader>
                                    <CardFooter className="flex justify-between items-center border-t border-white/5 pt-4">
                                        <span className="text-2xl font-black text-[#FF6600]">
                                            ₦{listing.price.toLocaleString()}
                                        </span>
                                        {listing.dealer?.is_verified && (
                                            <ShieldCheck className="h-4 w-4 text-[#00FF85]" />
                                        )}
                                    </CardFooter>
                                </Card>
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
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#FF6600]" /></div>}>
            <ListingsContent />
        </Suspense>
    );
}
