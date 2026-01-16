'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Dispute {
    id: string;
    order_id: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved' | 'rejected';
    created_at: string;
    filed_by_user: {
        display_name: string;
        email: string;
    };
    order: {
        amount: number;
        status: string;
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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && !['operations_admin', 'admin', 'ceo', 'cofounder'].includes(user.role)) {
            router.push('/admin');
            return;
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
                    filed_by_user:users!disputes_filed_by_fkey(display_name, email),
                    order:orders!disputes_order_id_fkey(amount, status)
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

            // Refresh list
            fetchDisputes();
            setSelectedDispute(null);
            setResolutionNotes('');
        } catch (error: unknown) {
            console.error('Error updating dispute:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge variant="destructive">Open</Badge>;
            case 'under_review':
                return <Badge variant="secondary" className="bg-yellow-500">Under Review</Badge>;
            case 'resolved':
                return <Badge variant="default" className="bg-green-500">Resolved</Badge>;
            case 'rejected':
                return <Badge variant="secondary">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) return <div className="p-8">Loading disputes...</div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dispute Resolution</h1>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-lg py-1 px-3">
                        {disputes.filter(d => d.status === 'open').length} Open
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Disputes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Filed By</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {disputes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No disputes found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                disputes.map((dispute) => (
                                    <TableRow key={dispute.id}>
                                        <TableCell>
                                            {new Date(dispute.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{dispute.filed_by_user.display_name}</p>
                                                <p className="text-xs text-muted-foreground">{dispute.filed_by_user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {dispute.reason.replace(/_/g, ' ')}
                                        </TableCell>
                                        <TableCell>
                                            ₦{dispute.order.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedDispute(dispute)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dispute Details</DialogTitle>
                        <DialogDescription>
                            Review and resolve this dispute
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDispute && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reason</p>
                                    <p className="capitalize">{selectedDispute.reason.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Order Amount</p>
                                    <p>₦{selectedDispute.order.amount.toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                                    <p className="mt-1">{selectedDispute.description}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Resolution Notes</label>
                                <Textarea
                                    placeholder="Enter notes about the resolution..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <div className="flex gap-2 w-full justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('under_review')}
                                        disabled={actionLoading}
                                    >
                                        <Clock className="h-4 w-4 mr-2" />
                                        Mark Under Review
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleStatusUpdate('rejected')}
                                        disabled={actionLoading || !resolutionNotes}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject Dispute
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleStatusUpdate('resolved')}
                                        disabled={actionLoading || !resolutionNotes}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Resolve & Refund
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
