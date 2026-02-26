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

const UNIVERSITIES = [
    "University of Abuja",
    "Baze University",
    "Nile University",
    "Veritas University",
    "Cosmopolitan University",
    "Other"
];

const CATEGORIES = [
    "Textbooks", "Laptops", "Wigs & Hair", "Fashion", "Food & Snacks", "Gadgets", "Hostel Items", "Others"
];

export default function SellerOnboardingPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        university: '',
        studentEmail: '',
        sellCategories: [] as string[],
        itemsReady: '',
        idCardUrl: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryToggle = (category: string) => {
        setFormData(prev => {
            const current = prev.sellCategories;
            if (current.includes(category)) {
                return { ...prev, sellCategories: current.filter(c => c !== category) };
            } else {
                return { ...prev, sellCategories: [...current, category] };
            }
        });
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
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `id_cards/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('seller_docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('seller_docs')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, idCardUrl: publicUrl }));
            toast({ title: 'Uploaded!', description: 'ID Card uploaded successfully.' });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.phoneNumber || !formData.university || !formData.studentEmail || formData.sellCategories.length === 0 || !formData.itemsReady) {
            toast({ title: 'Missing fields', description: 'Please fill out all required fields.', variant: 'destructive' });
            return;
        }

        if (!formData.studentEmail.toLowerCase().endsWith('.edu.ng') && !formData.studentEmail.toLowerCase().endsWith('.edu')) {
            toast({ title: 'Invalid Email', description: 'Please use a valid student (.edu or .edu.ng) email address.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/seller-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');

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

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">Full Name *</Label>
                                        <Input
                                            name="fullName" value={formData.fullName} onChange={handleChange}
                                            placeholder="John Doe"
                                            className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">Phone Number *</Label>
                                        <Input
                                            name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                                            placeholder="08012345678" type="tel"
                                            className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">University *</Label>
                                        <Select onValueChange={(val) => handleSelectChange('university', val)}>
                                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base">
                                                <SelectValue placeholder="Select University" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                                {UNIVERSITIES.map(u => <SelectItem key={u} value={u} className="focus:bg-[#FF6200] focus:text-black">{u}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">Student Email (.edu or .edu.ng) *</Label>
                                        <Input
                                            name="studentEmail" type="email" value={formData.studentEmail} onChange={handleChange}
                                            placeholder="your.name@uniabuja.edu.ng"
                                            className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1 block mb-4">What will you sell? *</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {CATEGORIES.map(category => (
                                                <div key={category} className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-[#FF6200]/30 transition-colors cursor-pointer" onClick={() => handleCategoryToggle(category)}>
                                                    <Checkbox
                                                        id={category}
                                                        checked={formData.sellCategories.includes(category)}
                                                        onCheckedChange={() => handleCategoryToggle(category)}
                                                        className="border-white/30 w-5 h-5 data-[state=checked]:bg-[#FF6200] data-[state=checked]:border-[#FF6200]"
                                                    />
                                                    <label className="text-sm font-medium cursor-pointer flex-1">{category}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1">How many items ready to sell? *</Label>
                                        <Select onValueChange={(val) => handleSelectChange('itemsReady', val)}>
                                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-[#FF6200] text-white mt-2 h-14 rounded-xl text-base">
                                                <SelectValue placeholder="Select Quantity" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                                <SelectItem value="1-5" className="focus:bg-[#FF6200] focus:text-black">1 - 5 items</SelectItem>
                                                <SelectItem value="6-20" className="focus:bg-[#FF6200] focus:text-black">6 - 20 items</SelectItem>
                                                <SelectItem value="21+" className="focus:bg-[#FF6200] focus:text-black">21+ items</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-zinc-300 font-bold uppercase text-xs tracking-widest ml-1 block mb-3">Student ID Card (Optional)</Label>
                                        <div className="border-2 border-dashed border-white/20 hover:border-[#FF6200]/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center bg-white/5 relative cursor-pointer">
                                            {formData.idCardUrl ? (
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
