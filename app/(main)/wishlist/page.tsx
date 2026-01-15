'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, MapPin, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-8">
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                <h1 className="text-3xl font-bold">My Wishlist</h1>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
                    <p className="text-muted-foreground mb-6">Start adding items you love!</p>
                    <Button asChild>
                        <Link href="/listings">Browse Products</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlistItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <Link href={`/listings/${item.id}`}>
                                <div className="aspect-square bg-muted relative">
                                    {item.images?.[0] && (
                                        <img
                                            src={item.images[0]}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            </Link>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                                <p className="text-2xl font-bold text-primary">₦{item.price.toLocaleString()}</p>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {item.location || 'Location not specified'}
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleRemove(item.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
