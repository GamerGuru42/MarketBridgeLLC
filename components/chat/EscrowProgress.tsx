'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, AlertCircle, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export type EscrowStep = {
    id: string;
    step_order: number;
    description: string;
    status: 'pending' | 'completed' | 'disputed';
    completed_at?: string;
};

export type EscrowAgreement = {
    id: string;
    amount: number;
    status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
    buyer_id: string;
    seller_id: string;
    tos_accepted_buyer: boolean;
    tos_accepted_seller: boolean;
};

interface EscrowProgressProps {
    agreement: EscrowAgreement;
    steps: EscrowStep[];
    onUpdate: () => void; // Callback to refresh data after action
}

export function EscrowProgress({ agreement, steps, onUpdate }: EscrowProgressProps) {
    const { user } = useAuth();
    const [loadingStep, setLoadingStep] = useState<string | null>(null);

    // Dispute Modal State
    const [isDisputeOpen, setIsDisputeOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeDescription, setDisputeDescription] = useState('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    // Review Modal State
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    if (!agreement) return null;

    const currentStepIndex = steps.findIndex(s => s.status === 'pending');
    const isComplete = currentStepIndex === -1 && steps.every(s => s.status === 'completed');

    const handleAdvance = async (stepId: string, photoUrl?: string) => {
        if (!user) return;
        setLoadingStep(stepId);
        try {
            const res = await fetch('/api/escrow/advance-step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agreementId: agreement.id,
                    stepId,
                    userId: user.id,
                    photoUrl
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onUpdate();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to advance step');
        } finally {
            setLoadingStep(null);
        }
    };

    const handleDisputeSubmit = async () => {
        if (!user || !disputeReason || !disputeDescription) return;
        setSubmittingDispute(true);
        try {
            const res = await fetch(`/api/escrow/agreement/${agreement.id}/dispute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: disputeReason,
                    description: disputeDescription,
                    userId: user.id
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setIsDisputeOpen(false);
            onUpdate();
        } catch (err: any) {
            console.error('Failed to submit dispute:', err);
            alert(err.message || 'Failed to file a dispute');
        } finally {
            setSubmittingDispute(false);
        }
    };

    const handleReviewSubmit = async () => {
        if (!user || !reviewRating) return;
        setSubmittingReview(true);
        try {
            const res = await fetch(`/api/escrow/agreement/${agreement.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: reviewRating,
                    comment: reviewComment,
                    userId: user.id
                })
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error?.includes('already reviewed')) {
                    setHasReviewed(true);
                }
                throw new Error(data.error);
            }
            setHasReviewed(true);
            setIsReviewOpen(false);
            alert('Review submitted successfully!');
        } catch (err: any) {
            console.error('Failed to submit review:', err);
            alert(err.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderActionButton = (step: EscrowStep) => {
        if (!user) return null;
        const isBuyer = user.id === agreement.buyer_id;
        const isSeller = user.id === agreement.seller_id;
        const desc = step.description.toLowerCase();

        const getButton = (label: string, onClick: () => void, variant: any = "default") => (
            <Button 
                onClick={onClick} 
                disabled={loadingStep === step.id}
                size="sm" 
                variant={variant}
                className={variant === 'default' ? "bg-[#FF6200] text-black hover:bg-[#FF6200]/90 text-[10px] h-7" : "text-[10px] h-7"}
            >
                {loadingStep === step.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {label}
            </Button>
        );

        if (desc.includes('pending') || desc.includes('payment secured') || desc.includes('payment captured')) {
            if (isBuyer) return getButton('Mark as Paid / Secured', () => handleAdvance(step.id));
            return <p className="text-[10px] text-zinc-500 italic">Waiting for buyer...</p>;
        }
        
        if (desc.includes('delivery') || desc.includes('ship')) {
            if (isSeller) return getButton('Update Delivery Status', () => handleAdvance(step.id));
            return <p className="text-[10px] text-zinc-500 italic">Waiting for seller...</p>;
        }

        if (desc.includes('received')) {
            if (isBuyer) return getButton('Confirm Receipt', () => handleAdvance(step.id));
            return <p className="text-[10px] text-zinc-500 italic">Waiting for buyer...</p>;
        }

        if (desc.includes('inspect')) {
            if (isBuyer) {
                return (
                    <div className="flex gap-2">
                        {getButton('Approve Inspection', () => handleAdvance(step.id))}
                        <Button 
                            onClick={() => {
                                const url = prompt("Enter Image URL for Proof (or leave empty to just approve faster):");
                                handleAdvance(step.id, url || undefined);
                            }} 
                            disabled={loadingStep === step.id}
                            size="sm" 
                            variant="outline"
                            className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white text-[10px] h-7"
                        >
                            Upload Photo Proof
                        </Button>
                    </div>
                );
            }
            return <p className="text-[10px] text-zinc-500 italic">Waiting for buyer...</p>;
        }

        if (desc.includes('completed') || desc.includes('funds released')) {
            if (isBuyer || isSeller) return getButton('Finalize & Release Funds', () => handleAdvance(step.id));
        }

        return null;
    };

    // Status visual
    const statusColor = {
        pending: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
        active: 'text-[#FF6200] bg-[#FF6200]/10 border-[#FF6200]/20',
        completed: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        disputed: 'text-red-500 bg-red-500/10 border-red-500/20',
        cancelled: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    }[agreement.status] || 'text-zinc-500';

    return (
        <Card className="bg-black/40 border-white/10 mb-4 overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full animate-pulse",
                        agreement.status === 'active' ? "bg-[#FF6200]" : "bg-zinc-500"
                    )} />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6200]">
                        SECURE TRANSACTION #{agreement.id.slice(0, 8)}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {user?.id && [agreement.buyer_id, agreement.seller_id].includes(user.id) && !['completed', 'disputed', 'cancelled', 'cancelled'].includes(agreement.status) && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-6 px-2 text-[9px] uppercase tracking-wider font-bold shadow-none hover:bg-red-600/20 hover:text-red-500 bg-red-500/10 text-red-500 border border-red-500/20"
                            onClick={() => setIsDisputeOpen(true)}
                        >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Dispute
                        </Button>
                    )}
                    <div className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border", statusColor)}>
                        {agreement.status}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Amount Held</p>
                        <p className="text-2xl font-black text-white">
                            ₦{agreement.amount.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="relative pl-2 space-y-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/10" />
                    {steps.map((step, index) => {
                        const isDone = step.status === 'completed';
                        const isCurrent = step.status === 'pending' && (index === 0 || steps[index - 1].status === 'completed');

                        return (
                            <div key={step.id} className="relative flex gap-4 items-start">
                                <div className={cn(
                                    "z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors bg-black",
                                    isDone ? "border-emerald-500 text-emerald-500" :
                                        isCurrent ? "border-[#FF6200] text-[#FF6200]" : "border-zinc-700 text-zinc-700"
                                )}>
                                    {isDone ? <Check className="h-3 w-3" /> :
                                        isCurrent ? <Clock className="h-3 w-3 animate-pulse" /> :
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <p className={cn(
                                        "text-xs font-bold uppercase tracking-wide",
                                        isDone ? "text-emerald-500 line-through opacity-70" :
                                            isCurrent ? "text-white" : "text-zinc-600"
                                    )}>
                                        {step.description}
                                    </p>
                                    {isCurrent && (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-[10px] text-[#FF6200] animate-pulse">
                                                Awaiting Action...
                                            </p>
                                            {renderActionButton(step)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isComplete && user?.id === agreement.buyer_id && !hasReviewed && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center text-center">
                        <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-xl p-4 w-full">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-2">Rate Your Experience</h4>
                            <p className="text-zinc-400 text-[10px] mb-3">Help build community trust by leaving a public review for the seller.</p>
                            <Button 
                                onClick={() => setIsReviewOpen(true)}
                                className="bg-[#FF6200] hover:bg-[#FF6200]/90 text-black text-xs font-bold uppercase tracking-widest h-8"
                            >
                                <Star className="h-3 w-3 mr-1.5 fill-current" />
                                Leave a Review
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-red-500 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" /> Escalate Dispute
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            MarketBridge support will intervene to mediate this transaction.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="uppercase text-xs font-bold tracking-widest text-zinc-500">Reason</Label>
                            <Input
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                placeholder="E.g., Item not as described, Never received"
                                className="bg-black border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-xs font-bold tracking-widest text-zinc-500">Detailed Description</Label>
                            <Textarea
                                value={disputeDescription}
                                onChange={(e) => setDisputeDescription(e.target.value)}
                                placeholder="Provide evidence or context for our mediation team..."
                                className="bg-black border-white/10 text-white min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDisputeOpen(false)} className="text-zinc-400">Cancel</Button>
                        <Button 
                            onClick={handleDisputeSubmit} 
                            disabled={!disputeReason || !disputeDescription || submittingDispute}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest"
                        >
                            {submittingDispute ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Submit Dispute
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-white flex items-center gap-2">
                            <Star className="h-5 w-5 text-[#FF6200]" /> Review Dealer
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Rate your experience to help others make informed decisions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={cn(
                                            "h-8 w-8 transition-colors",
                                            star <= reviewRating ? "fill-[#FF6200] text-[#FF6200]" : "text-zinc-700"
                                        )} 
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-xs font-bold tracking-widest text-zinc-500">Public Comment (Optional)</Label>
                            <Textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="What was it like transacting with this seller?"
                                className="bg-black border-white/10 text-white min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="text-zinc-400">Cancel</Button>
                        <Button 
                            onClick={handleReviewSubmit} 
                            disabled={submittingReview}
                            className="bg-[#FF6200] hover:bg-[#FF6200]/90 text-black font-bold uppercase tracking-widest"
                        >
                            {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Submit Rating
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}