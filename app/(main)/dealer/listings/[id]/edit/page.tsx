'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';

const CATEGORIES = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Automotive',
    'Beauty',
    'Real Estate',
    'Services',
    'Kids & Babies',
    'Groceries'
];

interface Listing {
    id: string;
    dealer_id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    videos?: string[];
    status: string;
    location: string | null;
}

export default function EditListingPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [listing, setListing] = useState<Listing | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>(['']);
    const [videoUrls, setVideoUrls] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        location: '',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && user.role !== 'dealer') {
            router.push('/');
            return;
        }

        if (user && params.id) {
            fetchListing();
        }
    }, [user, authLoading, params.id]);

    const fetchListing = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('id', params.id)
                .eq('dealer_id', user.id)
                .single();

            if (error) throw error;

            if (!data) {
                alert('Listing not found or you do not have permission to edit it');
                router.push('/dealer/listings');
                return;
            }

            setListing(data);
            setFormData({
                title: data.title,
                description: data.description,
                price: data.price.toString(),
                category: data.category,
                location: data.location || '',
            });
            setImageUrls(data.images.length > 0 ? data.images : ['']);
            setVideoUrls(data.videos && data.videos.length > 0 ? data.videos : []);
        } catch (err) {
            console.error('Failed to fetch listing:', err);
            alert('Failed to load listing');
            router.push('/dealer/listings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !listing) return;

        setSaving(true);
        try {
            const validImages = imageUrls.filter(url => url.trim() !== '');

            if (validImages.length === 0) {
                alert('Please add at least one image URL');
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('listings')
                .update({
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    location: formData.location || null,
                    images: validImages,
                    videos: videoUrls.length > 0 ? videoUrls : null,
                })
                .eq('id', listing.id);

            if (error) throw error;

            router.push('/dealer/listings');
        } catch (err: any) {
            console.error('Failed to update listing:', err);
            alert(err.message || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };



    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">Listing not found</p>
                        <Button asChild>
                            <Link href="/dealer/listings">Back to Listings</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link href="/dealer/listings">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Listings
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Listing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., iPhone 13 Pro Max"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your product..."
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price">Price (₦) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., Lagos, Nigeria"
                                />
                            </div>

                            <div>
                                <Label>Product Images *</Label>
                                <div className="mt-2">
                                    <ImageUpload
                                        onImagesSelected={(urls) => setImageUrls(urls)}
                                        defaultImages={imageUrls.filter(url => url !== '')}
                                        maxImages={5}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Product Videos (Optional)</Label>
                                <div className="mt-2">
                                    <VideoUpload
                                        onVideosSelected={(urls) => setVideoUrls(urls)}
                                        defaultVideos={videoUrls}
                                        maxVideos={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={saving} className="flex-1">
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/dealer/listings')}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
