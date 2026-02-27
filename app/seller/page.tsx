'use client';

import React, { useState } from 'react';
import { Store, CheckCircle, Upload, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const UNIVERSITIES = [
    "University of Abuja",
    "Baze University",
    "Nile University of Nigeria",
    "Veritas University",
    "Cosmopolitan University",
    "African University of Science and Technology",
    "National Open University of Nigeria",
    "Philomath University",
    "Bingham University",
    "Prime University",
    "Al-Muhibbah Open University",
    "European University of Nigeria"
];

const CATEGORIES = [
    "Textbooks", "Laptops", "Wigs & Hair", "Fashion", "Food & Snacks", "Gadgets", "Hostel Items", "Others"
];

const sellerApplicationSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    phoneNumber: z.string().min(10, "Valid phone number is required"),
    university: z.string().min(1, "Please select a university"),
    studentEmail: z.string().email("Invalid email").refine(val => val.toLowerCase().endsWith('.edu') || val.toLowerCase().endsWith('.edu.ng'), "Must be a .edu or .edu.ng email"),
    sellCategories: z.array(z.string()).min(1, "Select at least one category"),
    otherCategoryDetails: z.string().optional(),
    itemsReady: z.string().min(1, "Please select quantity of items"),
    idCardUrl: z.string().optional()
}).refine(data => {
    if (data.sellCategories.includes("Others") && (!data.otherCategoryDetails || !data.otherCategoryDetails.trim())) {
        return false;
    }
    return true;
}, {
    message: 'Please specify what you intend to sell under "Others".',
    path: ['otherCategoryDetails']
});

type SellerFormData = z.infer<typeof sellerApplicationSchema>;

