'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star, Store, Globe, Building, Phone, Mail, MessageCircle, ShieldCheck, Package, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { VerificationBadge } from '@/components/VerificationBadge';
import { createClient } from '@/lib/supabase/client';

interface SellerProfile {
    id: string;
    display_name: string;
    business_name: string;
    location: string;
    store_type: string;
    phone_number?: string;
    email: string;
    photo_url?: string;
    is_verified: boolean;
    created_at: string;
}

export default function SellerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellerProfile();
    }, [params?.id]);

    const fetchSellerProfile = async () => {
        try {
            // Fetch seller profile
            const { data: sellerData, error: sellerError } = await supabase
                .from('users')
                .select('*')
                .eq('id', params?.id)
                .in('role', ['dealer', 'student_seller'])
                .single();

            if (sellerError) throw sellerError;
            setSeller(sellerData);

            // Fetch seller's listings
            const { data: listingsData } = await supabase
                .from('listings')
                .select('*')
                .eq('dealer_id', params?.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(6);

            setListings(listingsData || []);
        } catch (error) {
            console.error('Error fetching seller:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStoreIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'online': return <Globe className="h-4 w-4" />;
            case 'physical': return <Store className="h-4 w-4" />;
            case 'both': return <Building className="h-4 w-4" />;
            default: return <Store className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Loading Seller Campus...</p>
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <ShieldCheck className="h-16 w-16 text-white/10 mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white/40">Seller Campus Not Found</h2>
                    <p className="text-white/30 text-sm">This seller profile does not exist or has been deactivated.</p>
                    <Button onClick={() => router.push('/sellers')} className="bg-[#FF6600] text-black font-black uppercase tracking-widest">
                        Return to Sellers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FF6200] selection:text-black pt-28 pb-20">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-4 mx-auto relative z-10 max-w-7xl">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/sellers"
                        className="inline-flex items-center text-[#FF6200] hover:text-[#FF6200] text-[10px] font-black uppercase tracking-[0.2em] mb-8 py-3"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to Sellers
                    </Link>
                </div>

                {/* Seller Profile Card */}
                <div className="glass-card p-12 rounded-[3.5rem] border-white/5 mb-12">
                    <div className="flex flex-col md:flex-row gap-12 items-start">
                        {/* Profile Image */}
                        <div className="h-32 w-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {seller.photo_url ? (
                                <img src={seller.photo_url} alt={seller.display_name} className="h-full w-full object-cover" />
                            ) : (
                                <Building className="h-12 w-12 text-white/20" />
                            )}
                        </div>

                        {/* Seller Info */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                                        {seller.business_name || seller.display_name}
                                    </h1>
                                    <VerificationBadge isVerified={seller.is_verified} showText={false} />
                                </div>
                                <div className="flex items-center gap-4 text-white/40">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-[#FF6200]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{seller.location}</span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <div className="flex items-center gap-2">
                                        {getStoreIcon(seller.store_type)}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{seller.store_type || 'Digital'} Hub</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {seller.phone_number && (
                                    <a href={`tel:${seller.phone_number}`} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                        <Phone className="h-4 w-4 text-[#FF6200]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{seller.phone_number}</span>
                                    </a>
                                )}
                                {seller.email && (
                                    <a href={`mailto:${seller.email}`} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                        <Mail className="h-4 w-4 text-[#FF6200]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Contact</span>
                                    </a>
                                )}
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <Button className="bg-[#FF6200] text-black font-black uppercase tracking-widest h-14 px-8 rounded-2xl hover:bg-[#FF6200]">
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Initiate Secure Chat
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seller Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Active Listings', value: listings.length, icon: Package },
                        { label: 'Verified Campus', value: seller.is_verified ? 'YES' : 'PENDING', icon: ShieldCheck },
                        { label: 'Member Since', value: new Date(seller.created_at).getFullYear(), icon: Clock },
                        { label: 'Response Time', value: '< 2H', icon: Zap }
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <stat.icon className="h-4 w-4 text-[#FF6200]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-black uppercase tracking-tighter italic">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Seller Listings */}
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8">
                        Active <span className="text-white/40">Inventory</span>
                    </h2>

                    {listings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((listing) => (
                                <Link key={listing.id} href={`/listings/${listing.id}`}>
                                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2rem] overflow-hidden group hover:border-[#FF6200]/20 transition-all duration-500 h-full">
                                        <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                                            {listing.images && listing.images[0] ? (
                                                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-12 w-12 text-white/10" />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-black uppercase tracking-tighter italic mb-2 line-clamp-1">{listing.title}</h3>
                                            <p className="text-2xl font-black text-[#FF6200] mb-4">₦{listing.price?.toLocaleString()}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                <MapPin className="h-3 w-3" />
                                                {listing.location}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-20 rounded-[3rem] border-dashed border-white/5 text-center">
                            <Package className="h-16 w-16 text-white/10 mx-auto mb-6 opacity-20" />
                            <h3 className="text-xl font-black text-white/40 uppercase tracking-widest mb-2">No Active Listings</h3>
                            <p className="text-white/30 text-sm">This seller currently has no active inventory.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
