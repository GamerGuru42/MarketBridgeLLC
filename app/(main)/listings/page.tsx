'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, MapPin, Store, Globe, ShieldCheck } from 'lucide-react';
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
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Automotive');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [condition, setCondition] = useState('all');

    useEffect(() => {
        fetchListings();
    }, [category, condition]);

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

            // Apply category filter
            if (category && category !== 'All Categories') {
                query = query.eq('category', category);
            }

            // Apply search filter
            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            // Apply price range
            if (minPrice) {
                query = query.gte('price', parseInt(minPrice));
            }
            if (maxPrice) {
                query = query.lte('price', parseInt(maxPrice));
            }

            // Apply condition
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
        <div className="min-h-screen py-8">
            <div className="container px-4 mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Browse Listings</h1>
                    <p className="text-muted-foreground">Discover great deals from verified dealers</p>
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Search cars by make, model, or keywords..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All Categories">All Categories</SelectItem>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.name}
                                                disabled={!cat.isActive}
                                            >
                                                {cat.name} {!cat.isActive && '(Soon)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" className="w-full">Search</Button>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Condition</label>
                                    <Select value={condition} onValueChange={setCondition}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any Condition</SelectItem>
                                            <SelectItem value="Tokunbo">Tokunbo (Foreign Used)</SelectItem>
                                            <SelectItem value="Nigerian Used">Nigerian Used</SelectItem>
                                            <SelectItem value="Brand New">Brand New</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Min Price (₦)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Max Price (₦)</label>
                                    <Input
                                        type="number"
                                        placeholder="No Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button variant="outline" className="w-full" onClick={() => {
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setCondition('all');
                                        setSearch('');
                                        setCategory('Automotive');
                                    }}>
                                        Reset Filters
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8 text-destructive">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Listings Grid */}
                {!loading && listings.length > 0 && (
                    <>
                        <div className="mb-4 text-sm text-muted-foreground">
                            Showing {listings.length} {category !== 'All Categories' ? `${category} ` : ''}listing{listings.length !== 1 ? 's' : ''}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {listings.map((listing) => (
                                <Link key={listing.id} href={`/listings/${listing.id}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                                        <div className="aspect-square bg-muted relative overflow-hidden">
                                            {listing.images && listing.images.length > 0 ? (
                                                <Image
                                                    src={listing.images[0]}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                                    No Image
                                                </div>
                                            )}
                                            {listing.is_verified_listing && (
                                                <Badge className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600">
                                                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified Listing
                                                </Badge>
                                            )}
                                            {!listing.is_verified_listing && listing.dealer?.is_verified && (
                                                <Badge className="absolute top-2 right-2 bg-primary">
                                                    Verified Dealer
                                                </Badge>
                                            )}
                                        </div>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                                            <p className="text-2xl font-bold text-primary">
                                                ₦{listing.price.toLocaleString()}
                                            </p>
                                        </CardHeader>
                                        <CardFooter className="p-4 pt-0 flex flex-col gap-2 mt-auto">
                                            <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {listing.location || 'Nigeria'}
                                                </span>
                                                <Badge variant="outline">{listing.category}</Badge>
                                            </div>
                                            {listing.dealer?.store_type && (
                                                <div className="flex gap-1 w-full flex-wrap">
                                                    {listing.dealer.store_type === 'physical' && (
                                                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                            <Store className="h-3 w-3" />
                                                            Physical Store
                                                        </Badge>
                                                    )}
                                                    {listing.dealer.store_type === 'online' && (
                                                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            Online Shop
                                                        </Badge>
                                                    )}
                                                    {listing.dealer.store_type === 'both' && (
                                                        <>
                                                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                                <Store className="h-3 w-3" />
                                                                Physical
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                                <Globe className="h-3 w-3" />
                                                                Online
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && listings.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-xl text-muted-foreground mb-4">No listings found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
