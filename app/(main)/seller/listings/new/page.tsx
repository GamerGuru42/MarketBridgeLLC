'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Zap, Box, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';
import { CATEGORIES } from '@/lib/categories';
import { canCreateListing } from '@/lib/subscription/utils';

export default function NewListingPage() {
    const router = useRouter();
    const { user, sessionUser, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
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
        if (authLoading) return;
        if (!sessionUser) {
            router.push('/login');
            return;
        }
        if (!user) return;

        // MANDATORY EMAIL VERIFICATION CHECK
        if (!user.email_verified) {
            router.push('/verify-email');
            return;
        }

        // SELLER VERIFICATION: student sellers must be verified before creating listings
        if (user.role === 'student_seller' && !user.is_verified_seller) {
            // Show message and redirect to verification flow
            alert('Listing creation is restricted to verified student sellers. Please complete verification.');
            router.push('/verify-seller');
            return;
        }

        const allowedRoles = ['dealer', 'student_seller', 'ceo', 'admin', 'technical_admin'];
        if (!allowedRoles.includes(user.role)) {
            console.warn("Access Denied: Role mismatch for listing deployment", user.role);
            router.push('/');
            return;
        }

        const isPending = user.subscriptionStatus === 'pending_verification';
        if (isPending) {
            console.log("Dealer is pending verification - allowing deployment with security overview");
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const validImages = imageUrls.filter((url: string) => url.trim() !== '');
            if (validImages.length === 0) {
                alert('Please add at least one image URL');
                setLoading(false);
                return;
            }

            // ENFORCE PLAN LIMITS
            const { allowed, reason } = await canCreateListing(user.id);
            if (!allowed) {
                alert(reason || 'Listing limit reached.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('listings')
                .insert({
                    dealer_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    location: formData.location || null,
                    images: validImages,
                    videos: videoUrls.length > 0 ? videoUrls : null,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;
            router.push('/seller/listings');
        } catch (err: unknown) {
            console.error('Failed to create listing:', err);
            const message = err instanceof Error ? err.message : 'Failed to create listing';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6200] relative z-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FF6200] selection:text-black pt-32 pb-24">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 max-w-4xl space-y-12">
                {/* Header section with back button */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div className="space-y-4">
                        <Link href="/seller/dashboard" className="inline-flex items-center text-white/40 hover:text-[#FF6200] transition-colors text-[10px] font-black uppercase tracking-widest font-heading mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 font-heading">New Listing Process</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Initialize <span className="text-[#FF6200]">Asset</span>
                        </h1>
                        <p className="text-white/40 font-medium max-w-xl italic">
                            Authorized deployment of new marketplace Campuss. Ensure all technical specifications are accurate.
                        </p>
                    </div>
                </div>

                <div className="glass-card rounded-[3.5rem] p-12 border-none">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Core Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8 md:col-span-2">
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic font-heading">Reference Title *</Label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6200] transition-colors">
                                            <Box className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., iPhone 15 Pro Max Deep Purple"
                                            className="h-16 pl-16 rounded-2xl bg-black/40 border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-sm font-bold uppercase tracking-widest font-heading"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic font-heading">Technical Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Outline asset conditions, specifications, and history..."
                                        rows={6}
                                        className="p-8 rounded-[2rem] bg-black/40 border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-xs font-medium leading-relaxed italic border-dashed"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic font-heading">Financial Value (₦) *</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6200] transition-colors font-black font-heading text-lg italic">₦</div>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="h-16 pl-16 rounded-2xl bg-black/40 border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-2xl font-black font-heading"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic font-heading">Asset Sector *</Label>
                                <div className="relative">
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        required
                                    >
                                        <SelectTrigger className="h-16 rounded-2xl bg-black/40 border-white/5 focus:ring-1 focus:ring-[#FF6200] font-heading text-[10px] font-black uppercase tracking-widest">
                                            <SelectValue placeholder="Select sector" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white font-heading text-[10px] uppercase font-black tracking-widest">
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name} disabled={cat.locked} className="focus:bg-[#FF6200] focus:text-black py-3">
                                                    {cat.name} {cat.locked ? '(COMING SOON)' : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic font-heading">Geographic Campus (Location)</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6200] transition-colors">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., Victoria Island, Lagos"
                                        className="h-16 pl-16 rounded-2xl bg-black/40 border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-sm font-bold uppercase tracking-widest font-heading"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6200] italic font-heading">Visual Evidence (Images) *</Label>
                                    <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Max 5 units of high-fidelity capture.</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 border-dashed group hover:border-[#FF6200]/20 transition-all">
                                    <ImageUpload
                                        onImagesSelected={(urls) => setImageUrls(urls)}
                                        defaultImages={imageUrls.filter(url => url !== '')}
                                        maxImages={5}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic font-heading">Motion Feed (Videos - Optional)</Label>
                                    <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Detailed video verification stream.</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 border-dashed group hover:border-[#FF6200]/20 transition-all">
                                    <VideoUpload
                                        onVideosSelected={(urls) => setVideoUrls(urls)}
                                        defaultVideos={videoUrls}
                                        maxVideos={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row gap-6 pt-12">
                            <Button type="submit" disabled={loading} className="flex-1 h-20 bg-[#FF6200] text-black hover:bg-[#FF7A29] rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs transition-all font-heading italic shadow-2xl shadow-[#FF6200]/10 group">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        Processing System...
                                    </>
                                ) : (
                                    <>
                                        Deploy Asset Stream <Zap className="ml-3 h-5 w-5 animate-pulse" />
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/seller/dashboard')}
                                disabled={loading}
                                className="h-20 px-12 rounded-[1.5rem] bg-transparent border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] font-heading hover:bg-white/5 transition-all"
                            >
                                Abort Initialization
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="text-center py-6 text-white/20 text-[9px] font-black uppercase tracking-[0.4em] font-heading">
                    Security Level: Alpha-7 // Encryption Active // Marketbridge Systems
                </div>
            </div>
        </div>
    );
}