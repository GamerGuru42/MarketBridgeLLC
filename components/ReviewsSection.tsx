'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, Send } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer: {
        id: string;
        display_name: string;
        photo_url: string | null;
    };
}

interface ReviewsSectionProps {
    listingId: string;
    dealerId: string;
}

export function ReviewsSection({ listingId, dealerId }: ReviewsSectionProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newReview, setNewReview] = useState<{ rating: number; comment: string }>({ rating: 5, comment: '' });
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [listingId]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    reviewer:users!reviews_reviewer_id_fkey(
                        id,
                        display_name,
                        photo_url
                    )
                `)
                .eq('listing_id', listingId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setReviews(data || []);

            if (data && data.length > 0) {
                const reviewsData = data as Review[];
                const avg = reviewsData.reduce((acc: number, curr: Review) => acc + curr.rating, 0) / reviewsData.length;
                setAverageRating(avg);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!newReview.comment.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    listing_id: listingId,
                    dealer_id: dealerId,
                    reviewer_id: user.id,
                    rating: newReview.rating,
                    comment: newReview.comment.trim(),
                });

            if (error) throw error;

            setNewReview({ rating: 5, comment: '' });
            fetchReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            console.warn('UI_ALERT:', );
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, interactive = false) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => interactive && setNewReview(prev => ({ ...prev, rating: star }))}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                        disabled={!interactive}
                    >
                        <Star
                            className={`h-4 w-4 ${star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-muted text-muted-foreground'
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Reviews ({reviews.length})</h3>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                        {renderStars(Math.round(averageRating))}
                    </div>
                )}
            </div>

            {/* Review Form */}
            {user && user.id !== dealerId && (
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Rate this product</label>
                                {renderStars(newReview.rating, true)}
                            </div>
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Share your experience..."
                                    value={newReview.comment}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                    className="min-h-[80px]"
                                />
                                <Button type="submit" disabled={submitting || !newReview.comment.trim()} className="h-auto">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={review.reviewer.photo_url || ''} />
                                            <AvatarFallback>{review.reviewer.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold">{review.reviewer.display_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-sm">{review.comment}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
