'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Store, Globe, Building, ArrowLeft, ArrowUpRight, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VerificationBadge } from '@/components/VerificationBadge';
import { createClient } from '@/lib/supabase/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Seller {
    id: string;
    display_name: string;
    business_name: string;
    location: string;
    is_verified: boolean;
    store_type: string;
    role: string;
    created_at: string;
}

export default function FindSellersPage() {
    const router = useRouter();
    const supabase = createClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [storeTypeFilter, setStoreTypeFilter] = useState('all');
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .in('role', ['dealer', 'student_seller'])
                .eq('is_verified', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setSellers(data);
            } else {
                // Fallback to mock sellers
                const { COMPREHENSIVE_MOCK_LISTINGS } = require('@/lib/mockData');
                const uniqueSellers = Array.from(new Set(COMPREHENSIVE_MOCK_LISTINGS.map((l: any) => l.dealer._id)))
                    .map(id => {
                        const listing = COMPREHENSIVE_MOCK_LISTINGS.find((l: any) => l.dealer._id === id);
                        return {
                            id: listing.dealer._id,
                            display_name: listing.dealer.displayName,
                            business_name: listing.dealer.displayName,
                            location: listing.location,
                            is_verified: listing.dealer.isVerified,
                            store_type: listing.dealer.shopType || 'Online',
                            role: 'dealer',
                            created_at: new Date().toISOString()
                        };
                    });
                setSellers(uniqueSellers);
            }
        } catch (error) {
            console.error('Error fetching sellers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSellers = sellers.filter(seller => {
        const matchesSearch = seller.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seller.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = seller.location?.toLowerCase().includes(locationFilter.toLowerCase());
        const matchesStoreType = storeTypeFilter === 'all' || seller.store_type?.toLowerCase() === storeTypeFilter.toLowerCase();

        return matchesSearch && matchesLocation && matchesStoreType;
    });

    const getStoreIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'online': return <Globe className="h-3 w-3" />;
            case 'physical': return <Store className="h-3 w-3" />;
            case 'both': return <Building className="h-3 w-3" />;
            default: return <Store className="h-3 w-3" />;
        }
    };

    const getRoleLabel = (role: string) => {
        return role === 'student_seller' ? 'Student Merchant' : 'Verified Seller';
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FF6200] selection:text-black pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-4 mx-auto relative z-10 max-w-7xl">
                {/* Header Section */}
                <div className="space-y-8 mb-20">
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="inline-flex items-center text-[#FF6200] hover:text-[#FF6200] p-0 h-auto text-[10px] font-black uppercase tracking-[0.2em] font-heading mb-4 py-3"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Core
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Authorized <span className="text-zinc-500">Sellers.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg font-medium leading-relaxed italic max-w-2xl">
                            Connect with <span className="text-white">verified campus entrepreneurs and sellers</span> across the Abuja network. Trusted by the protocol.
                        </p>
                    </div>

                    {/* Filter Terminal */}
                    <div className="glass-card p-4 rounded-3xl border-white/5 bg-zinc-900/40 backdrop-blur-xl flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Scan by Name or Business..."
                                className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest placeholder:text-zinc-600 focus-visible:ring-[#FF6200]/50"
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-1">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Filter Node Location..."
                                className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest placeholder:text-zinc-600 focus-visible:ring-[#FF6200]/50"
                                value={locationFilter}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationFilter(e.target.value)}
                            />
                        </div>
                        <Select value={storeTypeFilter} onValueChange={setStoreTypeFilter}>
                            <SelectTrigger className="w-full md:w-56 bg-white/5 border-white/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest text-zinc-400">
                                <SelectValue placeholder="Node Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Nodes</SelectItem>
                                <SelectItem value="physical" className="text-[10px] font-black uppercase tracking-widest">Physical Store</SelectItem>
                                <SelectItem value="online" className="text-[10px] font-black uppercase tracking-widest">Online Store</SelectItem>
                                <SelectItem value="both" className="text-[10px] font-black uppercase tracking-widest">Hybrid Store</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-48">
                        <Loader2 className="h-12 w-12 animate-spin text-[#FF6200] mx-auto mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Scanning Seller Network...</p>
                    </div>
                )}

                {/* Sellers Grid */}
                {!loading && filteredSellers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSellers.map((seller) => (
                            <Card key={seller.id} className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#FF6200]/20 transition-all duration-500 relative">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF6200]/50 transition-colors">
                                            <Building className="h-6 w-6 text-zinc-500 group-hover:text-[#FF6200]" />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            {getStoreIcon(seller.store_type)}
                                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{seller.store_type || 'Digital'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-xl font-black uppercase tracking-tighter italic font-heading flex items-center gap-2 text-white">
                                            {seller.business_name || seller.display_name}
                                            <VerificationBadge isVerified={seller.is_verified} showText={false} size="sm" />
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest italic font-heading">
                                            <MapPin className="h-3 w-3 text-[#FF6200]" /> {seller.location || 'FCT - Abuja'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-6">
                                    <div className="flex gap-2">
                                        <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-none text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1 font-heading italic">
                                            {getRoleLabel(seller.role)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-3 w-3 fill-[#FF6200] text-[#FF6200]" />
                                            <span className="text-xs font-black text-white font-heading">4.8</span>
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">(New)</span>
                                        </div>
                                        <Zap className="h-3 w-3 text-white/10" />
                                    </div>
                                </CardContent>
                                <CardFooter className="p-8 pt-0">
                                    <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-[#FF6200] hover:text-black rounded-2xl uppercase text-[10px] font-black tracking-[0.2em] transition-all group/btn font-heading italic" asChild>
                                        <Link href={`/seller/${seller.id}`} className="flex items-center justify-center gap-2">
                                            Access Node <ArrowUpRight className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && filteredSellers.length === 0 && (
                    <div className="text-center py-48 glass-card rounded-[3.5rem] border-dashed border-white/5">
                        <Search className="h-16 w-16 text-zinc-800 mx-auto mb-8 opacity-20" />
                        <h3 className="text-xl font-black text-zinc-500 uppercase tracking-[0.2em] font-heading mb-2">No Matching Nodes</h3>
                        <p className="text-zinc-600 text-sm font-medium lowercase italic">Adjust frequency and retry terminal scan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
