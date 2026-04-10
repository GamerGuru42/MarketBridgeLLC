'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    Clock,
    MoreHorizontal,
    AlertTriangle,
    Star,
    Zap,
    Loader2
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
    is_sponsored: boolean;
    sponsored_until: string | null;
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
            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .order('is_sponsored', { ascending: false })
                .order('created_at', { ascending: false });

            if (listingsError) throw listingsError;

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

    const togglePromote = async (listing: Listing) => {
        const nowSponsored = !listing.is_sponsored;
        const sponsoredUntil = nowSponsored
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const { error } = await supabase
            .from('listings')
            .update({ is_sponsored: nowSponsored, sponsored_until: sponsoredUntil })
            .eq('id', listing.id);

        if (error) {
            console.error('Failed to toggle promotion:', error);
            return;
        }

        setListings(prev => prev.map(l =>
            l.id === listing.id
                ? { ...l, is_sponsored: nowSponsored, sponsored_until: sponsoredUntil }
                : l
        ));
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
            case 'active': return <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20 font-black uppercase text-[10px]">Active</Badge>;
            case 'pending': return <Badge className="bg-muted text-muted-foreground border-border font-black uppercase text-[10px]">Pending</Badge>;
            case 'sold': return <Badge variant="secondary" className="font-black uppercase text-[10px]">Sold</Badge>;
            default: return <Badge variant="outline" className="font-black uppercase text-[10px]">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-10 font-sans selection:bg-primary selection:text-primary-foreground">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-heading">Inventory Surveillance</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            Asset <span className="text-primary">Monitor</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl">
                            <Filter className="h-4 w-4" /> Filter Stream
                        </Button>
                    </div>
                </div>

                <Card className="bg-card border-border rounded-[2.5rem] shadow-sm overflow-hidden transition-colors duration-300">
                    <CardHeader className="bg-muted/10 p-6 border-b border-border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Identify asset by title or dealer..."
                                className="pl-10 bg-background border-border h-11 text-foreground placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="w-[400px] py-6 px-8 uppercase text-[10px] font-black tracking-widest text-muted-foreground font-heading">Asset Data</TableHead>
                                        <TableHead className="py-6 px-4 uppercase text-[10px] font-black tracking-widest text-muted-foreground font-heading">Origin / Dealer</TableHead>
                                        <TableHead className="py-6 px-4 uppercase text-[10px] font-black tracking-widest text-muted-foreground font-heading">Status</TableHead>
                                        <TableHead className="py-6 px-4 uppercase text-[10px] font-black tracking-widest text-muted-foreground font-heading">Boost</TableHead>
                                        <TableHead className="py-6 px-8 uppercase text-[10px] font-black tracking-widest text-muted-foreground text-right font-heading">Valuation</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                    <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Reconstructing Inventory...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredListings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <ShoppingBag className="h-12 w-12 text-muted-foreground/10" />
                                                    <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest italic opacity-40">Zero active Notices detected.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredListings.map((listing) => (
                                            <TableRow key={listing.id} className="border-border hover:bg-muted/10 transition-colors group">
                                                <TableCell className="px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-16 w-16 rounded-2xl bg-muted border border-border overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform shadow-sm">
                                                            {listing.images?.[0] ? (
                                                                <Image
                                                                    src={listing.images[0]}
                                                                    alt={listing.title}
                                                                    fill
                                                                    className="object-cover transition-transform group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground/20 font-black italic text-[10px]">
                                                                    NO IMG
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-1 overflow-hidden">
                                                            <span className="font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors text-base uppercase tracking-tighter italic">{listing.title}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">{listing.category}</span>
                                                                <span className="text-[10px] text-muted-foreground/60 font-bold flex items-center gap-1.5">
                                                                    <Clock className="h-3 w-3" /> {new Date(listing.created_at).toLocaleDateString().split('/').join(' / ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] text-primary font-black border border-primary/20">
                                                            {listing.dealer?.display_name?.[0] || 'U'}
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-tighter text-foreground/70">{listing.dealer?.display_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(listing.status)}
                                                        {listing.verification_status === 'verified' && (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    {listing.is_sponsored ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sponsored</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground/30 font-mono">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right px-8">
                                                    <span className="text-lg font-black text-foreground font-mono tracking-tighter italic">
                                                        ₦{listing.price.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-64 bg-card border-border shadow-2xl p-2 rounded-2xl">
                                                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground font-heading px-3 py-2">Asset Control</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="bg-border my-1" />
                                                            <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors">
                                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Eye className="h-4 w-4" /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs uppercase">Inspect Asset</span>
                                                                    <span className="text-[10px] opacity-40">View full technical data</span>
                                                                </div>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-green-500/10 focus:text-green-500 transition-colors">
                                                                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle2 className="h-4 w-4" /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs uppercase">Approve Listing</span>
                                                                    <span className="text-[10px] opacity-40">Establish store presence</span>
                                                                </div>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors"
                                                                onClick={() => togglePromote(listing)}
                                                            >
                                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Zap className="h-4 w-4" /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs uppercase">{listing.is_sponsored ? 'Remove Boost' : 'Apply Boost'}</span>
                                                                    <span className="text-[10px] opacity-40">7-day sponsored cycle</span>
                                                                </div>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="bg-border my-1" />

                                                            <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-red-500/10 focus:text-red-500 transition-colors">
                                                                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><AlertTriangle className="h-4 w-4" /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs uppercase">Flag Violation</span>
                                                                    <span className="text-[10px] opacity-40">Mark for manual audit</span>
                                                                </div>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-zinc-800 focus:text-white transition-colors">
                                                                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-white"><XCircle className="h-4 w-4" /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs uppercase">Decommission</span>
                                                                    <span className="text-[10px] opacity-40">Remove asset from grid</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center py-10 opacity-20 hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground">Global Registry Uplink // Sector 7G Active</p>
                </div>
            </div>
        </div>
    );
}
