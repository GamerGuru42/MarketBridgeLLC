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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Listings</h1>
                    <p className="text-muted-foreground">Manage your product listings</p>
                </div>
                <Button asChild>
                    <Link href="/dealer/listings/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Listing
                    </Link>
                </Button>
            </div>

            {listings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first listing to start selling</p>
                        <Button asChild>
                            <Link href="/dealer/listings/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Listing
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden">
                            <div className="aspect-square bg-muted relative">
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
                                <Badge
                                    className="absolute top-2 right-2"
                                    variant={listing.status === 'active' ? 'default' : 'secondary'}
                                >
                                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                                <p className="text-2xl font-bold text-primary">
                                    ₦{listing.price.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {listing.description}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline" size="sm" className="flex-1">
                                            <Link href={`/listings/${listing.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" size="sm" className="flex-1">
                                            <Link href={`/dealer/listings/${listing.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => toggleStatus(listing)}
                                        >
                                            {listing.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(listing)}
                                            disabled={deletingId === listing.id}
                                        >
                                            {deletingId === listing.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
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
