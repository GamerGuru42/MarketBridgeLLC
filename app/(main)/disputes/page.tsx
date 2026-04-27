'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, ExternalLink, ShieldCheck, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UserDisputesPage() {
    const { user, loading: authLoading } = useAuth();
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDisputes();
        }
    }, [user, authLoading]);

    const fetchDisputes = async () => {
        try {
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    id,
                    reason,
                    description,
                    status,
                    created_at,
                    resolution_notes,
                    escrow_agreement:escrow_agreements(id, amount, status, buyer_id, seller_id, conversation_id)
                `)
                .eq('filed_by_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDisputes(data || []);
        } catch (error) {
            console.error('Error fetching disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 relative selection:bg-[#FF6200] selection:text-white pt-28 pb-32">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Help Center</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            My <span className="text-[#FF6200]">Disputes</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic">
                            Tracking <span className="text-zinc-900 font-bold">{disputes.length} active reports</span> under Trust & Safety review.
                        </p>
                    </div>

                    <Link href="/buyer/dashboard">
                        <Button variant="outline" className="h-12 border-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all font-heading bg-white shadow-sm hover:shadow-md">
                            <ArrowLeft className="mr-2 h-3 w-3" /> Dashboard
                        </Button>
                    </Link>
                </div>

                {disputes.length === 0 ? (
                    <div className="relative text-center py-40 bg-white/50 backdrop-blur-md border border-zinc-200 rounded-[3rem] shadow-sm overflow-hidden group hover:border-[#FF6200]/20 transition-all duration-700">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF6200]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#FF6200]/10 transition-colors duration-700" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="h-24 w-24 rounded-full bg-[#FF6200]/10 flex items-center justify-center mx-auto border border-[#FF6200]/20">
                                <ShieldCheck className="h-10 w-10 text-[#FF6200]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading text-zinc-900">No active disputes</h3>
                                <p className="text-zinc-500 font-medium mt-2 max-w-sm mx-auto">Your transactions are running smoothly. If you ever face an issue, our payment protection system protects you.</p>
                            </div>
                            <Button asChild className="h-14 px-10 bg-[#FF6200] text-black hover:bg-[#FF7A29] rounded-2xl font-black uppercase tracking-widest font-heading border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all hover:-translate-y-1">
                                <Link href="/orders">View Orders <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {disputes.map((dispute) => (
                            <div key={dispute.id} className="bg-white border border-zinc-200 shadow-sm p-10 rounded-[3rem] hover:border-[#FF6200]/30 transition-all duration-500 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6200]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-zinc-100">
                                    <div className="space-y-1 flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20 shrink-0">
                                            <AlertCircle className="h-6 w-6 text-[#FF6200] animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Case ID</p>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading">#{dispute.id.slice(0, 8)}</h3>
                                        </div>
                                    </div>
                                    
                                    <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 ${
                                        dispute.status === 'resolved' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                                        dispute.status === 'rejected' ? 'bg-zinc-200 border-zinc-300 text-zinc-500' :
                                        'bg-[#FF6200]/10 border-[#FF6200]/20 text-[#FF6200]'
                                    }`}>
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest leading-none">{dispute.status.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Reason Flagged</h4>
                                            <p className="font-bold text-lg text-zinc-900">{dispute.reason}</p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Date Filed</h4>
                                            <div className="flex items-center text-sm font-medium text-zinc-600 italic">
                                                <Clock className="w-4 h-4 mr-2 text-[#FF6200]" />
                                                {new Date(dispute.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Primary Description</h4>
                                        <p className="text-sm text-zinc-600 bg-[#FAFAFA] border border-zinc-100 p-5 rounded-3xl min-h-[100px] italic leading-relaxed">
                                            "{dispute.description}"
                                        </p>
                                    </div>
                                </div>

                                {dispute.resolution_notes && (
                                    <div className="mt-10 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden">
                                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-[30px]" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-3 flex items-center gap-2 relative z-10">
                                            <ShieldCheck className="w-4 h-4" />
                                            Admin Notes
                                        </h4>
                                        <p className="text-sm font-medium italic text-zinc-300 relative z-10">{dispute.resolution_notes}</p>
                                    </div>
                                )}

                                <div className="mt-10 pt-8 border-t border-zinc-100 flex justify-end">
                                    {dispute.escrow_agreement?.conversation_id && (
                                        <Button asChild variant="outline" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest rounded-2xl border-zinc-200 text-zinc-600 hover:text-[#FF6200] hover:border-[#FF6200]/30 hover:bg-[#FF6200]/5 transition-all">
                                            <Link href={`/chats/${dispute.escrow_agreement.conversation_id}`}>
                                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                View Chat History
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
