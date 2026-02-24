'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, XCircle, ExternalLink, Car, User, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Listing {
    id: string;
    title: string;
    price: number;
    images: string[];
    location: string;
    dealer_id: string;
    created_at: string;
    make?: string;
    model?: string;
    year?: number;
    videos?: string[];
    dealer: {
        display_name: string;
    };
}

export default function VerificationsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Verification Modal State
    const [verifyingListing, setVerifyingListing] = useState<Listing | null>(null);
    const [reportUrl, setReportUrl] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchPendingListings();
    }, []);

    const fetchPendingListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('listings')
                .select(`
                    *,
                    dealer:users!listings_dealer_id_fkey(display_name)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (err) {
            console.error('Error fetching pending listings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verifyingListing) return;

        setProcessingId(verifyingListing.id);
        try {
            const { error } = await supabase
                .from('listings')
                .update({
                    status: 'active',
                    verification_status: 'verified',
                    is_verified_listing: true,
                    inspection_report_url: reportUrl,
                    inspector_notes: notes
                })
                .eq('id', verifyingListing.id);

            if (error) throw error;
            setListings(listings.filter(l => l.id !== verifyingListing.id));
            setVerifyingListing(null);
            setReportUrl('');
            setNotes('');
            alert('Listing verified and activated!');
        } catch (err) {
            console.error('Error verifying listing:', err);
            alert('Failed to verify listing');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Reason for rejection:');
        if (reason === null) return;

        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('listings')
                .update({
                    status: 'inactive',
                    verification_status: 'rejected',
                    inspector_notes: reason
                })
                .eq('id', id);

            if (error) throw error;
            setListings(listings.filter(l => l.id !== id));
            alert('Listing rejected');
        } catch (err) {
            console.error('Error rejecting listing:', err);
            alert('Failed to reject listing');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Listing Verifications</h1>
                    <p className="text-muted-foreground">Review and approve car listings for the Abuja niche launch.</p>
                </div>
                <Badge variant="outline" className="text-lg py-1 px-4">
                    {listings.length} Pending
                </Badge>
            </div>

            {listings.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No pending verifications</h2>
                    <p className="text-muted-foreground">All clear! Check back later for new listings.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="aspect-video relative bg-muted">
                                {listing.images && listing.images[0] ? (
                                    <Image
                                        src={listing.images[0]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <Car className="h-10 w-10" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge className="bg-[#FF6200]">Pending Review</Badge>
                                </div>
                                {listing.videos && listing.videos.length > 0 && (
                                    <div className="absolute bottom-2 right-2">
                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-primary/20 flex items-center gap-1">
                                            <div className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse"></div>
                                            Video Available
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-primary font-bold text-lg">₦{listing.price.toLocaleString()}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(listing.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Car className="h-3.5 w-3.5" />
                                        <span className="truncate">{listing.make} {listing.model} {listing.year}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-3.5 w-3.5" />
                                        <span className="truncate">{listing.dealer.display_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate">{listing.location || 'Abuja'}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-muted/20 gap-2 border-t">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        setVerifyingListing(listing);
                                        setNotes(`Inspection passed for ${listing.title}. Vehicle is in excellent condition.`);
                                    }}
                                    disabled={!!processingId}
                                >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Verify
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                                    onClick={() => handleReject(listing.id)}
                                    disabled={!!processingId}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button variant="ghost" size="icon" asChild title="View Listing Details">
                                    <Link href={`/listings/${listing.id}`} target="_blank">
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Verification Dialog */}
            <Dialog open={!!verifyingListing} onOpenChange={(open) => !open && setVerifyingListing(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Complete Verification</DialogTitle>
                        <DialogDescription>
                            Confirm that you have inspected this vehicle and add any relevant reports.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2 text-sm border p-3 rounded-lg bg-muted/20">
                            <p><strong>Car:</strong> {verifyingListing?.title}</p>
                            <p><strong>Dealer:</strong> {verifyingListing?.dealer.display_name}</p>
                            {verifyingListing?.videos && verifyingListing.videos.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold mb-2">Video Verification Assets:</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {verifyingListing.videos.map((v, i) => (
                                            <video key={i} src={v} controls className="w-full rounded border bg-black aspect-video" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="report_url">Inspection Report URL (Optional)</Label>
                            <Input
                                id="report_url"
                                placeholder="https://reports.marketbridge.com/view/..."
                                value={reportUrl}
                                onChange={(e) => setReportUrl(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Inspector Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Details about engine status, body condition, etc."
                                className="h-32"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setVerifyingListing(null)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleVerify}
                            disabled={!!processingId}
                        >
                            {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            Confirm & Activate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
