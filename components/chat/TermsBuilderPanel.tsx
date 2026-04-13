'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    DollarSign, 
    MapPin, 
    Clock, 
    Check, 
    ArrowRight, 
    Loader2, 
    History,
    AlertCircle,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Terms {
    price: number;
    location: string;
    delivery_date: string;
    notes: string;
}

interface TermsBuilderPanelProps {
    orderId: string;
    buyerId: string;
    sellerId: string;
    currentUserId: string;
    listingPrice: number;
    listingLocation: string;
    onTransition?: (newStage: number) => void;
}

export function TermsBuilderPanel({
    orderId,
    buyerId,
    sellerId,
    currentUserId,
    listingPrice,
    listingLocation,
    onTransition
}: TermsBuilderPanelProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [terms, setTerms] = useState<Terms>({
        price: listingPrice,
        location: listingLocation,
        delivery_date: '',
        notes: ''
    });
    const [lastProposedBy, setLastProposedBy] = useState<string | null>(null);
    const [buyerAccepted, setBuyerAccepted] = useState(false);
    const [sellerAccepted, setSellerAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isBuyer = currentUserId === buyerId;
    const isSeller = currentUserId === sellerId;
    const hasBothAccepted = buyerAccepted && sellerAccepted;

    useEffect(() => {
        fetchOrderTerms();
        const subscription = subscribeToOrder();
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [orderId]);

    const fetchOrderTerms = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (data) {
            setTerms({
                price: Number(data.amount),
                location: data.contract_terms?.location || listingLocation,
                delivery_date: data.contract_terms?.delivery_date || '',
                notes: data.contract_terms?.notes || ''
            });
            setBuyerAccepted(data.terms_accepted_by_buyer);
            setSellerAccepted(data.terms_accepted_by_seller);
            setLastProposedBy(data.contract_terms?.last_proposed_by || null);
        }
        setLoading(false);
    };

    const subscribeToOrder = () => {
        return supabase
            .channel(`order_terms_${orderId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                (payload) => {
                    const data = payload.new;
                    setTerms({
                        price: Number(data.amount),
                        location: data.contract_terms?.location || listingLocation,
                        delivery_date: data.contract_terms?.delivery_date || '',
                        notes: data.contract_terms?.notes || ''
                    });
                    setBuyerAccepted(data.terms_accepted_by_buyer);
                    setSellerAccepted(data.terms_accepted_by_seller);
                    setLastProposedBy(data.contract_terms?.last_proposed_by || null);
                    
                    if (data.escrow_stage > 2 && onTransition) {
                        onTransition(data.escrow_stage);
                    }
                }
            )
            .subscribe();
    };

    const handlePropose = async () => {
        setSaving(true);
        setError(null);
        try {
            const updatedTerms = {
                ...terms,
                last_proposed_by: currentUserId
            };

            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    amount: terms.price,
                    contract_terms: updatedTerms,
                    terms_accepted_by_buyer: isBuyer,
                    terms_accepted_by_seller: isSeller,
                    status: 'negotiating',
                    escrow_stage: 2
                })
                .eq('id', orderId);

            if (updateError) throw updateError;
            
            // Send system message to chat
            await supabase.from('messages').insert({
                conversation_id: (await getConversationId()),
                sender_id: currentUserId,
                content: `📝 Updated Terms Proposed: ₦${terms.price.toLocaleString()} at ${terms.location}. Please review and accept.`,
                is_system: true
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAccept = async () => {
        setSaving(true);
        try {
            const updateData: any = {
                terms_accepted_by_buyer: isBuyer ? true : buyerAccepted,
                terms_accepted_by_seller: isSeller ? true : sellerAccepted
            };

            // Check if this acceptance completes the agreement
            const willBeBothAccepted = (isBuyer || buyerAccepted) && (isSeller || sellerAccepted);
            
            if (willBeBothAccepted) {
                updateData.escrow_stage = 2; // In Stage 2: terms finalized
                updateData.status = 'negotiating';
                // Note: Transition to Stage 3 (Payment) usually happens after a separate CTA or automatically
            }

            const { error: updateError } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (updateError) throw updateError;

            await supabase.from('messages').insert({
                conversation_id: (await getConversationId()),
                sender_id: currentUserId,
                content: `✅ ${isBuyer ? 'Buyer' : 'Seller'} has accepted the negotiated terms.`,
                is_system: true
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const getConversationId = async () => {
        const { data } = await supabase.from('conversations').select('id').or(`participant1_id.eq.${currentUserId},participant2_id.eq.${currentUserId}`).order('last_message_at', { ascending: false }).limit(1).single();
        return data?.id;
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6200]" />
        </div>
    );

    const hasChanged = terms.price !== listingPrice || terms.location !== listingLocation || !!terms.delivery_date;
    const isWaitingForOther = (isBuyer && buyerAccepted && !sellerAccepted) || (isSeller && sellerAccepted && !buyerAccepted);
    const needToAccept = (isBuyer && !buyerAccepted && lastProposedBy === sellerId) || (isSeller && !sellerAccepted && lastProposedBy === buyerId);

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all">
            {/* Header */}
            <div className="bg-[#FF6200]/5 px-8 py-5 border-b border-[#FF6200]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-[#FF6200]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6200]">Stage 2: Terms Builder</span>
                </div>
                {hasBothAccepted ? (
                    <Badge className="bg-green-500 text-white font-black uppercase tracking-widest text-[8px] px-3 py-1 rounded-full border-0">
                        Contract Locked
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-zinc-400 border-zinc-200 dark:border-white/10 font-black uppercase tracking-widest text-[8px] px-3 py-1">
                        In Negotiation
                    </Badge>
                )}
            </div>

            <div className="p-8 space-y-8">
                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Agreed Price (₦)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#FF6200]" />
                            <Input 
                                type="number"
                                value={terms.price}
                                onChange={(e) => {
                                    setTerms({ ...terms, price: Number(e.target.value) });
                                    setBuyerAccepted(false);
                                    setSellerAccepted(false);
                                }}
                                disabled={hasBothAccepted}
                                className="h-14 pl-12 rounded-[1.25rem] bg-[#FAFAFA] dark:bg-white/5 border-zinc-100 dark:border-white/5 font-black text-lg tracking-tight"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Meetup/Delivery Point</Label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#FF6200]" />
                            <Input 
                                value={terms.location}
                                onChange={(e) => {
                                    setTerms({ ...terms, location: e.target.value });
                                    setBuyerAccepted(false);
                                    setSellerAccepted(false);
                                }}
                                disabled={hasBothAccepted}
                                placeholder="e.g. Block A Cafeteria"
                                className="h-14 pl-12 rounded-[1.25rem] bg-[#FAFAFA] dark:bg-white/5 border-zinc-100 dark:border-white/5 font-bold text-sm tracking-wide"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Scheduled Date</Label>
                        <div className="relative group">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#FF6200]" />
                            <Input 
                                value={terms.delivery_date}
                                onChange={(e) => {
                                    setTerms({ ...terms, delivery_date: e.target.value });
                                    setBuyerAccepted(false);
                                    setSellerAccepted(false);
                                }}
                                disabled={hasBothAccepted}
                                placeholder="e.g. Tomorrow at 2 PM"
                                className="h-14 pl-12 rounded-[1.25rem] bg-[#FAFAFA] dark:bg-white/5 border-zinc-100 dark:border-white/5 font-bold text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Special Terms (Optional)</Label>
                        <Input 
                            value={terms.notes}
                            onChange={(e) => {
                                setTerms({ ...terms, notes: e.target.value });
                                setBuyerAccepted(false);
                                setSellerAccepted(false);
                            }}
                            disabled={hasBothAccepted}
                            placeholder="e.g. No returns for food"
                            className="h-14 px-6 rounded-[1.25rem] bg-[#FAFAFA] dark:bg-white/5 border-zinc-100 dark:border-white/5 font-bold text-sm italic"
                        />
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                        buyerAccepted ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-400"
                    )}>
                        {buyerAccepted ? <ShieldCheck className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-pulse" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">Buyer Signature</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                        sellerAccepted ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-400"
                    )}>
                        {sellerAccepted ? <ShieldCheck className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-pulse" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">Seller Signature</span>
                    </div>
                </div>

                {/* Counter-party Context */}
                {isWaitingForOther && (
                    <div className="bg-[#FF6200]/5 border border-[#FF6200]/10 p-5 rounded-3xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="h-5 w-5 text-[#FF6200] shrink-0" />
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                            Proposals sent. Waiting for the {isBuyer ? 'Seller' : 'Buyer'} to counter or sign the electronic agreement.
                        </p>
                    </div>
                )}

                {/* Actons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    {!hasBothAccepted ? (
                        <>
                            <Button 
                                onClick={handlePropose}
                                disabled={saving || (isBuyer && buyerAccepted) || (isSeller && sellerAccepted)}
                                className="flex-1 h-14 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest text-[10px] group transition-all"
                            >
                                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <>Propose Terms <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>
                            
                            {needToAccept && (
                                <Button 
                                    onClick={handleAccept}
                                    className="flex-1 h-14 bg-[#FF6200] text-black hover:bg-[#FF7A29] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_4px_20px_rgba(255,98,0,0.3)] transition-all animate-pulse"
                                >
                                    Accept Proposed Terms <Check className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-zinc-900 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                            <ShieldCheck className="absolute -bottom-6 -right-6 h-32 w-32 text-green-500 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FF6200] mb-1">Contract Execution</h3>
                                <p className="text-[10px] font-medium text-zinc-400 italic">Terms are locked. Proceed to Stage 3 to escrow funds and begin transit.</p>
                            </div>
                            <Button 
                                className="w-full md:w-auto px-8 h-12 bg-[#FF6200] text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#FF7A29] transition-all relative z-10"
                                onClick={() => onTransition?.(3)}
                            >
                                Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
