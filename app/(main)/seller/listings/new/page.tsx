'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useToast } from '@/contexts/ToastContext';
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
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(['']);
    const [videoUrls, setVideoUrls] = useState<string[]>([]);
    const [assetType, setAssetType] = useState<'product' | 'service'>('product');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        location: '',
        condition: 'new',
        serviceFormat: 'fixed',
        deliveryTimeframe: '1-3 days',
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

        // Auto-Verification for Google signups or fully verified custom emails
        const isGoogleAuth = sessionUser.app_metadata?.provider === 'google';
        if (user.role === 'student_seller' && !user.isVerified && !isGoogleAuth) {
            // Show message and redirect to dashboard
            toast('Listing creation is restricted. You must be Ops-Approved or sign in with Google.', 'error');
            router.push('/seller/dashboard');
            return;
        }

        const allowedRoles = ['dealer', 'student_seller', 'ceo', 'admin', 'technical_admin', 'operations_admin'];
        if (!allowedRoles.includes(user.role)) {
            console.warn("Access Denied: Role mismatch for listing creation", user.role);
            router.push('/');
            return;
        }

        const isPending = user.subscriptionStatus === 'pending_verification';
        if (isPending) {
            console.log("Dealer is pending verification - allowing creation with security overview");
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const validImages = imageUrls.filter((url: string) => url.trim() !== '');
            if (validImages.length === 0) {
                toast('Please add at least one image URL', 'error');
                setLoading(false);
                return;
            }

            // ENFORCE PLAN LIMITS
            const { allowed, reason } = await canCreateListing(user.id);
            if (!allowed) {
                toast(reason || 'Listing limit reached.', 'error');
                setLoading(false);
                return;
            }

            let finalDescription = formData.description;
            if (assetType === 'service') {
                finalDescription = `[ASSET: SERVICE]
Format: ${formData.serviceFormat.toUpperCase()}
Est. Delivery: ${formData.deliveryTimeframe}

${formData.description}`;
            } else {
                finalDescription = `[ASSET: PRODUCT]
Condition: ${formData.condition.toUpperCase()}

${formData.description}`;
            }

            // ROBUST PRICE VALIDATION
            const priceNum = parseFloat(formData.price);
            if (isNaN(priceNum) || priceNum <= 0) {
                toast('Invalid price level. Please enter a positive numeric value.', 'error');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('listings')
                .insert({
                    dealer_id: user.id,
                    title: formData.title,
                    description: finalDescription,
                    price: priceNum,
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
            toast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6200] relative z-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative selection:bg-[#FF6200] selection:text-black pt-32 pb-24 transition-colors duration-300">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-6 mx-auto relative z-10 max-w-4xl space-y-12">
                {/* Header section with back button */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-100 dark:border-white/5 pb-10 transition-colors">
                    <div className="space-y-4">
                        <Link href="/seller/dashboard" className="inline-flex items-center text-zinc-500 dark:text-zinc-400 hover:text-[#FF6200] transition-colors text-[10px] font-black uppercase tracking-widest font-heading mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 font-heading">New Listing Process</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading text-zinc-900 dark:text-white">
                            Create New <span className="text-[#FF6200]">Listing</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-xl italic">
                            Add a new product or service to the campus marketplace. Ensure all details are accurate for a smooth transaction.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none rounded-[3.5rem] p-12 transition-all">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Asset Type Toggle */}
                        <div className="flex flex-col md:flex-row p-2 bg-[#FAFAFA]/80 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-[2rem] gap-2 max-w-md mx-auto mb-8 transition-colors">
                            <button
                                type="button"
                                onClick={() => setAssetType('product')}
                                className={`flex-1 flex py-4 items-center justify-center gap-2 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${assetType === 'product' ? 'bg-[#FF6200] text-black shadow-xl shadow-[#FF6200]/20' : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'}`}
                            >
                                <Box className="h-4 w-4" /> Physical Product
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssetType('service')}
                                className={`flex-1 flex py-4 items-center justify-center gap-2 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${assetType === 'service' ? 'bg-zinc-900 dark:bg-zinc-800 text-white shadow-xl shadow-black/10' : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'}`}
                            >
                                <Zap className="h-4 w-4" /> Service Option
                            </button>
                        </div>

                        {/* Core Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8 md:col-span-2">
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Listing Title *</Label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-900/20 dark:text-white/20 group-focus-within:text-[#FF6200] transition-colors">
                                            <Box className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., iPhone 15 Pro Max Deep Purple"
                                            className="h-16 pl-16 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-sm font-bold uppercase tracking-widest font-heading dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Detailed Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={assetType === 'product' ? "Outline item condition, specifications, and history..." : "Describe the exact scope of your service, the process, and what the buyer receives..."}
                                        rows={6}
                                        className="p-8 rounded-[2rem] bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-xs font-medium leading-relaxed italic border-dashed dark:text-zinc-300"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Price (₦) *</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-900/20 dark:text-white/20 group-focus-within:text-[#FF6200] transition-colors font-black font-heading text-lg italic">₦</div>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="h-16 pl-16 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-2xl font-black font-heading dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Category *</Label>
                                <div className="relative">
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => {
                                            const category = CATEGORIES.find(c => c.name === value);
                                            const isService = category?.id === 'services';
                                            const isFood = category?.id === 'food';
                                            
                                            setFormData({ 
                                                ...formData, 
                                                category: value,
                                                condition: isFood ? 'Freshly Made' : (isService ? '' : 'Brand New')
                                            });
                                            
                                            if (isService) setAssetType('service');
                                            else setAssetType('product');
                                        }}
                                        required
                                    >
                                        <SelectTrigger className="h-16 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:ring-1 focus:ring-[#FF6200] font-heading text-[10px] font-black uppercase tracking-widest dark:text-white">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-heading text-[10px] uppercase font-black tracking-widest">
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name} className="focus:bg-[#FF6200] focus:text-black py-3">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Dynamic Asset Type Fields */}
                            {assetType === 'product' && CATEGORIES.find(c => c.name === formData.category)?.id !== 'services' && (
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Product Condition *</Label>
                                    <Select value={formData.condition} onValueChange={(val) => setFormData({ ...formData, condition: val })}>
                                        <SelectTrigger className="h-16 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:ring-1 focus:ring-[#FF6200] font-heading text-[10px] font-black uppercase tracking-widest dark:text-white">
                                            <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                                            {CATEGORIES.find(c => c.name === formData.category)?.id === 'food' ? (
                                                <>
                                                    <SelectItem value="Freshly Made" className="py-3 text-[10px] font-black uppercase tracking-widest">Freshly Made</SelectItem>
                                                    <SelectItem value="Made Today" className="py-3 text-[10px] font-black uppercase tracking-widest">Made Today</SelectItem>
                                                    <SelectItem value="Pre-Packaged" className="py-3 text-[10px] font-black uppercase tracking-widest">Pre-Packaged (Sealed)</SelectItem>
                                                    <SelectItem value="Pre-Order" className="py-3 text-[10px] font-black uppercase tracking-widest">Pre-Order (Made on Request)</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="Brand New" className="py-3 text-[10px] font-black uppercase tracking-widest">Brand New</SelectItem>
                                                    <SelectItem value="Open Box" className="py-3 text-[10px] font-black uppercase tracking-widest">Like New (Open Box)</SelectItem>
                                                    <SelectItem value="used_clean" className="py-3 text-[10px] font-black uppercase tracking-widest">Used (Excellent)</SelectItem>
                                                    <SelectItem value="Used" className="py-3 text-[10px] font-black uppercase tracking-widest">Used (Good)</SelectItem>
                                                    <SelectItem value="UK Used" className="py-3 text-[10px] font-black uppercase tracking-widest">UK Used / Refurbished</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {assetType === 'service' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Pricing Model *</Label>
                                        <Select value={formData.serviceFormat} onValueChange={(val) => setFormData({ ...formData, serviceFormat: val })}>
                                            <SelectTrigger className="h-16 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:ring-1 focus:ring-[#FF6200] font-heading text-[10px] font-black uppercase tracking-widest dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                                                <SelectItem value="fixed" className="py-3 text-[10px] font-black uppercase tracking-widest">Fixed Project</SelectItem>
                                                <SelectItem value="hourly" className="py-3 text-[10px] font-black uppercase tracking-widest">Hourly Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Est. Delivery *</Label>
                                        <Input
                                            value={formData.deliveryTimeframe}
                                            onChange={(e) => setFormData({ ...formData, deliveryTimeframe: e.target.value })}
                                            placeholder="e.g. 1-3 days"
                                            className="h-16 px-6 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:border-[#FF6200] font-bold text-xs uppercase tracking-widest dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Geographic Campus (Location)</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-900/20 dark:text-white/20 group-focus-within:text-[#FF6200] transition-colors">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., Baze University, Abuja"
                                        className="h-16 pl-16 rounded-2xl bg-[#FAFAFA]/40 dark:bg-white/5 border-zinc-100 dark:border-white/5 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all text-sm font-bold uppercase tracking-widest font-heading dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-zinc-100 dark:border-white/5">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6200] italic font-heading">Images *</Label>
                                    <p className="text-zinc-900/30 dark:text-white/30 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Max 5 high-quality images.</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-[#FAFAFA]/40 dark:bg-white/5 border border-zinc-100 dark:border-white/5 border-dashed group hover:border-[#FF6200]/20 transition-all">
                                    <ImageUpload
                                        onImagesSelected={(urls) => setImageUrls(urls)}
                                        defaultImages={imageUrls.filter(url => url !== '')}
                                        maxImages={5}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic font-heading">Videos (Optional)</Label>
                                    <p className="text-zinc-900/30 dark:text-white/30 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Short video showing the item.</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-[#FAFAFA]/40 dark:bg-white/5 border border-zinc-100 dark:border-white/5 border-dashed group hover:border-[#FF6200]/20 transition-all">
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
                                        Publish Listing <Zap className="ml-3 h-5 w-5 animate-pulse" />
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/seller/dashboard')}
                                disabled={loading}
                                className="h-20 px-12 rounded-[1.5rem] bg-transparent border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px] font-heading hover:bg-white dark:hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="text-center py-6 text-zinc-900/20 dark:text-white/10 text-[9px] font-black uppercase tracking-[0.4em] font-heading transition-colors">
                    Marketbridge Systems
                </div>
            </div>
        </div>
    );
}