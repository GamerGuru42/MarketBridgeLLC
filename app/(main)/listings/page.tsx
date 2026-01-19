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

            // Fallback to high-quality mock data if database is empty (for demo/launch)
            if (!data || data.length === 0) {
                const mockListings: Listing[] = [
                    {
                        id: 'mock-1', title: '2022 TOYOTA CAMRY XSE', description: 'Nigerian used, first body, super clean interior, panoramic roof, leather seats, 4-cylinder engine.', price: 28500000, category: 'Automotive', location: 'Lagos', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2022, make: 'Toyota', model: 'Camry', condition: 'Nigerian Used', dealer: { id: 'mock', display_name: 'Elite Motors', is_verified: true }
                    },
                    {
                        id: 'mock-2', title: '2019 LEXUS RX 350', description: 'Foreign used, fully loaded, panoramic roof, thumb-start, reverse camera, duty fully paid.', price: 35000000, category: 'Automotive', location: 'Abuja', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1591533924719-79888126b0a1?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2019, make: 'Lexus', model: 'RX 350', condition: 'Tokunbo', dealer: { id: 'mock', display_name: 'Premium Autos Ltd', is_verified: true }
                    },
                    {
                        id: 'mock-3', title: '2021 BMW M4 COMPETITION', description: 'Turbocharged, carbon fiber interior, low mileage, competition package, full service history.', price: 65000000, category: 'Automotive', location: 'Port Harcourt', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2021, make: 'BMW', model: 'M4', condition: 'Tokunbo', dealer: { id: 'mock', display_name: 'Speed Nation', is_verified: true }
                    },
                    {
                        id: 'mock-4', title: '2023 MERCEDES-BENZ S580', description: 'Brand new, luxury redefined, massaging seats, 4matic, executive rear seat package.', price: 185000000, category: 'Automotive', location: 'Lagos', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2023, make: 'Mercedes-Benz', model: 'S580', condition: 'Brand New', dealer: { id: 'mock', display_name: 'Luxe Terminal', is_verified: true }
                    },
                    {
                        id: 'mock-5', title: '2020 HONDA ACCORD SPORT', description: 'Clean title, reverse camera, Apple CarPlay, lane watch, alloy wheels.', price: 18000000, category: 'Automotive', location: 'Enugu', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2020, make: 'Honda', model: 'Accord', condition: 'Nigerian Used', dealer: { id: 'mock', display_name: 'Smart Wheels', is_verified: true }
                    },
                    {
                        id: 'mock-6', title: '2024 PORSCHE 911 GT3 RS', description: 'Ultimate track machine, carbon ceramic brakes, aero package, magnesium wheels.', price: 420000000, category: 'Automotive', location: 'Lagos', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2024, make: 'Porsche', model: '911 GT3 RS', condition: 'Brand New', dealer: { id: 'mock', display_name: 'Crown Jewels Autos', is_verified: true }
                    },
                    {
                        id: 'mock-7', title: '2022 RANGE ROVER AUTOBIOGRAPHY', description: 'Long wheel base, rear entertainment, deployable side steps, executive seating.', price: 165000000, category: 'Automotive', location: 'Abuja', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2022, make: 'Land Rover', model: 'Range Rover', condition: 'Tokunbo', dealer: { id: 'mock', display_name: 'Royal Rides', is_verified: true }
                    },
                    {
                        id: 'mock-8', title: '2021 TOYOTA HILUX ADVENTURE', description: '4x4, diesel engine, leather seats, reverse camera, off-road package.', price: 45000000, category: 'Automotive', location: 'Kano', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2021, make: 'Toyota', model: 'Hilux', condition: 'Nigerian Used', dealer: { id: 'mock', display_name: 'Kano Motors', is_verified: true }
                    },
                    {
                        id: 'mock-9', title: '2024 TESLA MODEL S PLAID', description: 'Zero to sixty in 1.9s, tri-motor AWD, autopilot, premium white interior.', price: 135000000, category: 'Automotive', location: 'Lagos', status: 'active', dealer_id: 'mock', created_at: new Date().toISOString(), images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'], is_verified_listing: true, year: 2024, make: 'Tesla', model: 'Model S', condition: 'Brand New', dealer: { id: 'mock', display_name: 'Future Drive', is_verified: true }
                    }
                ];
                setListings(mockListings);
            } else {
                setListings(data);
            }
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

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FFB800] selection:text-black flex flex-col pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 space-y-12">
                {/* Header section consistent with dashboards */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Market Index Stream</span>
                        </div>
                        <Link href="/" className="inline-flex items-center text-[#FFB800] hover:text-[#FFD700] uppercase text-[10px] font-black tracking-[0.2em] font-heading mb-2 py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Core
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Asset <span className="text-[#FFB800]">Stream</span>
                        </h1>
                        <p className="text-zinc-500 font-medium max-w-xl italic">
                            Authorized access to <span className="text-white font-bold">{listings.length} verified listings</span> in the current sector.
                            Filter by category or budget below.
                        </p>
                    </div>

                    <div className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1 pb-1 font-heading">Network Status</span>
                        <span className="text-sm font-black text-[#00FF85] italic uppercase tracking-tighter flex items-center gap-2 font-heading">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF85]" /> CORE LIVE
                        </span>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Filters Sidebar */}
                    <aside className="lg:w-80 shrink-0">
                        <div className="glass-card rounded-[2.5rem] p-10 border-none sticky top-32">
                            <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-10 flex items-center justify-between font-heading">
                                <span>Refine Stream</span>
                                <SlidersHorizontal className="h-4 w-4 text-[#FFB800]" />
                            </h3>

                            <form onSubmit={handleSearch} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-heading">Keywords</label>
                                    <div className="relative group/search">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within/search:text-[#FFB800]" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH..."
                                            value={search}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-black border border-white/5 rounded-2xl text-white text-xs font-bold focus:border-[#FFB800]/50 outline-none transition-all font-heading uppercase tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-heading">Category</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                                            className="w-full h-14 px-5 bg-black border border-white/5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest focus:border-[#FFB800]/50 outline-none transition-all font-heading cursor-pointer appearance-none"
                                        >
                                            <option value="All Categories">All Categories</option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat.id} value={cat.name} disabled={cat.locked} className="bg-zinc-900">
                                                    {cat.name} {cat.locked ? '(COMING SOON)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Zap className="h-3 w-3 text-[#FFB800]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-heading">Budget Range (₦)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="MIN"
                                                value={minPrice}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinPrice(e.target.value)}
                                                className="w-full h-14 px-4 bg-black border border-white/5 rounded-2xl text-white text-[10px] font-black outline-none font-heading"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="MAX"
                                                value={maxPrice}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPrice(e.target.value)}
                                                className="w-full h-14 px-4 bg-black border border-white/5 rounded-2xl text-white text-[10px] font-black outline-none font-heading"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-16 bg-[#FFB800] text-black hover:bg-[#FFD700] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all font-heading mt-4 italic">
                                    Refresh Grid
                                </Button>
                            </form>
                        </div>
                    </aside>

                    {/* Listings Grid */}
                    <main className="flex-1 min-w-0">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center py-48 space-y-6">
                                <div className="h-16 w-16 rounded-2xl border-2 border-[#FFB800]/20 flex items-center justify-center relative animate-pulse">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#FFB800]" />
                                </div>
                                <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] font-heading italic">Decrypting Data Stream...</p>
                            </div>
                        ) : listings.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                                {listings.map((listing) => (
                                    <Link key={listing.id} href={`/listings/${listing.id}`} className="group">
                                        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full transition-all duration-500 hover:translate-y-[-8px] hover:border-[#FFB800]/20 relative">
                                            {/* Preview */}
                                            <div className="aspect-[4/5] relative overflow-hidden">
                                                <Image
                                                    src={listing.images?.[0] || 'https://images.unsplash.com/photo-1616422285623-13ff0167c958?q=80&w=800&auto=format&fit=crop'}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                                                {/* Labels */}
                                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                    {listing.is_verified_listing && (
                                                        <span className="bg-[#FFB800] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-heading italic">
                                                            <ShieldCheck className="h-3 w-3" /> Secure Node
                                                        </span>
                                                    )}
                                                    {listing.condition === 'brand_new' && (
                                                        <span className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 font-heading italic">
                                                            Zero Cycle
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quick Price Overlay */}
                                                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest font-heading mb-1 italic">Authorized Value</p>
                                                        <p className="text-white text-3xl font-black italic font-heading tracking-tighter">
                                                            ₦{(listing.price / 1000000).toFixed(1)}<span className="text-[#FFB800] text-sm ml-1 uppercase">M</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-8 space-y-6 flex-1 flex flex-col">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-heading italic">ID: #{listing.id.slice(-6).toUpperCase()}</span>
                                                        <span className="h-1 w-1 rounded-full bg-zinc-800" />
                                                        <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-widest font-heading italic">{listing.category}</span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter line-clamp-2 leading-[1.1] font-heading italic">
                                                        {listing.title}
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 pb-6 border-b border-white/5">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest font-heading">Node</p>
                                                        <div className="text-[10px] font-bold text-zinc-300 flex items-center gap-1 italic truncate">
                                                            <MapPin className="h-2.5 w-2.5 text-[#FFB800]" /> {listing.location || 'Lagos'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest font-heading">Year</p>
                                                        <div className="text-[10px] font-bold text-zinc-300 flex items-center gap-1 italic">
                                                            <Calendar className="h-2.5 w-2.5 text-[#FFB800]" /> {listing.year || '2022'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest font-heading">Rating</p>
                                                        <div className="text-[10px] font-bold text-[#00FF85] flex items-center gap-1 italic">
                                                            <Star className="h-2.5 w-2.5 fill-[#00FF85]" /> 4.9
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Info */}
                                                <div className="mt-auto flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                            <Store className="h-3 w-3 text-zinc-500" />
                                                        </div>
                                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-heading italic">
                                                            {listing.dealer?.display_name || 'Terminal Dealer'}
                                                        </p>
                                                    </div>
                                                    <Zap className="h-3 w-3 text-white/10" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-48 glass-card rounded-[3.5rem] border-dashed border-white/5">
                                <Search className="h-16 w-16 text-zinc-800 mx-auto mb-8 opacity-20" />
                                <h3 className="text-xl font-black text-zinc-500 uppercase tracking-[0.2em] font-heading mb-2">No Matches Found</h3>
                                <p className="text-zinc-600 text-sm font-medium lowercase italic mb-10">Adjust protocol parameters and retry scan.</p>
                                <Button variant="outline" onClick={() => { setSearch(''); setCategory('All Categories'); }} className="border-white/10 text-white rounded-2xl uppercase text-[10px] font-black tracking-[0.2em] h-14 px-10 hover:border-[#FFB800]/30 transition-all font-heading">Reset Terminal</Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
