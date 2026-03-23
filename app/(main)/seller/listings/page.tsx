'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Edit, Trash2, Eye, Loader2, Zap, X, Clock, TrendingUp, Flame, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    status: 'active' | 'sold' | 'inactive';
    location: string | null;
    created_at: string;
    is_sponsored?: boolean;
    sponsored_until?: string | null;
    sponsored_tier?: 'basic' | 'featured' | 'premium' | null;
    view_count?: number;
    expires_at?: string | null;
}

export default function SellerListingsPage() {
    const { user, sessionUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [promotingId, setPromotingId] = useState<string | null>(null);
    // Boost modal state
    const [boostListing, setBoostListing] = useState<Listing | null>(null);
    const [boostLoading, setBoostLoading] = useState(false);
    const [boostError, setBoostError] = useState('');

    useEffect(() => {
        if (authLoading) return;

        if (!sessionUser) {
            router.push('/login');
            return;
        }

        if (!user) return;

        // MANDATORY EMAIL VERIFICATION CHECK
        if (!user.email_verified) {
            router.push('/verify-email');
            return;
        }

        const allowedRoles = ['dealer', 'student_seller', 'ceo', 'admin', 'technical_admin'];
        if (!allowedRoles.includes(user.role)) {
            router.push('/');
            return;
        }

        fetchListings();
        const unsubscribe = subscribeToListings();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, sessionUser, authLoading, router]);

    const fetchListings = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*, view_count, expires_at, is_sponsored, sponsored_until, sponsored_tier')
                .eq('dealer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setListings(data || []);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToListings = () => {
        if (!user) return;

        const subscription = supabase
            .channel('dealer_listings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'listings',
                    filter: `dealer_id=eq.${user.id}`,
                },
                () => {
                    fetchListings();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const handleDeleteClick = (listing: Listing) => {
        setSelectedListing(listing);
        setShowDeleteDialog(true);
    };

    const handleDelete = async () => {
        if (!selectedListing) return;

        setDeletingId(selectedListing.id);
        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', selectedListing.id);

            if (error) throw error;

            setShowDeleteDialog(false);
            setSelectedListing(null);
            fetchListings();
        } catch (err) {
            console.error('Failed to delete listing:', err);
            alert('Failed to delete listing. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const toggleStatus = async (listing: Listing) => {
        try {
            const newStatus = listing.status === 'active' ? 'inactive' : 'active';
            const { error } = await supabase
                .from('listings')
                .update({ status: newStatus })
                .eq('id', listing.id);

            if (error) throw error;

            fetchListings();
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update listing status. Please try again.');
        }
    };

    // Open the boost tier modal
    const handleBoostClick = (listing: Listing) => {
        setBoostListing(listing);
        setBoostError('');
    };

    // Handle tier selection → Paystack checkout
    const handleBoostTier = async (tier: 'basic' | 'featured' | 'premium') => {
        if (!boostListing) return;
        setBoostLoading(true);
        setBoostError('');
        try {
            const res = await fetch('/api/paystack/boost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: boostListing.id, tier })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Redirect to Paystack checkout
            window.location.href = data.authorization_url;
        } catch (err: any) {
            setBoostError(err.message || 'Failed to initialize boost payment');
        } finally {
            setBoostLoading(false);
        }
    };

    const handleBoostWithCoins = async () => {
        if (!user || !user.id || !boostListing) return;
        setBoostLoading(true);
        setBoostError('');
        try {
            const { data: userData } = await supabase.from('users').select('coins_balance').eq('id', user.id).single();
            const currentCoins = userData?.coins_balance || 0;
            if (currentCoins < 50) {
                throw new Error("Insufficient MarketCoins. You need 50 MC.");
            }

            // Deduct 50 MC and grant premium
            await supabase.from('users').update({ coins_balance: currentCoins - 50 }).eq('id', user.id);
            const expires = new Date();
            expires.setDate(expires.getDate() + 14);
            await supabase.from('listings').update({
                is_sponsored: true,
                sponsored_tier: 'premium',
                sponsored_until: expires.toISOString()
            }).eq('id', boostListing.id);

            alert("Premium Boost applied successfully for 50 MC!");
            setBoostListing(null);
            fetchListings();
        } catch (err: any) {
            setBoostError(err.message || 'Failed to boost with coins');
        } finally {
            setBoostLoading(false);
        }
    };

    const BOOST_TIERS = [
        {
            id: 'basic' as const,
            label: 'Basic Boost',
            price: '₦500',
            duration: '3 days',
            icon: <Zap className="h-5 w-5 text-[#FF6200]" />,
            perks: ['Pinned to top of your category', '3-day visibility window', '+10 MarketCoins reward'],
            color: 'border-zinc-200 hover:border-[#FF6200]/40',
            badge: null,
        },
        {
            id: 'featured' as const,
            label: 'Featured',
            price: '₦1,500',
            duration: '7 days',
            icon: <TrendingUp className="h-5 w-5 text-amber-400" />,
            perks: ['Pinned for 7 days', 'FEATURED badge on card', '+25 MarketCoins reward'],
            color: 'border-amber-500/30 hover:border-amber-400/60',
            badge: 'POPULAR',
        },
        {
            id: 'premium' as const,
            label: 'Premium Spotlight',
            price: '50 MC',
            duration: '14 days',
            icon: <Crown className="h-5 w-5 text-yellow-300" />,
            perks: ['Pinned for 14 days', 'PREMIUM badge + homepage exposure', 'Cost: 50 MarketCoins'],
            color: 'border-yellow-500/30 hover:border-yellow-400/60',
            badge: 'BEST VALUE',
        },
    ];



    if (authLoading || loading) {
        return (
            <div className="container mx-auto py-10 px-4 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-12 w-64 bg-white" />
                        <Skeleton className="h-4 w-96 mt-2 bg-white" />
                    </div>
                    <Skeleton className="h-12 w-48 rounded-xl bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-zinc-200 shadow-sm rounded-[2rem] border-zinc-100 overflow-hidden flex flex-col h-full shadow-2xl">
                            <Skeleton className="aspect-[4/3] w-full rounded-none bg-white" />
                            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-3/4 bg-white" />
                                    <Skeleton className="h-8 w-1/3 bg-[#FF6200]/20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full bg-white" />
                                    <Skeleton className="h-4 w-2/3 bg-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-100">
                                    <Skeleton className="h-8 w-full rounded-xl bg-white" />
                                    <Skeleton className="h-8 w-full rounded-xl bg-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Inventory Campus</h1>
                    <p className="text-muted-foreground mt-2">Manage your marketplace assets and deployment status.</p>
                </div>
                <Button asChild className="bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest italic shadow-xl shadow-[#FF6200]/20 rounded-xl">
                    <Link href="/seller/listings/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Deploy New Asset
                    </Link>
                </Button>
            </div>

            {listings.length === 0 ? (
                <EmptyState
                    icon={<Package className="h-10 w-10 text-[#FF6200]" />}
                    title="Zero Inventory Detected"
                    description="You haven't deployed any assets to the marketplace yet."
                    actionLabel="Create First Listing"
                    actionHref="/seller/listings/new"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden border-zinc-100 bg-white0 hover:border-[#FF6200]/30 hover:shadow-2xl transition-all group rounded-[2rem]">
                            <div className="aspect-[4/3] bg-white relative overflow-hidden">
                                {listing.images && listing.images.length > 0 ? (
                                    <Image
                                        src={listing.images[0]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                        No Visual Notice
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex flex-col gap-2">
                                    <Badge
                                        className={`font-black uppercase tracking-tighter shadow-lg ${listing.status === 'active' ? 'bg-[#FF6200] text-black hover:bg-[#FF7A29]' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-700'}`}
                                    >
                                        {listing.status}
                                    </Badge>
                                    {listing.is_sponsored && (
                                        <Badge className="bg-[#FF6200] text-black font-black uppercase tracking-tighter shadow-lg gap-1 border-none">
                                            <Zap className="h-3 w-3 fill-black" />
                                            Sponsored
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardHeader className="p-5">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter line-clamp-1 group-hover:text-[#FF6200] transition-colors text-zinc-900">{listing.title}</CardTitle>
                                </div>
                                <p className="text-2xl font-black text-[#FF6200] mt-1">
                                    ₦{listing.price.toLocaleString()}
                                </p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-0">
                                <p className="text-xs text-muted-foreground line-clamp-2 italic mb-6 min-h-[2.5rem]">
                                    {listing.description}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button asChild variant="outline" size="sm" className="font-bold border-zinc-200 hover:border-[#FF6200]/30 hover:bg-white rounded-xl text-[10px] uppercase tracking-widest font-heading">
                                        <Link href={`/listings/${listing.id}`}>
                                            <Eye className="mr-2 h-3.5 w-3.5" />
                                            PREVIEW
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="font-bold border-zinc-200 hover:border-[#FF6200]/30 hover:bg-white rounded-xl text-[10px] uppercase tracking-widest font-heading">
                                        <Link href={`/seller/listings/${listing.id}/edit`}>
                                            <Edit className="mr-2 h-3.5 w-3.5" />
                                            MODIFY
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="font-bold bg-zinc-100 text-zinc-900 hover:bg-zinc-700 rounded-xl text-[10px] uppercase tracking-widest font-heading"
                                        onClick={() => toggleStatus(listing)}
                                    >
                                        {listing.status === 'active' ? 'OFFLINE' : 'ONLINE'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="font-bold shadow-lg shadow-destructive/10 rounded-xl text-[10px] uppercase tracking-widest font-heading"
                                        onClick={() => handleDeleteClick(listing)}
                                        disabled={deletingId === listing.id}
                                    >
                                        {deletingId === listing.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                PURGE
                                            </>
                                        )}
                                    </Button>

                                    {/* Show expiry warning if listing expires within 7 days */}
                                    {listing.expires_at && (new Date(listing.expires_at).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000 && listing.status === 'active' && (
                                        <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-1">
                                            <Clock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                                Expires {new Date(listing.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} — Boost to extend reach
                                            </span>
                                        </div>
                                    )}

                                    {/* Boost button — only for active non-sponsored listings */}
                                    {listing.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`col-span-2 font-black italic uppercase tracking-widest text-[10px] mt-2 h-10 shadow-lg rounded-xl transition-all ${listing.is_sponsored
                                                ? 'border-[#FF6200]/40 text-[#FF6200]/60 cursor-default'
                                                : 'border-[#FF6200]/20 text-[#FF6200] hover:bg-[#FF6200] hover:text-black shadow-[#FF6200]/5'
                                                }`}
                                            onClick={() => !listing.is_sponsored && handleBoostClick(listing)}
                                            disabled={listing.is_sponsored}
                                        >
                                            <Zap className="mr-2 h-3 w-3 fill-current" />
                                            {listing.is_sponsored
                                                ? `Boosted until ${new Date(listing.sponsored_until!).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
                                                : 'Boost This Listing →'}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ─── Boost Modal ───────────────────────────────────────── */}
            {boostListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAFAFA]/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-xl bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setBoostListing(null)}
                            aria-label="Close boost modal"
                            title="Close"
                            className="absolute top-6 right-6 text-zinc-900/30 hover:text-zinc-900 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Flame className="h-6 w-6 text-[#FF6200]" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Boost Listing</h2>
                            </div>
                            <p className="text-zinc-500 text-sm font-medium italic">
                                &ldquo;{boostListing.title}&rdquo; — choose your boost tier
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            {BOOST_TIERS.map((tier) => (
                                <button
                                    key={tier.id}
                                    onClick={() => tier.id === 'premium' ? handleBoostWithCoins() : handleBoostTier(tier.id)}
                                    disabled={boostLoading}
                                    className={`w-full text-left p-5 rounded-2xl border bg-[#FAFAFA]/30 transition-all hover:bg-[#FAFAFA]/60 relative ${tier.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {tier.badge && (
                                        <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#FF6200] text-black">
                                            {tier.badge}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-3 mb-3">
                                        {tier.icon}
                                        <span className="font-black uppercase tracking-wider text-sm">{tier.label}</span>
                                        <span className="ml-auto text-2xl font-black text-zinc-900">{tier.price}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="h-3.5 w-3.5 text-zinc-900/30" />
                                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">{tier.duration}</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {tier.perks.map((perk, i) => (
                                            <li key={i} className="text-[11px] text-zinc-500 flex items-center gap-2">
                                                <span className="h-1 w-1 rounded-full bg-[#FF6200]/60 flex-shrink-0" />
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            ))}
                        </div>

                        {boostError && (
                            <p className="text-red-400 text-sm font-bold mb-4 text-center">{boostError}</p>
                        )}

                        {boostLoading && (
                            <div className="flex items-center justify-center gap-3 text-zinc-600 text-sm font-bold">
                                <Loader2 className="h-4 w-4 animate-spin text-[#FF6200]" />
                                Taking you to checkout...
                            </div>
                        )}

                        <p className="text-center text-[10px] text-zinc-900/20 mt-4 uppercase tracking-widest">
                            Secure payment via Paystack — No recurring charges
                        </p>
                    </div>
                </div>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedListing?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
