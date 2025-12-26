'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
}

export default function DealerListingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && user.role !== 'dealer') {
            router.push('/');
            return;
        }

        if (user) {
            fetchListings();
            subscribeToListings();
        }
    }, [user, authLoading]);

    const fetchListings = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
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
            alert('Failed to delete listing');
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
            alert('Failed to update listing status');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading listings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Inventory Node</h1>
                    <p className="text-muted-foreground mt-2">Manage your marketplace assets and deployment status.</p>
                </div>
                <Button asChild className="font-black uppercase tracking-widest italic shadow-xl shadow-primary/20">
                    <Link href="/dealer/listings/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Deploy New Asset
                    </Link>
                </Button>
            </div>

            {listings.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/5">
                    <CardContent className="py-24 text-center">
                        <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Zero Inventory Detected</h3>
                        <p className="text-muted-foreground mb-8 text-sm italic">You haven't deployed any assets to the marketplace yet.</p>
                        <Button asChild className="px-10 h-12 font-bold uppercase tracking-widest text-xs">
                            <Link href="/dealer/listings/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Listing
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden border-primary/10 hover:shadow-2xl transition-all group">
                            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                {listing.images && listing.images.length > 0 ? (
                                    <Image
                                        src={listing.images[0]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                        No Visual Signal
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex flex-col gap-2">
                                    <Badge
                                        className={`font-black uppercase tracking-tighter shadow-lg ${listing.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500 hover:bg-slate-600'}`}
                                    >
                                        {listing.status}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader className="p-5">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</CardTitle>
                                </div>
                                <p className="text-2xl font-black text-primary mt-1">
                                    ₦{listing.price.toLocaleString()}
                                </p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-0">
                                <p className="text-xs text-muted-foreground line-clamp-2 italic mb-6 min-h-[2.5rem]">
                                    {listing.description}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button asChild variant="outline" size="sm" className="font-bold border-slate-200 dark:border-slate-800 hover:bg-primary/5">
                                        <Link href={`/listings/${listing.id}`}>
                                            <Eye className="mr-2 h-3.5 w-3.5" />
                                            PREVIEW
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="font-bold border-slate-200 dark:border-slate-800 hover:bg-primary/5">
                                        <Link href={`/dealer/listings/${listing.id}/edit`}>
                                            <Edit className="mr-2 h-3.5 w-3.5" />
                                            MODIFY
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="font-bold bg-slate-100 dark:bg-slate-800"
                                        onClick={() => toggleStatus(listing)}
                                    >
                                        {listing.status === 'active' ? 'OFFLINE' : 'ONLINE'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="font-bold shadow-lg shadow-destructive/10"
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
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
