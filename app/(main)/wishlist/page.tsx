'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, MapPin, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function WishlistPage() {
    const { user, loading, refreshUser } = useAuth();
    const router = useRouter();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        const fetchWishlistItems = async () => {
            if (!user?.wishlist || user.wishlist.length === 0) {
                setWishlistItems([]);
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .in('id', user.wishlist);

                if (error) throw error;
                setWishlistItems(data || []);
            } catch (error) {
                console.error('Failed to fetch wishlist items', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchWishlistItems();
        }
    }, [user, loading, router]);

    const handleRemove = async (listingId: string) => {
        if (!user) return;

        try {
            const newWishlist = (user.wishlist || []).filter(id => id !== listingId);
            
            const { error } = await supabase
                .from('users')
                .update({ wishlist: newWishlist })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state
            setWishlistItems(prev => prev.filter(item => item.id !== listingId));
            
            // Refresh user context to update wishlist array
            await refreshUser();
            
        } catch (error) {
            console.error('Failed to remove from wishlist', error);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 relative selection:bg-red-500 selection:text-white pt-28 pb-32">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Archived Desires</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            My <span className="text-red-500">Wishlist</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic">
                            Tracking <span className="text-zinc-900 font-bold">{wishlistItems.length} saved assets</span> in the marketplace.
                        </p>
                    </div>

                    <Link href="/buyer/dashboard">
                        <Button variant="outline" className="h-12 border-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all font-heading bg-white shadow-sm hover:shadow-md">
                            <ArrowLeft className="mr-2 h-3 w-3" /> Dashboard
                        </Button>
                    </Link>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="relative text-center py-40 bg-white/50 backdrop-blur-md border border-zinc-200 rounded-[3rem] shadow-sm overflow-hidden group hover:border-red-500/20 transition-all duration-700">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-red-500/10 transition-colors duration-700" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Heart className="h-10 w-10 text-red-500 fill-red-500/50" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading text-zinc-900">Wishlist is empty</h3>
                                <p className="text-zinc-500 font-medium mt-2 max-w-sm mx-auto">Start browsing the marketplace and save items you want to keep track of.</p>
                            </div>
                            <Button asChild className="h-14 px-10 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-black uppercase tracking-widest font-heading border-none shadow-[0_10px_30px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-1">
                                <Link href="/marketplace">Launch Marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {wishlistItems.map((item) => (
                            <Card key={item.id} className="overflow-hidden border border-zinc-200 shadow-sm rounded-[2rem] hover:border-red-500/30 transition-all duration-500 group bg-white relative hover:-translate-y-2 hover:shadow-xl">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-red-500/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRemove(item.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                
                                <Link href={`/marketplace/${item.id}`} className="block h-full flex flex-col">
                                    <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden shrink-0">
                                        {item.images?.[0] ? (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Heart className="h-8 w-8 text-zinc-300" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                                    </div>
                                    <CardContent className="p-6 flex-1 flex flex-col justify-between border-t border-zinc-100 bg-white relative z-20">
                                        <div className="mb-4">
                                            <CardTitle className="text-lg font-black uppercase tracking-tighter italic font-heading line-clamp-2 text-zinc-900 group-hover:text-red-500 transition-colors">
                                                {item.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-3">
                                                <MapPin className="h-3 w-3 text-red-500" />
                                                {item.location || 'Location missing'}
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-red-500 italic tracking-tighter">₦{item.price.toLocaleString()}</p>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
