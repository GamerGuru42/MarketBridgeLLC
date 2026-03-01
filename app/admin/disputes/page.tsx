'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle, Clock, Eye, MessageCircle, Gavel, ShieldCheck, DollarSign, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Dispute {
    id: string;
    order_id?: string;
    escrow_agreement_id?: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved' | 'rejected';
    created_at: string;
    filed_by_id: string;
    resolution_notes?: string;
    filed_by?: {
        display_name: string;
        email: string;
        photo_url?: string;
    };
    order?: {
        id: string;
        amount: number;
        status: string;
        listing: { title: string; images: string[] };
        buyer_id: string;
        seller_id: string;
    };
    escrow_agreement?: {
        id: string;
        amount: number;
        status: string;
        buyer_id: string;
        seller_id: string;
    };
}

export default function DisputesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const role = user?.role || '';
        if (user && !['admin', 'operations_admin', 'ceo', 'cofounder', 'super_admin', 'technical_admin'].includes(role)) {
            // Check fallback via DB if role missing
        }

        if (user) {
            fetchDisputes();
        }
    }, [user, authLoading]);

    const fetchDisputes = async () => {
        try {
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    filed_by:users!filed_by_id(display_name, email, photo_url),
                    order:orders(id, amount, status, buyer_id, seller_id, listing:listings(title, images)),
                    escrow_agreement:escrow_agreements(id, amount, status, buyer_id, seller_id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDisputes(data || []);
        } catch (error: unknown) {
            console.error('Error fetching disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if (!selectedDispute || !resolutionNotes) return;
        setActionLoading(true);

        try {
            const { error } = await supabase
                .from('disputes')
                .update({
                    status,
                    resolution_notes: resolutionNotes,
                    resolved_by: user?.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedDispute.id);

            if (error) throw error;

            if (status === 'resolved') {
                if (selectedDispute.order_id) {
                    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', selectedDispute.order_id);
                } else if (selectedDispute.escrow_agreement_id) {
                    await supabase.from('escrow_agreements').update({ status: 'refunded' }).eq('id', selectedDispute.escrow_agreement_id);
                }
            } else if (status === 'rejected') {
                if (selectedDispute.order_id) {
                    await supabase.from('orders').update({ status: 'completed' }).eq('id', selectedDispute.order_id);
                } else if (selectedDispute.escrow_agreement_id) {
                    await supabase.from('escrow_agreements').update({ status: 'released' }).eq('id', selectedDispute.escrow_agreement_id);
                }
            }

            fetchDisputes();
            setSelectedDispute(null);
            setResolutionNotes('');
        } catch (error: unknown) {
            console.error('Error updating dispute:', error);
            alert('Failed to update dispute');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-zinc-900">
            <div className="text-center">
                <div className="animate-spin h-12 w-12 border-2 border-[#FF6200] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="font-mono text-zinc-500 uppercase tracking-widest text-xs">Loading Jurisdictions...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 p-6 md:p-12 font-sans selection:bg-[#FF6200] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-200 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-[#FF6200]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 font-heading">Operations Command</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            Dispute <span className="text-[#FF6200]">Tribunal</span>
                        </h1>
                    </div>
                </div>

                <Tabs defaultValue="active" className="space-y-8">
                    <TabsList className="bg-transparent border-b border-zinc-200 w-full justify-start rounded-none h-auto p-0 gap-8">
                        <TabsTrigger value="active" className="data-[state=active]:border-[#FF6200] data-[state=active]:text-[#FF6200] border-b-2 border-transparent rounded-none px-0 pb-4 font-black uppercase tracking-widest text-xs transition-all font-heading bg-transparent">Active Cases</TabsTrigger>
                        <TabsTrigger value="closed" className="data-[state=active]:border-[#FF6200] data-[state=active]:text-[#FF6200] border-b-2 border-transparent rounded-none px-0 pb-4 font-black uppercase tracking-widest text-xs transition-all font-heading bg-transparent">Closed Cases</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-4">
                        {disputes.filter(d => ['open', 'under_review'].includes(d.status)).length === 0 ? (
                            <div className="py-24 text-center border border-dashed border-zinc-200 rounded-3xl bg-white">
                                <Gavel className="h-16 w-16 text-zinc-900/20 mx-auto mb-6" />
                                <p className="text-zinc-500 font-black uppercase tracking-widest text-sm font-heading">No active disputes in jurisdiction</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {disputes.filter(d => ['open', 'under_review'].includes(d.status)).map(dispute => (
                                    <DisputeCard key={dispute.id} dispute={dispute} onView={() => setSelectedDispute(dispute)} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
                <DialogContent className="max-w-2xl bg-zinc-50 border-zinc-200 text-zinc-900 p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-zinc-200 bg-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter italic font-heading flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-[#FF6200]" />
                            Case #{selectedDispute?.id.slice(0, 8).toUpperCase()}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDispute && (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-zinc-200">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-heading mb-1">Plaintiff</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold">
                                            {selectedDispute.filed_by?.display_name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-sm">{selectedDispute.filed_by?.display_name}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-heading mb-1">Dispute Value</p>
                                    <p className="text-xl font-black text-[#FF6200] font-heading">
                                        ₦{(selectedDispute.order?.amount || selectedDispute.escrow_agreement?.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-heading">Incident Report</p>
                                <div className="bg-[#FAFAFA] border border-zinc-200 p-4 rounded-xl text-sm font-medium text-zinc-700 leading-relaxed font-mono">
                                    "{selectedDispute.description}"
                                </div>
                            </div>

                            {['open', 'under_review'].includes(selectedDispute.status) && (
                                <div className="space-y-4 pt-4 border-t border-zinc-200">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-heading">Tribunal Verdict</p>
                                        <Textarea
                                            placeholder="Enter final verdict notes..."
                                            value={resolutionNotes}
                                            onChange={(e) => setResolutionNotes(e.target.value)}
                                            className="bg-[#FAFAFA] border-zinc-200 text-zinc-900 placeholder:text-zinc-900/20 min-h-[100px]"
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStatusUpdate('under_review')}
                                            disabled={actionLoading}
                                            className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                                        >
                                            <Clock className="h-4 w-4 mr-2" /> Keep Reviewing
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleStatusUpdate('rejected')}
                                            disabled={actionLoading || !resolutionNotes}
                                            className="bg-[#FF6200]/20 text-[#FF6200] hover:bg-[#FF6200]/30 border border-[#FF6200]/50"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DisputeCard({ dispute, onView }: { dispute: Dispute, onView: () => void }) {
    const isOrder = !!dispute.order;
    const amount = isOrder ? dispute.order!.amount : dispute.escrow_agreement!.amount;
    const title = isOrder ? dispute.order!.listing?.title : 'Direct Escrow Agreement';

    return (
        <div className="group bg-white border border-zinc-200 rounded-[2rem] shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center border border-zinc-100 hover:border-[#FF6200]/30 transition-all bg-white/[0.02]">
            <div className="h-12 w-12 rounded-full bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20 shrink-0">
                <AlertTriangle className="h-5 w-5 text-[#FF6200]" />
            </div>
            <div className="flex-1 min-w-0 space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-heading">
                        Case #{dispute.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 truncate font-heading uppercase italic">
                    {title || 'Unknown Asset'}
                </h3>
            </div>
            <Button onClick={onView} variant="outline" className="border-zinc-200 hover:bg-[#FF6200] hover:text-black hover:border-transparent transition-all font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-xl font-heading">
                Open Dossier
            </Button>
        </div>
    );
}