export default function SellerOnboardingPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SellerFormData>({
        resolver: zodResolver(sellerApplicationSchema),
        defaultValues: {
            fullName: '',
            phoneNumber: '',
            university: '',
            studentEmail: '',
            sellCategories: [],
            otherCategoryDetails: '',
            itemsReady: '',
            idCardUrl: ''
        }
    });

    const sellCategories = watch('sellCategories');
    const university = watch('university');
    const itemsReady = watch('itemsReady');
    const idCardUrl = watch('idCardUrl');

    const handleSelectChange = (name: any, value: string) => {
        setValue(name, value, { shouldValidate: true });
    };

    const handleCategoryToggle = (category: string) => {
        const current = sellCategories || [];
        if (current.includes(category)) {
            setValue('sellCategories', current.filter(c => c !== category), { shouldValidate: true });
        } else {
            setValue('sellCategories', [...current, category], { shouldValidate: true });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'File too large', description: 'Please select an image under 5MB.', variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        try {
            // Compress image
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            const compressedFile = await imageCompression(file, options);

            const fileExt = 'webp';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `id_cards/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('seller_docs')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('seller_docs')
                .getPublicUrl(filePath);

            setValue('idCardUrl', publicUrl, { shouldValidate: true });
            toast({ title: 'Uploaded!', description: 'ID Card uploaded successfully.' });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: SellerFormData) => {
        let finalCategories = [...data.sellCategories];
        if (finalCategories.includes('Others')) {
            finalCategories = finalCategories.map(c =>
                c === 'Others' ? `Others: ${data.otherCategoryDetails}` : c
            );
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/seller-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, sellCategories: finalCategories })
            });

            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Submission failed');

            setIsSuccess(true);
            toast({
                title: 'Application Received! 🎉',
                description: 'We will review your application and get back to you within 48 hours.',
                className: 'bg-[#FF6200] text-white font-bold border-none'
            });

        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Something went wrong.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#FF6200] selection:text-black py-12 px-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6200]/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-2xl mx-auto relative z-10">

                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                            <div className="h-24 w-24 bg-[#FF6200]/10 border border-[#FF6200]/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,98,0,0.2)]">
                                <CheckCircle className="h-12 w-12 text-[#FF6200]" />
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Application Received</h2>
                            <p className="text-zinc-400 text-lg max-w-md">
                                Thank you! Your seller application is part of the exclusive Campus Crew. We'll reply within 48 hours.
                            </p>
                            <Link href="/">
                                <Button className="mt-8 h-14 px-8 bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest rounded-xl transition-all">
                                    Return to Home
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10 text-center space-y-4">
                                <div>
                                    <h1 className="text-4xl font-black italic tracking-widest text-[#FF6200] uppercase mb-2">Campus Crew</h1>
                                    <p className="text-zinc-400 text-base">Join MarketBridge early as a verified student seller.</p>
                                </div>
                                <div className="inline-block bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest">
                                    Limited: First 40 Sellers Only
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">Full Name *</Label>
                                        <Input
                                            {...register("fullName")}
                                            placeholder="John Doe"
                                            className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base"
                                        />
                                        {errors.fullName && <p className="text-red-500 text-sm mt-1 ml-1">{errors.fullName.message}</p>}
                                    </div>

                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">Phone Number *</Label>
                                        <Input
                                            {...register("phoneNumber")}
                                            placeholder="08012345678" type="tel"
                                            className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base"
                                        />
                                        {errors.phoneNumber && <p className="text-red-500 text-sm mt-1 ml-1">{errors.phoneNumber.message}</p>}
                                    </div>

                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">University *</Label>
                                        <Select onValueChange={(val) => handleSelectChange('university', val)} value={university}>
                                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base">
                                                <SelectValue placeholder="Select University" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                                {UNIVERSITIES.map(u => <SelectItem key={u} value={u} className="focus:bg-[#FF6200] focus:text-black">{u}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {errors.university && <p className="text-red-500 text-sm mt-1 ml-1">{errors.university.message}</p>}
                                    </div>

                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">Student Email (.edu or .edu.ng) *</Label>
                                        <Input
                                            {...register("studentEmail")}
                                            type="email"
                                            placeholder="your.name@uniabuja.edu.ng"
                                            className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base"
                                        />
                                        {errors.studentEmail && <p className="text-red-500 text-sm mt-1 ml-1">{errors.studentEmail.message}</p>}
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1 block mb-4">What will you sell? *</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {CATEGORIES.map(category => {
                                                const safeId = category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                                                return (
                                                    <label key={category} htmlFor={safeId} className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-[#FF6200]/30 transition-colors cursor-pointer">
                                                        <Checkbox
                                                            id={safeId}
                                                            checked={sellCategories.includes(category)}
                                                            onCheckedChange={() => handleCategoryToggle(category)}
                                                            className="border-white/30 w-5 h-5 data-[state=checked]:bg-[#FF6200] data-[state=checked]:border-[#FF6200]"
                                                        />
                                                        <span className="text-sm font-medium cursor-pointer flex-1">{category}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {errors.sellCategories && <p className="text-red-500 text-sm mt-1 ml-1">{errors.sellCategories.message}</p>}
                                        {sellCategories.includes("Others") && (
                                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                                <Label htmlFor="otherCategoryDetails" className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1 mb-3 block">
                                                    Specify "Other" items *
                                                </Label>
                                                <Input
                                                    id="otherCategoryDetails"
                                                    {...register("otherCategoryDetails")}
                                                    placeholder="E.g. Digital games, gift cards, campus services..."
                                                    className="bg-black/40 border-white/10 focus:border-[#FF6200] text-white h-14 rounded-xl text-sm placeholder:text-zinc-600"
                                                />
                                                {errors.otherCategoryDetails && <p className="text-red-500 text-sm mt-1 ml-1">{errors.otherCategoryDetails.message}</p>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">How many items ready to sell? *</Label>
                                        <Select onValueChange={(val) => handleSelectChange('itemsReady', val)} value={itemsReady}>
                                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base">
                                                <SelectValue placeholder="Select Quantity" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                                <SelectItem value="1-5" className="focus:bg-[#FF6200] focus:text-black">1 - 5 items</SelectItem>
                                                <SelectItem value="6-20" className="focus:bg-[#FF6200] focus:text-black">6 - 20 items</SelectItem>
                                                <SelectItem value="21+" className="focus:bg-[#FF6200] focus:text-black">21+ items</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.itemsReady && <p className="text-red-500 text-sm mt-1 ml-1">{errors.itemsReady.message}</p>}
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1 block mb-3">Student ID Card (Optional)</Label>
                                        <div className="border-2 border-dashed border-white/20 hover:border-[#FF6200]/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center bg-white/5 relative cursor-pointer">
                                            {idCardUrl ? (
                                                <div className="flex flex-col items-center">
                                                    <CheckCircle className="h-10 w-10 text-[#FF6200] mb-3" />
                                                    <span className="text-sm text-[#FF6200] font-bold uppercase tracking-widest">Uploaded Successfully</span>
                                                </div>
                                            ) : isUploading ? (
                                                <div className="flex flex-col items-center">
                                                    <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin mb-3" />
                                                    <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Uploading...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="h-10 w-10 text-zinc-500 mb-3" />
                                                    <span className="text-sm text-zinc-400 text-center font-medium">Click or tap to upload student ID image (Max 5MB)</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileUpload}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        title="Upload Student ID"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || isUploading}
                                        className="w-full bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest h-16 rounded-xl flex items-center justify-center gap-3 text-lg transition-all shadow-[0_0_30px_rgba(255,98,0,0.3)]"
                                    >
                                        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Store className="w-6 h-6" />}
                                        {isSubmitting ? 'Submitting...' : 'Submit Campus Application'}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
