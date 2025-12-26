'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ShoppingBag,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Eye,
    Tag,
    Clock,
    User,
    ChevronDown,
    MoreHorizontal,
    AlertTriangle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Listing {
    id: string;
    title: string;
    price: number;
    category: string;
    status: string;
    images: string[];
    created_at: string;
    dealer_id: string;
    verification_status: string;
    dealer?: {
        display_name: string;
    };
}

export default function AdminListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchListings = async () => {
        setLoading(true);
        try {
            // First get listings
            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .order('created_at', { ascending: false });

            if (listingsError) throw listingsError;

            // Then get dealer names 
            // In a better foundation, we'd use a single join if the schema allows it, 
            // but for simplicity and safety across all environments:
            const dealerIds = Array.from(new Set(listingsData?.map(l => l.dealer_id) || []));
            const { data: dealersData } = await supabase
                .from('users')
                .select('id, display_name')
                .in('id', dealerIds);

            const dealersMap = Object.fromEntries(dealersData?.map(d => [d.id, d.display_name]) || []);

            const enrichedListings = listingsData?.map(l => ({
                ...l,
                dealer: { display_name: dealersMap[l.dealer_id] || 'Unknown Dealer' }
            })) || [];

            setListings(enrichedListings);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const filteredListings = listings.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.dealer?.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
            case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
            case 'sold': return <Badge variant="secondary">Sold</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-100">Market Surveillance</h2>
                    <p className="text-slate-500 text-sm italic font-mono uppercase tracking-widest text-[10px]">Global Listing Observation Terminal</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-800 bg-slate-900/50 gap-2">
                        <Filter className="h-4 w-4" /> Filter Stream
                    </Button>
                </div>
            </div>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                <CardHeader className="pb-3">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Identify asset by title or dealer..."
                            className="pl-10 bg-slate-950 border-slate-800 h-10 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-950/50">
                            <TableRow className="border-slate-800">
                                <TableHead className="w-[400px] uppercase text-[10px] font-black tracking-widest text-slate-500">Asset Data</TableHead>
                                <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-500">Origin/Dealer</TableHead>
                                <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-500">Status</TableHead>
                                <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-500 text-right pr-8">Valuation</TableHead>
                                <TableHead className="w-16"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="mt-2 text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em] italic">Reconstructing Inventory...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredListings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <ShoppingBag className="h-10 w-10 mx-auto text-slate-800 mb-2 opacity-30" />
                                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest italic">Zero active signals detected.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredListings.map((listing) => (
                                    <TableRow key={listing.id} className="border-slate-800/50 hover:bg-slate-800/20 group">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative">
                                                    {listing.images?.[0] ? (
                                                        <Image
                                                            src={listing.images[0]}
                                                            alt={listing.title}
                                                            fill
                                                            className="object-cover transition-transform group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-800 font-bold italic text-xs">
                                                            IMG
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 overflow-hidden">
                                                    <span className="font-bold text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">{listing.category}</span>
                                                        <span className="text-[10px] text-slate-600 italic font-mono flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {new Date(listing.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold border border-primary/20">
                                                    {listing.dealer?.display_name?.[0] || 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-400">{listing.dealer?.display_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(listing.status)}
                                                {listing.verification_status === 'verified' && (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <span className="text-sm font-black text-slate-100 font-mono tracking-tighter">
                                                ₦{listing.price.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 w-48">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/20">
                                                        <Eye className="h-4 w-4" /> Inspect Asset
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-green-500/20 text-green-400">
                                                        <CheckCircle2 className="h-4 w-4" /> Approve Listing
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-red-500/20 text-red-400">
                                                        <AlertTriangle className="h-4 w-4" /> Flag Violation
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-800" />
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-slate-400 hover:text-white">
                                                        <XCircle className="h-4 w-4" /> Decommission
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
