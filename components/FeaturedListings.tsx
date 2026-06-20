'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star, Store, ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';

const supabase = createClient();

interface FeaturedListing {
    id: string;
    listing_id: string;
    listing: {
        id: string;
        title: string;
        price: number;
        category: string;
        images: string[];
        status: string;
        location: string | null;
    };
    seller: {
        id: string;
        display_name: string;
        photo_url: string | null;
        is_verified: boolean;
    };
}

export function FeaturedListings() {
    const [listings, setListings] = useState<FeaturedListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            setLoading(true);
            try {
                const now = new Date().toISOString();
                const { data, error } = await supabase
                    .from('featured_listings')
                    .select(`
                        id,
                        listing_id,
                        listing:listings!inner (
                            id,
                            title,
                            price,
                            category,
                            images,
                            status,
                            location
                        ),
                        seller:users!featured_listings_seller_id_fkey (
                            id,
                            display_name,
                            photo_url,
                            is_verified
                        )
                    `)
                    .eq('status', 'active')
                    .gte('featured_until', now)
                    .eq('listings.status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(8);

                if (error) {
                    console.error('Featured listings fetch error:', error);
                    // Fallback: try using featured_until on listings table directly
                    const { data: fallbackData } = await supabase
                        .from('listings')
                        .select(`
                            id,
                            title,
                            price,
                            category,
                            images,
                            status,
                            location,
                            featured_until,
                            seller:users!listings_seller_id_fkey (
                                id,
                                display_name,
                                photo_url,
                                is_verified
                            )
                        `)
                        .eq('status', 'active')
                        .gte('featured_until', now)
                        .order('created_at', { ascending: false })
                        .limit(8);

                    if (fallbackData && fallbackData.length > 0) {
                        setListings(fallbackData.map((item: any) => ({
                            id: item.id,
                            listing_id: item.id,
                            listing: {
                                id: item.id,
                                title: item.title,
                                price: item.price,
                                category: item.category,
                                images: item.images,
                                status: item.status,
                                location: item.location,
                            },
                            seller: item.seller || {
                                id: '',
                                display_name: 'Unknown Seller',
                                photo_url: null,
                                is_verified: false,
                            },
                        })));
                    }
                    return;
                }

                if (data) {
                    setListings(data.map((item: any) => ({
                        ...item,
                        listing: Array.isArray(item.listing) ? item.listing[0] : item.listing,
                        seller: Array.isArray(item.seller) ? item.seller[0] : item.seller,
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch featured listings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    // Don't render the section at all while loading if there's nothing to show
    if (!loading && listings.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Star className="h-5 w-5 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                            Featured <span className="text-amber-400">Listings</span>
                        </h2>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 p-12 text-center group transition-colors hover:border-amber-500/50 hover:bg-amber-500/5">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Sparkles className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-6 group-hover:scale-110 group-hover:text-amber-400 transition-all duration-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-2">No Featured Listings Yet</h3>
                    <p className="text-zinc-500 text-xs font-medium max-w-sm mx-auto mb-8">
                        Premium listings from verified sellers will appear here. Browse the marketplace to discover campus deals.
                    </p>
                    <Link href="/marketplace">
                        <Button variant="outline" className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px] text-zinc-900 dark:text-zinc-100 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition-all">
                            Browse Marketplace
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                            Featured <span className="text-amber-400">Listings</span>
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">Premium picks from verified sellers</p>
                    </div>
                </div>
                <Link href="/marketplace" className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Loading Skeletons */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                            <Skeleton className="h-48 w-full bg-zinc-100 dark:bg-zinc-800" />
                            <div className="p-5 space-y-3">
                                <Skeleton className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800" />
                                <Skeleton className="h-5 w-3/4 bg-zinc-100 dark:bg-zinc-800" />
                                <div className="flex items-center gap-2 pt-2">
                                    <Skeleton className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                                    <Skeleton className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800" />
                                </div>
                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <Skeleton className="h-6 w-28 bg-amber-500/10" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Listings Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {listings.map((item) => {
                        const listing = item.listing;
                        const seller = item.seller;
                        if (!listing) return null;

                        return (
                            <Link key={item.id} href={`/listings/${listing.id}`}>
                                <div className="relative bg-white dark:bg-zinc-900 border border-amber-500/20 rounded-[1.5rem] shadow-sm transition-all duration-500 group overflow-hidden flex flex-col h-full hover:border-amber-500/50 hover:shadow-[0_8px_40px_rgba(245,158,11,0.12)] hover:-translate-y-1">
                                    {/* Image */}
                                    <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                        {listing.images && listing.images[0] ? (
                                            <Image
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Store className="h-10 w-10 text-zinc-900/10 dark:text-white/10" />
                                            </div>
                                        )}

                                        {/* Gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Featured Badge — Top Left */}
                                        <div className="absolute top-3 left-3">
                                            <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[7px] tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/30 uppercase">
                                                <Star className="h-2.5 w-2.5 fill-black" />
                                                Featured
                                            </div>
                                        </div>

                                        {/* Category Badge — Top Right */}
                                        {listing.category && (
                                            <div className="absolute top-3 right-3">
                                                <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white font-black text-[7px] tracking-widest uppercase border border-white/10">
                                                    {listing.category}
                                                </div>
                                            </div>
                                        )}

                                        {/* Arrow icon on hover */}
                                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-lg">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            {/* Seller Row */}
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                                                    {seller?.photo_url ? (
                                                        <Image src={seller.photo_url} alt={seller.display_name || ''} width={24} height={24} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-zinc-400">
                                                            {(seller?.display_name || 'S')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 truncate">
                                                    {seller?.display_name || 'Seller'}
                                                </span>
                                                {seller?.is_verified && (
                                                    <ShieldCheck className="h-3 w-3 text-[#FF6200] shrink-0" />
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors leading-tight">
                                                {listing.title}
                                            </h3>
                                        </div>

                                        {/* Price */}
                                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                            <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter">
                                                ₦{listing.price?.toLocaleString()}
                                            </span>
                                            {listing.location && (
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[80px]">
                                                    {listing.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
