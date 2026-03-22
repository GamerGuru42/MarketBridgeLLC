'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const initialLocation = searchParams?.get('location') || '';

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState(searchParams?.get('q') || searchParams?.get('search') || '');
    const [location, setLocation] = useState(initialLocation);
    const [category, setCategory] = useState(searchParams?.get('category') || 'All Categories');
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
                (payload: any) => {
                    console.log('New listing detected:', payload);
                    // Refresh listings to get joined dealer data properly
                    fetchListings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [category, condition, location, search, user?.id, authLoading]);

    const fetchListings = async () => {
        if (authLoading) return;

        setLoading(true);
        setError('');

        if (!user) {
            setListings([]);
            setLoading(false);
            return;
        }

        try {
            let resultData: Listing[] = [];

            // Sync expired sponsorships on every fetch (lightweight)
            try { await supabase.rpc('sync_sponsorship_expiry'); } catch { /* non-critical */ }

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
                // Build base query filter
                const buildQuery = (baseQuery: any) => {
                    let q = baseQuery.eq('status', 'active');
                    if (category && category !== 'All Categories') q = q.eq('category', category);
                    if (location) q = q.ilike('location', `%${location}%`);
                    if (minPrice) q = q.gte('price', parseInt(minPrice));
                    if (maxPrice) q = q.lte('price', parseInt(maxPrice));
                    if (condition !== 'all') q = q.eq('condition', condition);
                    return q;
                };

                const selectFields = `
                    *,
                    dealer:users!listings_dealer_id_fkey(
                        id,
                        display_name,
                        is_verified,
                        store_type
                    )
                `;

                // Fetch sponsored listings first (pinned to top)
                const { data: sponsored } = await buildQuery(
                    supabase.from('listings').select(selectFields)
                        .eq('is_sponsored', true)
                        .gt('sponsored_until', new Date().toISOString())
                )
                    .order('sponsored_tier', { ascending: false }) // premium > featured > basic
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch regular (non-sponsored) listings
                const { data: regular, error: fetchError } = await buildQuery(
                    supabase.from('listings').select(selectFields)
                        .or('is_sponsored.eq.false,sponsored_until.lt.' + new Date().toISOString())
                )
                    .order('created_at', { ascending: false })
                    .limit(80);

                if (fetchError) throw fetchError;

                // Merge: sponsored pinned first, then regular (deduplicated)
                const sponsoredIds = new Set((sponsored || []).map((l: Listing) => l.id));
                const deduped = (regular || []).filter((l: Listing) => !sponsoredIds.has(l.id));
                resultData = [...(sponsored || []), ...deduped];
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

    // Removed the strict auth redirect so non-authenticated users can view the index UI but NOT the actual listings data.

    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-[#FF6200] selection:text-black flex flex-col pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 dark:opacity-5 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 space-y-12">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Global Asset Index</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Market<span className="text-[#FF6200]">Place</span>
                    </h1>
                    <p className="text-muted-foreground font-medium italic">
                        Scanning <span className="text-foreground font-bold">{listings.length} live Notices</span> across the network.
                    </p>
                </div>

                {/* Search & Filters */}
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#FF6200] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search active Notices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-16 pr-6 h-16 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6200]/50 rounded-2xl font-medium italic text-sm transition-all"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <select
                            title="Filter by Category"
                            aria-label="Filter by Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 h-16 text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6200]/50 rounded-2xl font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
                        >
                            <option value="All Categories" className="bg-[#FAFAFA] dark:bg-zinc-900 text-zinc-900 dark:text-white">All Categories</option>
                            {CATEGORIES.map((cat: any, idx: number) => (
                                <option key={idx} value={cat.name} className="bg-[#FAFAFA] dark:bg-zinc-900 text-zinc-900 dark:text-white">{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <select
                            title="Filter by Location"
                            aria-label="Filter by Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 h-16 text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6200]/50 rounded-2xl font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-[#FAFAFA] dark:bg-zinc-900 text-zinc-900 dark:text-white">All Terminals</option>
                            <option value="Abuja" className="bg-[#FAFAFA] dark:bg-zinc-900 text-zinc-900 dark:text-white">Abuja (Main Node)</option>
                            <option value="Global" className="bg-[#FAFAFA] dark:bg-zinc-900 text-zinc-900 dark:text-white">Global Access</option>
                        </select>
                    </div>

                    <Button type="submit" className="md:col-span-2 h-16 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest rounded-2xl border-none shadow-[0_10px_20px_rgba(255,98,0,0.1)]">
                        Fire Query
                    </Button>
                </form>

                {/* Loading State - Skeleton Grid */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-full shadow-2xl">
                                <Skeleton className="h-64 w-full rounded-none bg-zinc-100 dark:bg-zinc-800" />
                                <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <Skeleton className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800" />
                                        <Skeleton className="h-6 w-3/4 bg-zinc-100 dark:bg-zinc-800" />
                                        <Skeleton className="h-4 w-full bg-zinc-100 dark:bg-zinc-800" />
                                        <Skeleton className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800" />
                                    </div>
                                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                        <div className="flex flex-col space-y-2">
                                            <Skeleton className="h-2 w-16 bg-zinc-100 dark:bg-zinc-800" />
                                            <Skeleton className="h-6 w-24 bg-[#FF6200]/20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 p-6 text-[#FF6200] font-mono text-sm">
                        {error}
                    </div>
                )}

                {/* Unauthenticated State */}
                {!loading && !error && !user && (
                    <div className="pt-8 flex flex-col items-center gap-6">
                        <EmptyState
                            icon={<ShieldCheck className="w-12 h-12 text-[#FF6200]" />}
                            title="Authentication Required"
                            description="The marketplace network requires a secure connection. Log in to view live campus listings."
                            actionLabel="Log In to Network"
                            onAction={() => router.push('/login?redirect=/marketplace')}
                        />
                        <Link href="/">
                            <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-zinc-800/50 uppercase text-[10px] font-black tracking-widest rounded-xl h-10 px-6 transition-all">
                                ← Return to Homepage
                            </Button>
                        </Link>
                    </div>
                )}

                {/* No Results State */}
                {!loading && !error && user && listings.length === 0 && (
                    <div className="pt-8">
                        <EmptyState
                            icon={<Search className="w-12 h-12 text-[#FF6200]" />}
                            title="Zero Matches Found"
                            description="Adjust your parameters to re-scan the marketplace."
                            actionLabel="Reset Network Scan"
                            onAction={() => {
                                setSearch('');
                                setCategory('All Categories');
                                setLocation('');
                                fetchListings();
                            }}
                        />
                    </div>
                )}

                {/* Listings Grid */}
                {!loading && !error && listings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <Link key={listing.id} href={`/listings/${listing.id}`}>
                                <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm transition-all duration-500 group overflow-hidden flex flex-col h-full shadow-2xl ${listing.is_sponsored
                                    ? 'border-[#FF6200]/30 hover:border-[#FF6200]/60 shadow-[#FF6200]/5'
                                    : 'hover:border-[#FF6200]/40 hover:shadow-[#FF6200]/10'
                                    }`}>
                                    <div className="relative h-64 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                                        {listing.images && listing.images[0] ? (
                                            <Image
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Store className="h-12 w-12 text-zinc-900/10 dark:text-white/10" />
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
                                                <span className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 italic">{listing.location || 'Remote'}</span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter italic font-heading line-clamp-1 text-zinc-900 dark:text-white group-hover:text-[#FF6200] transition-colors leading-tight">
                                                {listing.title}
                                            </h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium italic line-clamp-2 leading-relaxed">
                                                {listing.description}
                                            </p>
                                        </div>

                                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Pricing Unit</span>
                                                <span className="text-2xl font-black text-zinc-900 dark:text-white italic font-heading tracking-tighter">₦{listing.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(listing as any).view_count > 0 && (
                                                    <span className="text-[9px] text-zinc-900/20 dark:text-white/20 font-bold">{(listing as any).view_count} views</span>
                                                )}
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
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" /></div>}>
            <ListingsContent />
        </Suspense>
    );
}
