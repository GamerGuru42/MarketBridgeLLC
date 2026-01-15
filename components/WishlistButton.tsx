'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
    listingId: string;
    initialInWishlist?: boolean;
    className?: string;
}

export function WishlistButton({ listingId, initialInWishlist = false, className }: WishlistButtonProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [inWishlist, setInWishlist] = useState(initialInWishlist);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist/${listingId}`, {
                method: inWishlist ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setInWishlist(!inWishlist);
            }
        } catch (error) {
            console.error('Failed to toggle wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={loading}
            className={className}
        >
            <Heart
                className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
            />
        </Button>
    );
}
