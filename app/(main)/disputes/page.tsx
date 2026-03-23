'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
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
            <div className="container mx-auto px-4 py-8 flex justify-center mt-20">
                <ShieldCheck className="w-10 h-10 text-[#FF6200] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <div className="mb-8 border-b border-zinc-200 pb-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter">My Disputes</h1>
                <p className="text-zinc-500 mt-2">Track and manage your escalated transactions.</p>
            </div>

            {disputes.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200">
                    <ShieldCheck className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold">No Active Disputes</h3>
                    <p className="text-zinc-500 text-sm mt-2">Your transactions are running smoothly.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {disputes.map((dispute) => (
                        <Card key={dispute.id} className="overflow-hidden border-zinc-200 shadow-sm rounded-3xl">
                            <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <CardTitle className="text-base font-bold uppercase tracking-wider">
                                        Case #{dispute.id.slice(0, 8)}
                                    </CardTitle>
                                </div>
                                <Badge variant={
                                    dispute.status === 'resolved' ? 'default' :
                                    dispute.status === 'rejected' ? 'destructive' : 'secondary'
                                } className="uppercase text-[10px] font-black tracking-widest">
                                    {dispute.status.replace('_', ' ')}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs uppercase font-bold text-zinc-400 mb-1">Reason</h4>
                                        <p className="font-semibold">{dispute.reason}</p>
                                        
                                        <h4 className="text-xs uppercase font-bold text-zinc-400 mt-4 mb-1">Date Filed</h4>
                                        <div className="flex items-center text-sm text-zinc-600">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            {new Date(dispute.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs uppercase font-bold text-zinc-400 mb-1">Description</h4>
                                        <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl min-h-[80px]">
                                            {dispute.description}
                                        </p>
                                    </div>
                                </div>

                                {dispute.resolution_notes && (
                                    <div className="mt-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                                        <h4 className="text-xs uppercase font-bold text-blue-600 mb-1 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" />
                                            Resolution Notes
                                        </h4>
                                        <p className="text-sm text-blue-900">{dispute.resolution_notes}</p>
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-zinc-100 flex justify-end">
                                    {dispute.escrow_agreement?.conversation_id && (
                                        <Button asChild variant="outline" className="text-xs font-bold uppercase tracking-widest rounded-xl">
                                            <Link href={`/chats/${dispute.escrow_agreement.conversation_id}`}>
                                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                View Source Chat
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
