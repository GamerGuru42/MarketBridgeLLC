'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { escrowAPI } from '@/lib/api';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DISPUTE_REASONS = [
    'Item not received',
    'Item significantly not as described',
    'Damaged item',
    'Wrong item sent',
    'Other'
];

export default function DisputePage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        reason: '',
        description: ''
    });

    useEffect(() => {
        if (params.id) {
            fetchEscrow();
        }
    }, [params.id]);

    const fetchEscrow = async () => {
        try {
            const response = await escrowAPI.getEscrowForOrder(params.id as string) as any;
            if (response.escrow) {
                setEscrow(response.escrow);
            } else {
                setError('Escrow not found for this order');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load escrow details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.reason || !formData.description) {
            setError('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await escrowAPI.disputeEscrow(escrow.id, formData.reason, formData.description);
            router.push('/orders');
        } catch (err: any) {
            setError(err.message || 'Failed to file dispute');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!escrow) {
        return (
            <div className="container max-w-md mx-auto py-12 px-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Escrow Not Found</h1>
                <p className="text-muted-foreground mb-6">{error || 'Could not find escrow details for this order.'}</p>
                <Button asChild>
                    <Link href="/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    if (escrow.status !== 'held') {
        return (
            <div className="container max-w-md mx-auto py-12 px-4 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Cannot File Dispute</h1>
                <p className="text-muted-foreground mb-6">
                    Disputes can only be filed for orders currently in escrow (held status).
                    Current status: <span className="font-semibold">{escrow.status}</span>
                </p>
                <Button asChild>
                    <Link href="/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <Button variant="ghost" asChild className="mb-6 pl-0">
                <Link href="/orders" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Orders
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        File a Dispute
                    </CardTitle>
                    <CardDescription>
                        We're sorry you're having issues. Please provide details so we can help resolve this.
                        Funds will remain held in escrow until the dispute is resolved.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Transaction Amount</Label>
                            <div className="text-xl font-bold">₦{escrow.amount.toLocaleString()}</div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Dispute</Label>
                            <Select
                                value={formData.reason}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISPUTE_REASONS.map((reason) => (
                                        <SelectItem key={reason} value={reason}>
                                            {reason}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Please describe the issue in detail..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={5}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Provide as much detail as possible. This will be reviewed by our support team.
                            </p>
                        </div>

                        <Button type="submit" className="w-full" variant="destructive" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Dispute...
                                </>
                            ) : (
                                'Submit Dispute'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
