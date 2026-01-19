'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Loader2, MapPin, MessageCircle, ShoppingCart, ArrowLeft, ShieldCheck, Phone, CreditCard, Zap, AlertTriangle, Box, Activity } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ReviewsSection } from '@/components/ReviewsSection';
import { useFlutterwave, getFlutterwaveConfig } from '@/lib/flutterwave';
import { initiateOPayCheckout } from '@/lib/opay';
import { cn } from '@/lib/utils';

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
            // Handle mock data request explicitly
            const listingId = Array.isArray(params.id) ? params.id[0] : params.id;

            if (listingId && listingId.startsWith('mock-')) {
                const mockListings: Record<string, any> = {
                    'mock-3': {
                        id: 'mock-3',
                        title: '2021 BMW M4 COMPETITION',
                        description: 'Turbocharged, carbon fiber interior, low mileage, competition package, full service history. This vehicle represents the pinnacle of German engineering with its aggressive styling and track-ready performance.',
                        price: 65000000,
                        category: 'Automotive',
                        location: 'Port Harcourt',
                        dealer_id: 'mock_dealer_1',
                        created_at: new Date().toISOString(),
                        images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1555215696-99ac972988c4?auto=format&fit=crop&w=800&q=80'],
                        is_verified_listing: true,
                        year: 2021,
                        make: 'BMW',
                        model: 'M4',
                        condition: 'Tokunbo',
                        mileage: 12500,
                        fuel_type: 'Petrol',
                        transmission: 'Automatic',
                        body_type: 'Coupe',
                        engine_size: '3.0L Twin-Turbo',
                        vin: 'WBS234...',
                        dealer: {
                            id: 'mock_dealer_1',
                            display_name: 'Speed Nation',
                            is_verified: true,
                            store_type: 'physical',
                            phone_number: '08012345678',
                            subscription_plan: 'professional'
                        }
                    }
                };

                const mockListing = mockListings[listingId];
                if (mockListing) {
                    // Force the type
                    setListing(mockListing as unknown as Listing);
                    setLoading(false);
                    return;
                }
            }

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
                .eq('id', listingId)
                .single();

            if (error) {
                console.warn("Complex query failed, trying fallback...", error);

                // Fallback query (step 1: get listing)
                const { data: simpleListing, error: simpleError } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', listingId)
                    .single();

                if (simpleError) throw simpleError;

                // (step 2: get dealer)
                if (simpleListing) {
                    const { data: dealerData } = await supabase
                        .from('users')
                        .select('id, display_name, is_verified, photo_url, store_type, phone_number, subscription_plan')
                        .eq('id', simpleListing.dealer_id)
                        .single();

                    setListing({ ...simpleListing, dealer: dealerData || {} });
                    return;
                }
            }

            setListing(data);
        } catch (err: unknown) {
            console.error('Error fetching listing:', err);
            setError('Asset Signal Lost');
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

        // Mock Handling
        if (listing.id.startsWith('mock-') || listing.dealer.id.startsWith('mock_')) {
            alert('DEMO MODE: Secure Chat Interface initialized. (This is a mock listing, so no real chat will be created).');
            return;
        }

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
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to start chat';
            alert(message);
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

        const isMock = listing.id.startsWith('mock-') || listing.dealer.id.startsWith('mock_');

        setActionLoading(true);

        const txRef = `TX-${Date.now()}-${user.id.slice(0, 5)}`;

        const onSuccess = async (response: unknown) => {
            if (isMock) {
                alert('Mock Payment Successful! (No funds deducted)');
                router.push('/listings'); // Redirect back to listings or orders
                return;
            }

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
            } catch (err: unknown) {
                console.error('Error updating order:', err);
                const message = err instanceof Error ? err.message : 'Payment successful but failed to update order.';
                alert(message);
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
            const plan = listing.dealer.subscription_plan;
            if (plan === 'enterprise') commissionRate = 0.01;
            else if (plan === 'professional') commissionRate = 0.025;

            const platformFee = listing.price * commissionRate;
            const netAmount = listing.price - platformFee;

            // Only create database order if not a mock
            if (!isMock) {
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
            }

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
                // Safe access to phone number
                const phone = user.phone_number || '08000000000';

                const config = getFlutterwaveConfig(
                    txRef,
                    listing.price,
                    user.email,
                    user.displayName,
                    phone,
                    onSuccess,
                    onCancel,
                    flwOptions
                );

                const started = await initFlutterwave(config);
                if (!started) {
                    alert('Failed to launch payment gateway. Please disable ad-blockers or try again.');
                    setActionLoading(false);
                }
            }
        } catch (err: unknown) {
            console.error('Error initiating order:', err);
            const message = err instanceof Error ? err.message : 'Failed to initialize order.';
            alert(message);
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="h-10 w-10 animate-spin text-[#FFB800]" />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4 text-white">
                <div className="glass-card p-10 rounded-[2.5rem] border-red-500/20 text-center max-w-md">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-6" />
                    <p className="text-red-400 font-bold uppercase tracking-widest mb-6">{error || 'Asset Protocol Failed'}</p>
                    <Button onClick={() => router.push('/listings')} className="bg-white/10 text-white hover:bg-white/20">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Stream
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FFB800] selection:text-black pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-4 mx-auto relative z-10 max-w-7xl">
                {/* Header / Breadcrumb */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-[#FFB800] hover:text-[#FFD700] hover:bg-transparent p-0 h-auto text-[10px] font-black uppercase tracking-[0.2em] font-heading"
                        >
                            <ArrowLeft className="mr-2 h-3 w-3" /> Return to Signal
                        </Button>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            {listing.title}
                        </h1>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <span className="flex items-center gap-1.5 text-[#00FF85]"><Activity className="h-3 w-3" /> Active Protocol</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-white">{listing.category}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>ID: #{listing.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Visuals */}
                    <div className="space-y-6">
                        <div className="glass-card rounded-[2.5rem] overflow-hidden p-2 border-white/5 relative group">
                            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative bg-zinc-900">
                                {listing.images && listing.images.length > 0 ? (
                                    <Image
                                        src={listing.images[selectedImage]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700 font-black uppercase tracking-widest">
                                        No Visual Signal
                                    </div>
                                )}

                                {/* Overlay Badges */}
                                <div className="absolute top-6 left-6 flex flex-col gap-3">
                                    {(listing.is_verified_listing || listing.verification_status === 'verified') && (
                                        <div className="bg-[#FFB800] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#FFB800]/20 font-heading italic">
                                            <ShieldCheck className="h-3 w-3" /> Verified Node
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {listing.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={cn(
                                            "aspect-square rounded-2xl overflow-hidden border transition-all relative group",
                                            selectedImage === idx
                                                ? "border-[#FFB800] ring-1 ring-[#FFB800]"
                                                : "border-white/10 hover:border-white/30"
                                        )}
                                    >
                                        <Image
                                            src={img}
                                            alt={`${listing.title} thumbnail`}
                                            fill
                                            className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Interaction & Data */}
                    <div className="space-y-8">
                        {/* Price Card */}
                        <div className="glass-card rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-50">
                                <Zap className="h-24 w-24 text-[#FFB800]/10" />
                            </div>

                            <div className="relative z-10">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] font-heading mb-2">Market Valuation</p>
                                <div className="text-6xl font-black text-white italic font-heading tracking-tighter mb-6">
                                    ₦{listing.price.toLocaleString()}
                                </div>

                                {user && user.id !== listing.dealer.id ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={handlePlaceOrder}
                                                disabled={actionLoading}
                                                className="flex-3 h-16 bg-[#FFB800] text-black hover:bg-[#FFD700] rounded-2xl font-black uppercase tracking-widest text-xs font-heading italic flex-1"
                                            >
                                                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                                Secure Asset Now
                                            </Button>
                                            <Button
                                                onClick={handleAddToCart}
                                                variant="outline"
                                                className="h-16 aspect-square rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center p-0"
                                            >
                                                <ShoppingCart className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        {/* Contact Grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                            <Button onClick={handleContactDealer} variant="outline" className="h-12 rounded-xl border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 text-[10px] uppercase font-bold tracking-widest">
                                                <MessageCircle className="mr-2 h-3 w-3" /> Secure Chat
                                            </Button>
                                            <Button onClick={handleWhatsAppDealer} variant="outline" className="h-12 rounded-xl border-green-500/20 bg-green-500/5 text-green-500 hover:bg-green-500/10 text-[10px] uppercase font-bold tracking-widest">
                                                <Phone className="mr-2 h-3 w-3" /> Direct Uplink
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 text-center">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Owner Mode Active</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Location Node', value: listing.location, icon: MapPin },
                                { label: 'Asset Make', value: listing.make, icon: Box },
                                { label: 'Asset Model', value: listing.model, icon: Box },
                                { label: 'Condition', value: listing.condition, icon: Activity },
                                { label: 'Year', value: listing.year, icon: Activity },
                                { label: 'Mileage', value: listing.mileage ? `${listing.mileage} KM` : 'N/A', icon: Activity },
                            ].map((spec, i) => (
                                <div key={i} className="glass-card p-5 rounded-2xl border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                        <spec.icon className="h-3 w-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{spec.label}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white uppercase truncate">{spec.value || 'N/A'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
                            <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] font-heading mb-6 flex items-center gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
                                Technical Manifest
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                {listing.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
