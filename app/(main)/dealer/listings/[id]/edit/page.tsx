'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Zap, Box, MapPin, Search, Activity, Cpu, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';
import { CATEGORIES } from '@/lib/categories';

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
                alert('Asset signal lost or unauthorized access.');
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
        } catch (err: unknown) {
            console.error('Failed to fetch listing:', err);
            alert('Failed to synchronize asset data.');
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
                alert('Primary visual feed required.');
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
        } catch (err: unknown) {
            console.error('Failed to update listing:', err);
            const message = err instanceof Error ? err.message : 'Protocol synchronization failed';
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-[#FF6600]" />
                    <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] font-heading animate-pulse">Synchronizing Asset Feed...</p>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="glass-card p-12 rounded-[3.5rem] border-red-500/20 text-center max-w-lg">
                    <Activity className="h-12 w-12 text-red-500 mx-auto mb-6" />
                    <p className="text-red-400 font-black uppercase tracking-widest text-xs mb-8">Asset Signal Not Found</p>
                    <Button asChild className="bg-white/10 text-white hover:bg-white/20 rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[10px] italic">
                        <Link href="/dealer/listings"><ArrowLeft className="mr-2 h-4 w-4" /> Return to Terminal</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FF6600] selection:text-black pt-32 pb-24">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 max-w-4xl space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div className="space-y-4">
                        <Link href="/dealer/listings" className="inline-flex items-center text-zinc-500 hover:text-[#FF6600] transition-colors text-[10px] font-black uppercase tracking-widest font-heading mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6600] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Node Management Moditication</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Refine <span className="text-[#FF6600]">Asset</span>
                        </h1>
                        <p className="text-zinc-500 font-medium max-w-xl italic">
                            Authorized modification of marketplace node <span className="text-white font-bold">{listing.id.slice(0, 8).toUpperCase()}</span>.
                        </p>
                    </div>
                </div>

                <div className="glass-card rounded-[3.5rem] p-12 border-none">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8 md:col-span-2">
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Authorized Reference Title *</Label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors">
                                            <Box className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="h-16 pl-16 rounded-2xl bg-black/40 border-white/5 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all text-sm font-bold uppercase tracking-widest font-heading"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Technical Specifications & History *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={6}
                                        className="p-8 rounded-[2rem] bg-black/40 border-white/5 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all text-xs font-medium leading-relaxed italic border-dashed"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Valuation (₦) *</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors font-black font-heading text-lg italic">₦</div>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="h-16 pl-16 rounded-2xl bg-black/40 border-white/5 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all text-2xl font-black font-heading"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Market Sector *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    required
                                >
                                    <SelectTrigger className="h-16 rounded-2xl bg-black/40 border-white/5 focus:ring-1 focus:ring-[#FF6600] font-heading text-[10px] font-black uppercase tracking-widest">
                                        <SelectValue placeholder="Select sector" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white font-heading text-[10px] uppercase font-black tracking-widest">
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.name} disabled={cat.locked} className="focus:bg-[#FF6600] focus:text-black py-3">
                                                {cat.name} {cat.locked ? '(COMING SOON)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Geographic Node (Location)</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="h-16 pl-16 rounded-2xl bg-black/40 border-white/5 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all text-sm font-bold uppercase tracking-widest font-heading"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6600] italic font-heading">Visual Feed (Images) *</Label>
                                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Authorized gallery deployment (Max 5).</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 border-dashed group hover:border-[#FF6600]/20 transition-all">
                                    <ImageUpload
                                        onImagesSelected={(urls) => setImageUrls(urls)}
                                        defaultImages={imageUrls.filter(url => url !== '')}
                                        maxImages={5}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Motion Stream (Videos - Optional)</Label>
                                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Dynamic verification feed.</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 border-dashed group hover:border-[#FF6600]/20 transition-all">
                                    <VideoUpload
                                        onVideosSelected={(urls) => setVideoUrls(urls)}
                                        defaultVideos={videoUrls}
                                        maxVideos={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 pt-12">
                            <Button type="submit" disabled={saving} className="flex-1 h-20 bg-[#FF6600] text-black hover:bg-[#FFD700] rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs transition-all font-heading italic shadow-2xl shadow-[#FF6600]/10">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        Updating Asset...
                                    </>
                                ) : (
                                    <>
                                        Authorize Changes <Zap className="ml-3 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dealer/listings')}
                                disabled={saving}
                                className="h-20 px-12 rounded-[1.5rem] bg-transparent border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] font-heading hover:bg-white/5 transition-all"
                            >
                                Discard Protocol
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="text-center py-6 text-zinc-700 text-[9px] font-black uppercase tracking-[0.4em] font-heading">
                    Modification Authorized by Marketbridge Core // Terminal {listing.id.slice(0, 4).toUpperCase()}
                </div>
            </div>
        </div>
    );
}
