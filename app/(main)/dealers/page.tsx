'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Store, Globe, Building, ArrowLeft, ArrowUpRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VerificationBadge } from '@/components/VerificationBadge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FindDealersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [storeTypeFilter, setStoreTypeFilter] = useState('all');

    interface Dealer {
        id: number;
        name: string;
        location: string;
        rating: number;
        reviews: number;
        verified: boolean;
        specialty: string;
        storeType: string;
        description: string;
    }

    // Mock data for dealers
    const dealers: Dealer[] = [
        {
            id: 1,
            name: "Abuja Elite Motors",
            location: "Maitama, Abuja",
            rating: 4.9,
            reviews: 128,
            verified: true,
            specialty: "Luxury Vehicles",
            storeType: "Physical",
            description: "Premium retailer for luxury and exotic cars with full inspection reports."
        },
        {
            id: 2,
            name: "Garki Auto World",
            location: "Garki Area 1, Abuja",
            rating: 4.7,
            reviews: 85,
            verified: true,
            specialty: "Japanese Vehicles",
            storeType: "Hybrid",
            description: "Specializing in certified used Toyota, Honda, and Nissan vehicles."
        },
        {
            id: 3,
            name: "Wuse Car Mart",
            location: "Wuse II, Abuja",
            rating: 4.5,
            reviews: 42,
            verified: true,
            specialty: "Everyday Cars",
            storeType: "Online",
            description: "Quality affordable used cars for everyday commuting and family use."
        },
        {
            id: 4,
            name: "Capital Wheels",
            location: "Asokoro, Abuja",
            rating: 4.8,
            reviews: 210,
            verified: true,
            specialty: "European Imports",
            storeType: "Physical",
            description: "Best deals on Mercedes-Benz, BMW, and Audi imports in Abuja."
        },
        {
            id: 5,
            name: "Reliable Auto Hub",
            location: "Kuje, Abuja",
            rating: 4.6,
            reviews: 67,
            verified: true,
            specialty: "Used SUVs",
            storeType: "Online",
            description: "Rugged and reliable used SUVs and 4x4 vehicles for Nigerian roads."
        }
    ];

    const filteredDealers = dealers.filter(dealer => {
        const matchesSearch = dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dealer.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = dealer.location.toLowerCase().includes(locationFilter.toLowerCase());
        const matchesStoreType = storeTypeFilter === 'all' || dealer.storeType.toLowerCase() === storeTypeFilter.toLowerCase();

        return matchesSearch && matchesLocation && matchesStoreType;
    });

    const getStoreIcon = (type: string) => {
        switch (type) {
            case 'Online': return <Globe className="h-3 w-3" />;
            case 'Physical': return <Store className="h-3 w-3" />;
            case 'Hybrid': return <Building className="h-3 w-3" />;
            default: return <Store className="h-3 w-3" />;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FFB800] selection:text-black pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-4 mx-auto relative z-10 max-w-7xl">
                {/* Header Section */}
                <div className="space-y-8 mb-20">
                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-[#FFB800] hover:text-[#FFD700] hover:bg-transparent p-0 h-auto text-[10px] font-black uppercase tracking-[0.2em] font-heading"
                        >
                            <ArrowLeft className="mr-2 h-3 w-3" /> Return to Core
                        </Button>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Authorized <span className="text-zinc-500">Nodes.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg font-medium leading-relaxed italic max-w-2xl">
                            Connect with <span className="text-white">vetted automobile terminal dealers</span> across the Nigerian network. Trusted by the protocol.
                        </p>
                    </div>

                    {/* Filter Terminal */}
                    <div className="glass-card p-4 rounded-3xl border-white/5 bg-zinc-900/40 backdrop-blur-xl flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Scan by Name or Specialty..."
                                className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest placeholder:text-zinc-600 focus-visible:ring-[#FFB800]/50"
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-1">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Filter Node Location..."
                                className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest placeholder:text-zinc-600 focus-visible:ring-[#FFB800]/50"
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
                                <SelectItem value="hybrid" className="text-[10px] font-black uppercase tracking-widest">Hybrid Store</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Dealers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredDealers.map((dealer) => (
                        <Card key={dealer.id} className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#FFB800]/20 transition-all duration-500 relative">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FFB800]/50 transition-colors">
                                        <Building className="h-6 w-6 text-zinc-500 group-hover:text-[#FFB800]" />
                                    </div>
                                    <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        {getStoreIcon(dealer.storeType)}
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{dealer.storeType}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic font-heading flex items-center gap-2 text-white">
                                        {dealer.name}
                                        <VerificationBadge isVerified={dealer.verified} showText={false} size="sm" />
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest italic font-heading">
                                        <MapPin className="h-3 w-3 text-[#FFB800]" /> {dealer.location}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-6">
                                <div className="flex gap-2">
                                    <Badge className="bg-[#FFB800]/10 text-[#FFB800] border-none text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1 font-heading italic">
                                        {dealer.specialty}
                                    </Badge>
                                </div>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed italic line-clamp-2">
                                    "{dealer.description}"
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-3 w-3 fill-[#00FF85] text-[#00FF85]" />
                                        <span className="text-xs font-black text-white font-heading">{dealer.rating}</span>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">({dealer.reviews} Logs)</span>
                                    </div>
                                    <Zap className="h-3 w-3 text-white/10" />
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 pt-0">
                                <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-[#FFB800] hover:text-black rounded-2xl uppercase text-[10px] font-black tracking-[0.2em] transition-all group/btn font-heading italic" asChild>
                                    <Link href={`/dealer/${dealer.id}`} className="flex items-center justify-center gap-2">
                                        Access Node <ArrowUpRight className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {filteredDealers.length === 0 && (
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
