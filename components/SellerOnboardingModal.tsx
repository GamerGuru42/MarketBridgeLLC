'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Send, X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';

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

export const SellerOnboardingModal = () => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
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

            const { error: uploadError, data } = await supabase.storage
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

            // Optional: Auto close after 3 seconds
            setTimeout(() => {
                setIsOpen(false);
                setIsSuccess(false);
                setFormData({
                    fullName: '', phoneNumber: '', university: '', studentEmail: '',
                    sellCategories: [], itemsReady: '', idCardUrl: ''
                });
            }, 3000);

        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Something went wrong.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto h-12 px-8 border-[#FF6200]/50 text-[#FF6200] hover:bg-[#FF6200]/10 hover:text-[#FF6200] rounded-xl font-black uppercase tracking-widest bg-transparent">
                    Join as Campus Seller
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 text-white scrollbar-hide p-6 md:p-8">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-[#FF6200]" />
                        <h2 className="text-2xl font-black uppercase">Application Received</h2>
                        <p className="text-zinc-400">Thank you! Your seller application is under review. We'll reply within 48 hours.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-widest text-[#FF6200] uppercase">Campus Crew</h2>
                                <p className="text-zinc-400 text-sm mt-1">Join as a verified student seller.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-zinc-300">Full Name *</Label>
                                    <Input
                                        name="fullName" value={formData.fullName} onChange={handleChange}
                                        placeholder="John Doe"
                                        className="bg-black border-white/20 text-white mt-1 h-12"
                                    />
                                </div>

                                <div>
                                    <Label className="text-zinc-300">Phone Number *</Label>
                                    <Input
                                        name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                                        placeholder="08012345678" type="tel"
                                        className="bg-black border-white/20 text-white mt-1 h-12"
                                    />
                                </div>

                                <div>
                                    <Label className="text-zinc-300">University *</Label>
                                    <Select onValueChange={(val) => handleSelectChange('university', val)}>
                                        <SelectTrigger className="bg-black border-white/20 text-white mt-1 h-12">
                                            <SelectValue placeholder="Select University" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/20 text-white">
                                            {UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-zinc-300">Student Email (.edu or .edu.ng) *</Label>
                                    <Input
                                        name="studentEmail" type="email" value={formData.studentEmail} onChange={handleChange}
                                        placeholder="john.doe@uniabuja.edu.ng"
                                        className="bg-black border-white/20 text-white mt-1 h-12"
                                    />
                                </div>

                                <div>
                                    <Label className="text-zinc-300 mb-2 block">What will you sell? *</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {CATEGORIES.map(category => (
                                            <div key={category} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#FF6200]/30 transition-colors">
                                                <Checkbox
                                                    id={category}
                                                    checked={formData.sellCategories.includes(category)}
                                                    onCheckedChange={() => handleCategoryToggle(category)}
                                                    className="border-white/30 data-[state=checked]:bg-[#FF6200] data-[state=checked]:border-[#FF6200]"
                                                />
                                                <label htmlFor={category} className="text-sm cursor-pointer whitespace-nowrap">{category}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-zinc-300">How many items ready to sell? *</Label>
                                    <Select onValueChange={(val) => handleSelectChange('itemsReady', val)}>
                                        <SelectTrigger className="bg-black border-white/20 text-white mt-1 h-12">
                                            <SelectValue placeholder="Select Quantity" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/20 text-white">
                                            <SelectItem value="1-5">1 - 5 items</SelectItem>
                                            <SelectItem value="6-20">6 - 20 items</SelectItem>
                                            <SelectItem value="21+">21+ items</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-zinc-300 block mb-2">Student ID Card (Optional)</Label>
                                    <div className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 relative">
                                        {formData.idCardUrl ? (
                                            <div className="flex flex-col items-center">
                                                <CheckCircle className="h-8 w-8 text-[#FF6200] mb-2" />
                                                <span className="text-sm text-[#FF6200] font-bold">Uploaded Successfully</span>
                                            </div>
                                        ) : isUploading ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="h-8 w-8 text-[#FF6200] animate-spin mb-2" />
                                                <span className="text-sm text-zinc-400">Uploading...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                                                <span className="text-sm text-zinc-400 text-center">Click to upload image (Max 5MB)</span>
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

                            <Button
                                type="submit"
                                disabled={isSubmitting || isUploading}
                                className="w-full bg-[#FF6200] hover:bg-[#ff7a2b] text-white font-black uppercase tracking-widest h-14 rounded-xl flex items-center gap-2 mt-8"
                            >
                                {isSubmitting ? 'Submitting...' : <><Store className="w-5 h-5" /> Submit Application</>}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
