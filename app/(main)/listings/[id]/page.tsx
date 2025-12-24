'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Loader2, MapPin, Globe, MessageCircle, ShoppingCart, Package, ArrowLeft, ShieldCheck, Phone, Play, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ReviewsSection } from '@/components/ReviewsSection';
import { useFlutterwave, getFlutterwaveConfig } from '@/lib/flutterwave';
import { initiateOPayCheckout } from '@/lib/opay';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    videos?: string[];
    location: string;
    dealer_id: string;
    dealer: {
        id: string;
        display_name: string;
        is_verified: boolean;
        photo_url?: string;
        store_type?: string;
        phone_number?: string;
        subscription_plan?: string;
    };
    created_at: string;
    make?: string;
    model?: string;
    year?: number;
    condition?: 'Tokunbo' | 'Nigerian Used' | 'Brand New';
    transmission?: 'Automatic' | 'Manual';
    mileage?: number;
    fuel_type?: string;
    engine_size?: string;
    body_type?: string;
    vin?: string;
    is_verified_listing?: boolean;
    verification_status?: 'pending' | 'verified' | 'rejected';
    inspection_report_url?: string;
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { initializePayment: initFlutterwave } = useFlutterwave();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [paymentProvider, setPaymentProvider] = useState<'card' | 'transfer' | 'opay'>('card');

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
                        store_type,
                        phone_number,
                        subscription_plan
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
            const { data: existingChats } = await supabase
                .from('chats')
                .select('id')
                .contains('participants', [user.id, listing.dealer.id])
                .eq('listing_id', listing.id)
                .limit(1);

            if (existingChats && existingChats.length > 0) {
                router.push(`/chats/${existingChats[0].id}`);
            } else {
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

    const handleWhatsAppDealer = () => {
        if (!listing) return;
        const phone = listing.dealer.phone_number || '2348000000000';
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone;
        const message = encodeURIComponent(`Hello, I saw your ${listing.title} on MarketBridge. Is it still available?`);
        window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
    };

    const handleCallDealer = () => {
        if (!listing?.dealer?.phone_number) {
            alert('Dealer phone number not available');
            return;
        }
        window.location.href = `tel:${listing.dealer.phone_number}`;
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
        alert('Added to cart!');
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!listing) return;

        setActionLoading(true);

        const txRef = `TX-${Date.now()}-${user.id.slice(0, 5)}`;

        const onSuccess = async (response: any) => {
            try {
                const { error } = await supabase
                    .from('orders')
                    .update({
                        status: 'paid',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('transaction_ref', txRef);

                if (error) throw error;

                alert('Secure payment successful! Order placed.');
                router.push('/orders');
            } catch (err: any) {
                console.error('Error updating order:', err);
                alert(err.message || 'Payment successful but failed to update order.');
            } finally {
                setActionLoading(false);
            }
        };

        const onCancel = () => {
            setActionLoading(false);
        };

        try {
            // Create pending order first for all payment types
            let commissionRate = 0.05;
            const plan = (listing.dealer as any).subscription_plan;
            if (plan === 'enterprise') commissionRate = 0.01;
            else if (plan === 'professional') commissionRate = 0.025;

            const platformFee = listing.price * commissionRate;
            const netAmount = listing.price - platformFee;

            const { error: orderError } = await supabase
                .from('orders')
                .insert({
                    buyer_id: user.id,
                    seller_id: listing.dealer.id,
                    listing_id: listing.id,
                    amount: listing.price,
                    platform_fee: platformFee,
                    net_amount: netAmount,
                    status: 'pending',
                    transaction_ref: txRef,
                    payment_provider: paymentProvider
                });

            if (orderError) throw orderError;

            if (paymentProvider === 'opay') {
                const res = await initiateOPayCheckout({
                    amount: listing.price,
                    email: user.email,
                    reference: txRef,
                    description: `Payment for ${listing.title} on MarketBridge`
                });

                if (!res.success) {
                    alert(res.message);
                    setActionLoading(false);
                }
                // If successful, user is redirected away
            } else {
                const flwOptions = paymentProvider === 'card' ? 'card' : 'banktransfer';
                const config = getFlutterwaveConfig(
                    txRef,
                    listing.price,
                    user.email,
                    user.displayName,
                    user.phone_number || '08000000000',
                    onSuccess,
                    onCancel,
                    flwOptions
                );
                initFlutterwave(config);
            }
        } catch (err: any) {
            console.error('Error initiating order:', err);
            alert(err.message || 'Failed to initialize order.');
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
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={listing.images[selectedImage]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
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
                                        className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-primary' : 'border-transparent'}`}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={img}
                                                alt={`${listing.title} ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {listing.videos && listing.videos.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Play className="h-5 w-5" />
                                    Product Videos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {listing.videos.map((videoUrl, idx) => (
                                        <div key={idx} className="aspect-video rounded-lg overflow-hidden border bg-muted">
                                            <video
                                                src={videoUrl}
                                                controls
                                                className="w-full h-full object-cover"
                                                preload="metadata"
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <div className="space-y-1">
                                    <h1 className="text-2xl md:text-3xl font-bold">{listing.title}</h1>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{listing.category}</Badge>
                                        {(listing.is_verified_listing || listing.verification_status === 'verified') && (
                                            <Badge className="bg-blue-500 hover:bg-blue-600">
                                                <ShieldCheck className="h-3 w-3 mr-1" /> Verified Listing
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-primary whitespace-nowrap">
                                    ₦{listing.price.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{listing.location || 'Abuja, Nigeria'}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Make</p>
                                <p className="font-semibold">{listing.make || 'Toyota'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Model</p>
                                <p className="font-semibold">{listing.model || 'Camry'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Year</p>
                                <p className="font-semibold">{listing.year || '2018'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Condition</p>
                                <p className="font-semibold">{listing.condition || 'Tokunbo'}</p>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h2 className="text-xl font-semibold mb-2">Description</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        <Separator />

                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-semibold mb-4">Dealer Information</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    {listing.dealer.photo_url ? (
                                        <div className="relative h-12 w-12 shrink-0">
                                            <Image
                                                src={listing.dealer.photo_url}
                                                alt={listing.dealer.display_name}
                                                fill
                                                className="rounded-full object-cover"
                                            />
                                        </div>
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

                        <ReviewsSection listingId={listing.id} dealerId={listing.dealer.id} />

                        {user && user.id !== listing.dealer.id && (
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <Button onClick={handleWhatsAppDealer} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={actionLoading}>
                                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                    </Button>
                                    <Button onClick={handleCallDealer} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10" disabled={actionLoading}>
                                        <Phone className="mr-2 h-4 w-4" /> Call
                                    </Button>
                                    <Button onClick={handleContactDealer} variant="outline" className="flex-1" disabled={actionLoading}>
                                        <Globe className="mr-2 h-4 w-4" /> Chat
                                    </Button>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={handleAddToCart} variant="secondary" className="flex-1">
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                    </Button>
                                    <Button onClick={handlePlaceOrder} className="flex-1" disabled={actionLoading}>
                                        {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                                        Buy Now
                                    </Button>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 border-2 border-dashed border-primary/20 text-center">
                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-3">Choose Secure Payment Method</p>
                                    <div className="flex justify-center flex-wrap gap-2">
                                        <button
                                            onClick={() => setPaymentProvider('card')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${paymentProvider === 'card' ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-background border-muted text-muted-foreground hover:border-primary/50'}`}
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Card
                                        </button>
                                        <button
                                            onClick={() => setPaymentProvider('transfer')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${paymentProvider === 'transfer' ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-background border-muted text-muted-foreground hover:border-primary/50'}`}
                                        >
                                            <Globe className="h-4 w-4" />
                                            Transfer
                                        </button>
                                        <button
                                            onClick={() => setPaymentProvider('opay')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${paymentProvider === 'opay' ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-background border-muted text-muted-foreground hover:border-primary/50'}`}
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            OPay
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-3 italic font-medium">✨ All payments are protected by MarketBridge Escrow Service</p>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-3">Please log in to contact the dealer or place an order</p>
                                <Button onClick={() => router.push('/login')} className="w-full">Log In</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
