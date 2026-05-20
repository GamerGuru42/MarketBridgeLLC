'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, ThumbsUp, MessageSquare, ShieldCheck, Image as ImageIcon, X } from 'lucide-react';

interface Review {
    id: string;
    escrow_agreement_id: string | null;
    reviewer_id: string;
    subject_id: string;
    listing_id: string | null;
    rating: number;
    comment: string;
    photo_urls: string[];
    dealer_reply: string | null;
    dealer_reply_at: string | null;
    updated_at: string;
    helpful_count: number;
    status: 'pending' | 'approved' | 'flagged' | 'hidden';
    created_at: string;
    reviewer: {
        id: string;
        display_name: string;
        photo_url: string | null;
    };
    listing?: {
        id: string;
        title: string;
    } | null;
}

interface ReviewsSectionProps {
    listingId?: string;
    dealerId: string;
}

export function ReviewsSection({ listingId, dealerId }: ReviewsSectionProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingIds, setVotingIds] = useState<string[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, string>>({}); // reviewId -> vote_type ('helpful')
    
    // Replying state
    const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    
    // Lightbox image
    const [activeImage, setActiveImage] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, [listingId, dealerId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            // Fetch reviews from the database where subject_id is the dealer
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    reviewer:users!reviews_reviewer_id_fkey(
                        id,
                        display_name,
                        photo_url
                    ),
                    listing:listings(
                        id,
                        title
                    )
                `)
                .eq('subject_id', dealerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);

            // If user is logged in, fetch their votes for these reviews
            if (user && data && data.length > 0) {
                const reviewIds = data.map(r => r.id);
                const { data: votes } = await supabase
                    .from('review_votes')
                    .select('review_id, vote_type')
                    .eq('user_id', user.id)
                    .in('review_id', reviewIds);

                if (votes) {
                    const votesMap: Record<string, string> = {};
                    votes.forEach(v => {
                        votesMap[v.review_id] = v.vote_type;
                    });
                    setUserVotes(votesMap);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Helpful Vote Toggle
    const handleVote = async (reviewId: string) => {
        if (!user) {
            alert('Please sign in to vote.');
            return;
        }

        if (votingIds.includes(reviewId)) return;
        setVotingIds(prev => [...prev, reviewId]);

        try {
            const response = await fetch(`/api/reviews/${reviewId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voteType: 'helpful' })
            });

            if (!response.ok) throw new Error('Failed to submit vote');
            const result = await response.json();

            // Optimistic update of local states
            setUserVotes(prev => {
                const next = { ...prev };
                if (result.action === 'removed') {
                    delete next[reviewId];
                } else {
                    next[reviewId] = 'helpful';
                }
                return next;
            });

            setReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    return {
                        ...r,
                        helpful_count: result.action === 'removed' 
                            ? Math.max(0, r.helpful_count - 1) 
                            : r.helpful_count + 1
                    };
                }
                return r;
            }));

        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setVotingIds(prev => prev.filter(id => id !== reviewId));
        }
    };

    // Handle Dealer Reply Submit
    const handleReplySubmit = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setSubmittingReply(true);

        try {
            const response = await fetch(`/api/reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replyText: replyText.trim() })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to submit reply');
            }

            // Update reviews list locally
            setReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    return {
                        ...r,
                        dealer_reply: replyText.trim(),
                        dealer_reply_at: new Date().toISOString()
                    };
                }
                return r;
            }));

            setReplyingReviewId(null);
            setReplyText('');
        } catch (error: any) {
            console.error('Error replying to review:', error);
            alert(error.message || 'Failed to submit reply.');
        } finally {
            setSubmittingReply(false);
        }
    };

    // Star rendering helper
    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3 w-3 ${star <= rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'fill-zinc-800 text-zinc-700'
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
            </div>
        );
    }

    // Calculations
    const approvedReviews = reviews.filter(r => r.status === 'approved' || r.reviewer_id === user?.id || r.subject_id === user?.id);
    const totalReviewsCount = approvedReviews.length;
    const averageRating = totalReviewsCount > 0 
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount 
        : 0;

    // Distribution stats
    const ratingCounts = [0, 0, 0, 0, 0]; // index 0 = 1 star, ..., index 4 = 5 star
    approvedReviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            ratingCounts[r.rating - 1]++;
        }
    });

    // Partition reviews for listing vs other
    const currentListingReviews = listingId 
        ? approvedReviews.filter(r => r.listing_id === listingId)
        : [];
    const otherSellersReviews = listingId
        ? approvedReviews.filter(r => r.listing_id !== listingId)
        : approvedReviews;

    // Single Review Card component
    const ReviewCard = ({ review }: { review: Review }) => {
        const isOwnReview = user?.id === review.reviewer_id;
        const isDealer = user?.id === review.subject_id;
        const isReplying = replyingReviewId === review.id;

        return (
            <Card className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10">
                                <AvatarImage src={review.reviewer.photo_url || ''} />
                                <AvatarFallback className="bg-zinc-800 text-white font-bold">
                                    {review.reviewer.display_name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black uppercase tracking-wider text-white">
                                        {review.reviewer.display_name}
                                    </span>
                                    {review.escrow_agreement_id && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/20 text-[9px] font-black uppercase text-[#FF6200] tracking-widest">
                                            <ShieldCheck className="h-2.5 w-2.5" /> Verified Purchase
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-white/30 block mt-0.5">
                                    {new Date(review.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            {renderStars(review.rating)}
                            
                            {/* Moderation Status Badges */}
                            {review.status !== 'approved' && (
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    review.status === 'pending' 
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                    {review.status} moderation
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Listing Title Context (if looking at dealer reviews page) */}
                    {!listingId && review.listing && (
                        <div className="text-[9px] text-[#FF6200] font-black uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md inline-block">
                            Item: {review.listing.title}
                        </div>
                    )}

                    {/* Comment */}
                    <p className="text-sm text-white/80 leading-relaxed font-medium">
                        {review.comment}
                    </p>

                    {/* Review Photos */}
                    {review.photo_urls && review.photo_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {review.photo_urls.map((url, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => setActiveImage(url)}
                                    className="h-16 w-16 rounded-xl border border-white/5 overflow-hidden cursor-pointer hover:border-[#FF6200]/50 transition-all duration-200 relative group"
                                >
                                    <img src={url} alt={`Review photo ${i+1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <ImageIcon className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions Panel (Helpful Vote + Reply Trigger) */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <Button
                            onClick={() => handleVote(review.id)}
                            disabled={votingIds.includes(review.id)}
                            variant="ghost"
                            className={`h-8 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                userVotes[review.id] === 'helpful'
                                    ? 'bg-[#FF6200]/10 text-[#FF6200] hover:bg-[#FF6200]/20'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <ThumbsUp className={`h-3 w-3 ${userVotes[review.id] === 'helpful' ? 'fill-current' : ''}`} />
                            Helpful ({review.helpful_count})
                        </Button>

                        {isDealer && !review.dealer_reply && !isReplying && (
                            <Button
                                onClick={() => {
                                    setReplyingReviewId(review.id);
                                    setReplyText('');
                                }}
                                variant="ghost"
                                className="h-8 px-3 rounded-lg text-xs font-black uppercase tracking-wider text-[#FF6200] hover:bg-[#FF6200]/10 flex items-center gap-1.5"
                            >
                                <MessageSquare className="h-3 w-3" />
                                Reply Response
                            </Button>
                        )}
                    </div>

                    {/* Dealer Reply Text Area (Form) */}
                    {isReplying && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF6200]">
                                Write dealer response
                            </h4>
                            <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Explain resolution, thank the buyer, or address concerns..."
                                className="bg-black/50 border-white/10 text-white rounded-lg text-xs min-h-[70px] focus-visible:ring-[#FF6200]"
                                maxLength={500}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    onClick={() => setReplyingReviewId(null)}
                                    variant="ghost"
                                    className="h-8 text-xs font-black uppercase tracking-wider text-white/55 hover:bg-white/5 rounded-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleReplySubmit(review.id)}
                                    disabled={submittingReply || !replyText.trim()}
                                    className="h-8 text-xs font-black uppercase tracking-wider bg-[#FF6200] hover:bg-[#FF6200]/80 text-black rounded-lg"
                                >
                                    {submittingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Post Reply'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Existing Dealer Reply Block */}
                    {review.dealer_reply && (
                        <div className="bg-[#FF6200]/5 border-l-2 border-[#FF6200] p-4 rounded-r-xl space-y-2 mt-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-md bg-[#FF6200] flex items-center justify-center">
                                        <MessageSquare className="h-3 w-3 text-black" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                                        Dealer Response
                                    </span>
                                </div>
                                {review.dealer_reply_at && (
                                    <span className="text-[8px] text-white/30">
                                        {new Date(review.dealer_reply_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-white/70 italic leading-relaxed">
                                "{review.dealer_reply}"
                            </p>
                            {isDealer && !isReplying && (
                                <button
                                    onClick={() => {
                                        setReplyingReviewId(review.id);
                                        setReplyText(review.dealer_reply || '');
                                    }}
                                    className="text-[9px] font-black uppercase tracking-widest text-[#FF6200] hover:underline"
                                >
                                    Edit Response
                                </button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-12">
            {/* Top statistics summary panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-zinc-950/40 p-8 rounded-3xl border border-white/5">
                {/* Score */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 border-b md:border-b-0 md:border-r border-white/5">
                    <span className="text-6xl font-black italic text-white tracking-tighter">
                        {totalReviewsCount > 0 ? averageRating.toFixed(1) : '0.0'}
                    </span>
                    <div className="flex gap-1 my-3">
                        {renderStars(Math.round(averageRating))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        Based on {totalReviewsCount} reviews
                    </span>
                </div>

                {/* Rating distribution chart */}
                <div className="md:col-span-8 flex flex-col justify-center space-y-2 p-2">
                    {[5, 4, 3, 2, 1].map(stars => {
                        const count = ratingCounts[stars - 1];
                        const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-white/40 w-3 tracking-widest">{stars}</span>
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                                <div className="h-2 flex-1 bg-zinc-900 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#FF6200] rounded-full transition-all duration-500" 
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-white/40 w-8 text-right tracking-widest">
                                    {Math.round(pct)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* List Partitioning */}
            {totalReviewsCount === 0 ? (
                <div className="text-center py-16 bg-zinc-950/20 rounded-3xl border border-dashed border-white/5">
                    <Star className="h-10 w-10 text-white/10 mx-auto mb-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">
                        No Reviews Yet
                    </h3>
                    <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">
                        This seller has not received any reviews yet. Completed transactions will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Part A: Reviews for this specific listing */}
                    {listingId && currentListingReviews.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#FF6200] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200]" />
                                Reviews for this listing ({currentListingReviews.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                {currentListingReviews.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Part B: Other reviews for this seller */}
                    {otherSellersReviews.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                {listingId ? `Other reviews for this seller (${otherSellersReviews.length})` : `Seller reviews (${otherSellersReviews.length})`}
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                {otherSellersReviews.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox / Modal for photos */}
            {activeImage && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <button 
                        onClick={() => setActiveImage(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                        <img src={activeImage} alt="Expanded review photo" className="object-contain max-h-[85vh] w-auto mx-auto" />
                    </div>
                </div>
            )}
        </div>
    );
}
