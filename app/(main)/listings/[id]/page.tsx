'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Loader2, Search, MapPin, Store, Globe, MessageCircle, ShoppingCart, Package, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ReviewsSection } from '@/components/ReviewsSection';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    location: string;
    dealer_id: string;
    dealer: {
        id: string;
        display_name: string;
        is_verified: boolean;
        photo_url?: string;
        store_type?: string;
    };
    created_at: string;
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        if (params.id) {
            fetchListing();
        }
    }, [params.id]);

    const fetchListing = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('listings')
                .select(`
                    *,
                    dealer:users!listings_dealer_id_fkey(
                        id,
                        display_name,
                        is_verified,
                        photo_url,
                        store_type
                    )
                `)
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setListing(data);
        } catch (err: any) {
            console.error('Error fetching listing:', err);
            setError('Failed to load listing');
        } finally {
            setLoading(false);
        }
    };

    const handleContactDealer = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!listing) return;

        setActionLoading(true);
        try {
            // Check if chat already exists
            const { data: existingChats } = await supabase
                .from('chats')
                .select('id')
                .contains('participants', [user.id, listing.dealer.id])
                .eq('listing_id', listing.id)
                .limit(1);

            if (existingChats && existingChats.length > 0) {
                // Navigate to existing chat
                router.push(`/chats/${existingChats[0].id}`);
            } else {
                // Create new chat
                const { data: newChat, error } = await supabase
                    .from('chats')
                    .insert({
                        participants: [user.id, listing.dealer.id],
                        listing_id: listing.id,
                    })
                    .select()
                    .single();

                if (error) throw error;

                router.push(`/chats/${newChat.id}`);
            }
        } catch (err: any) {
            alert(err.message || 'Failed to start chat');
        } finally {
            setActionLoading(false);
        }
    };

    const { addToCart } = useCart();

    const handleAddToCart = () => {
        if (!listing) return;

        addToCart({
            listingId: listing.id,
            title: listing.title,
            price: listing.price,
            image: listing.images[0] || '',
            dealerId: listing.dealer.id,
        });

        // Optional: Show toast notification
        alert('Added to cart!');
    };

    const handleAddToWishlist = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!listing) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('wishlist')
                .insert({
                    user_id: user.id,
                    listing_id: listing.id
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert('Item is already in your wishlist');
                } else {
                    throw error;
                }
            } else {
                alert('Added to wishlist!');
            }
        } catch (err: any) {
            console.error('Error adding to wishlist:', err);
            alert('Failed to add to wishlist');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!listing) return;

        setActionLoading(true);
        try {
            // Create order with just listing ID for quick buy
            const { error } = await supabase
                .from('orders')
                .insert({
                    buyer_id: user.id,
                    seller_id: listing.dealer.id,
                    listing_id: listing.id,
                    amount: listing.price,
                    status: 'pending',
                });

            if (error) throw error;

            alert('Order placed successfully!');
            router.push('/orders');
        } catch (err: any) {
            console.error('Error placing order:', err);
            alert(err.message || 'Failed to place order');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-destructive mb-4">{error || 'Listing not found'}</p>
                        <Button onClick={() => router.push('/listings')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Listings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container px-4 mx-auto">
                {/* Back Button */}
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Images Section */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                                <img
                                    src={listing.images[selectedImage]}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    No Image Available
                                </div>
                            )}
                        </div>
                        {listing.images && listing.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {listing.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-primary' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={img} alt={`${listing.title} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <h1 className="text-3xl font-bold">{listing.title}</h1>
                                <Badge>{listing.category}</Badge>
                            </div>
                            <p className="text-4xl font-bold text-primary mb-4">
                                ₦{listing.price.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{listing.location || 'Location not specified'}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Description</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        <Separator />

                        {/* Dealer Info */}
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-semibold mb-4">Dealer Information</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    {listing.dealer.photo_url ? (
                                        <img
                                            src={listing.dealer.photo_url}
                                            alt={listing.dealer.display_name}
                                            className="h-12 w-12 rounded-full"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                            {listing.dealer.display_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold flex items-center gap-2">
                                            {listing.dealer.display_name}
                                            {listing.dealer.is_verified && (
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                            )}
                                        </p>
                                        {listing.dealer.store_type && (
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {listing.dealer.store_type} Store
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Separator />

                        {/* Reviews */}
                        <ReviewsSection listingId={listing.id} dealerId={listing.dealer.id} />

                        {/* Actions */}
                        {user && user.id !== listing.dealer.id && (
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleAddToWishlist}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={actionLoading}
                                    >
                                        <Heart className="mr-2 h-4 w-4" />
                                        Wishlist
                                    </Button>
                                    <Button
                                        onClick={handleContactDealer}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={actionLoading}
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Contact Dealer
                                    </Button>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleAddToCart}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Add to Cart
                                    </Button>
                                    <Button
                                        onClick={handlePlaceOrder}
                                        className="flex-1"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Package className="mr-2 h-4 w-4" />
                                        )}
                                        Buy Now
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Please log in to contact the dealer or place an order
                                </p>
                                <Button onClick={() => router.push('/login')} className="w-full">
                                    Log In
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
