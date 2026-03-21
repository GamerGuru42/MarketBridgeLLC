'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Store, CheckCircle, Upload, Loader2, ArrowLeft, ArrowRight, MapPin, Zap, Mail, KeyRound, Briefcase, User } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const UNIVERSITIES = [
    "Cosmopolitan University Abuja",
    "Nile University of Nigeria",
    "Veritas University",
    "University of Abuja",
    "Bingham University",
    "Baze University",
    "Philomath University",
    "Other"
];

const CATEGORIES = [
    { label: "Phones & Gadgets", emoji: "📱", value: "Phones/Gadgets" },
    { label: "Fashion & Thrift", emoji: "👗", value: "Fashion/Thrift" },
    { label: "Textbooks & Notes", emoji: "📚", value: "Textbooks/Notes" },
    { label: "Food & Snacks", emoji: "🍱", value: "Food/Snacks" },
    { label: "Services", emoji: "🛠️", value: "Services" },
    { label: "Other", emoji: "📦", value: "Other" },
];

function makeSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');
}

export default function SellerOnboardPage() {
    const { toast } = useToast();
    const { user, refreshUser, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        otp: '',
        university: '',
        universityOther: '',
        campusZone: '',
        phoneNumber: '',
        shopName: '',
        sellCategories: [] as string[],
        idCardUrl: '',
    });

    useEffect(() => {
        if (loading) return;

        async function fetchStatus() {
            if (!user) {
                // Not logged in -> start at step 1 (OTP setup)
                setIsLoadingInitial(false);
                return;
            }
            
            try {
                const { data } = await supabase
                    .from('seller_applications')
                    .select('status')
                    .eq('user_id', user.id)
                    .single();
                
                if (data?.status === 'approved') {
                    router.push('/seller/dashboard');
                    return;
                } else if (data?.status === 'pending') {
                    setIsSuccess(true);
                } else {
                    // Logged in but no application -> skip to Step 3
                    setStep(3);
                }
            } catch {
                setStep(3);
            } finally {
                setIsLoadingInitial(false);
            }
        }

        fetchStatus();
    }, [user, loading, supabase, router]);

    const handleSendOTP = async () => {
        if (!formData.email || !formData.firstName || !formData.lastName || !formData.university || !formData.shopName) {
            toast('Please fill all fields to continue', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role: 'student_seller'
                    }
                }
            });
            if (error) throw error;
            toast('Verification code sent to your email!', 'success');
            setStep(2);
        } catch (error: any) {
            toast(error.message || 'Failed to send code.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (formData.otp.length !== 6) {
            toast('Please enter a valid 6-digit code', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: formData.email,
                token: formData.otp,
                type: 'email'
            });
            if (error) throw error;

            await refreshUser();
            
            // Upsert basic user record
            if (data.user) {
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: formData.email,
                    display_name: `${formData.firstName} ${formData.lastName}`.trim(),
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    role: 'student_seller',
                    email_verified: true,
                }, { onConflict: 'id' });
            }

            toast('Verified! Let\'s finish setting up your shop.', 'success');
            setStep(3);
        } catch (error: any) {
            toast(error.message || 'Invalid code.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (file.size > 5 * 1024 * 1024) {
            toast('File too large. Max 5MB.', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/webp' as const };
            const uploadFile = file.type.startsWith('image/') ? await imageCompression(file, options) : file;
            const fileName = `id_${Date.now()}.${file.type === 'application/pdf' ? 'pdf' : 'webp'}`;
            
            const { error: uploadError } = await supabase.storage
                .from('seller_docs')
                .upload(`id_cards/${fileName}`, uploadFile, { upsert: true, contentType: file.type === 'application/pdf' ? 'application/pdf' : 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('seller_docs').getPublicUrl(`id_cards/${fileName}`);
            setFormData(prev => ({ ...prev, idCardUrl: publicUrl }));
            toast('ID uploaded successfully ✅', 'success');
        } catch (error: any) {
            toast('Upload failed. Try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitApplication = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const university = formData.university === 'Other' ? formData.universityOther : formData.university;
            
            const payload = {
                userId: user.id,
                fullName: user.displayName || `${formData.firstName} ${formData.lastName}`,
                studentEmail: user.email || formData.email,
                phoneNumber: formData.phoneNumber,
                university: university || 'Unknown',
                campusArea: formData.campusZone,
                sellCategories: formData.sellCategories,
                businessType: 'student_hustler',
                shopName: formData.shopName,
                shopSlug: makeSlug(formData.shopName),
                idCardUrl: formData.idCardUrl,
                autoApprove: true,
            };

            const res = await fetch('/api/seller-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Submission failed');

            // Auto-approve instantly
            await supabase.from('users').update({
                is_verified: true,
                phone_number: formData.phoneNumber,
                role: 'dealer',
            }).eq('id', user.id);

            setIsSuccess(true);
            toast('You\'re approved! 🎉 Welcome, Founding Seller!', 'success');
            await refreshUser();
        } catch (error: any) {
            toast(error.message || 'Submission failed. Try again!', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCategory = (cat: string) => {
        setFormData(prev => {
            if (prev.sellCategories.includes(cat)) {
                return { ...prev, sellCategories: prev.sellCategories.filter(c => c !== cat) };
            }
            if (prev.sellCategories.length < 3) {
                return { ...prev, sellCategories: [...prev.sellCategories, cat] };
            }
            return prev;
        });
    };

    if (isLoadingInitial) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading setup...</p>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-8">
                    <div className="mx-auto h-28 w-28 bg-primary/10 border-2 border-primary/20 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,98,0,0.15)]">
                        <CheckCircle className="h-14 w-14 text-primary" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground italic">You're <span className="text-primary">In!</span></h2>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 rounded-full px-5 py-2">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-black uppercase tracking-widest text-amber-600">Founding Seller</span>
                        </div>
                        <p className="text-muted-foreground font-medium max-w-sm mx-auto">Welcome to MarketBridge! Your shop is live — start listing products now!</p>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3 text-left">
                        <Zap className="h-5 w-5 text-primary shrink-0" />
                        <p className="text-muted-foreground text-sm font-medium">
                            <strong className="text-primary">₦500 MarketCredit</strong> will be added on your first sale!
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button onClick={() => router.push('/seller/dashboard')} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg border-none">
                            Go to Seller Dashboard
                        </Button>
                        <Button onClick={() => router.push('/subscriptions')} variant="outline" className="w-full h-14 border-primary/30 text-primary font-black uppercase tracking-widest rounded-2xl bg-transparent hover:bg-primary/5">
                            Subscribe — ₦1,000/month
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const stepLabels = ['Account Info', 'Verification', 'Shop Details'];

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-background relative selection:bg-primary selection:text-black">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 uppercase text-[10px] font-black tracking-widest transition-colors">
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic">
                        Start <span className="text-primary">Selling</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2 text-sm">3 quick steps and your store is live ✨</p>
                </div>

                <div className="flex items-center justify-between mb-8 px-2 max-w-md mx-auto">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex flex-col items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                step > s ? 'bg-primary text-black' : 
                                step === s ? 'bg-primary/20 border-2 border-primary text-primary' : 
                                'bg-muted border border-border text-muted-foreground'
                            }`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s ? 'text-foreground/70' : 'text-muted-foreground/40'}`}>
                                {stepLabels[s-1]}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-[2.5rem] p-8 backdrop-blur-sm shadow-xl relative overflow-hidden">
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                                <div><h2 className="text-lg font-black text-foreground">Basic Info</h2><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Create your network identity</p></div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">First Name</label><input value={formData.firstName} onChange={e => setFormData(p => ({...p, firstName: e.target.value}))} className="w-full h-12 px-4 bg-muted border border-input rounded-xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="John" /></div>
                                <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Last Name</label><input value={formData.lastName} onChange={e => setFormData(p => ({...p, lastName: e.target.value}))} className="w-full h-12 px-4 bg-muted border border-input rounded-xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="Doe" /></div>
                            </div>

                            <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Email Address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} className="w-full h-12 pl-12 pr-4 bg-muted border border-input rounded-xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="student@university.edu.ng" /></div></div>

                            <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">University</label><select value={formData.university} onChange={e => setFormData(p => ({...p, university: e.target.value}))} className="w-full h-12 px-4 bg-muted border border-input rounded-xl outline-none font-medium text-sm appearance-none"><option value="" disabled>Select your campus</option>{UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                            
                            {formData.university === 'Other' && <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Specify University</label><input value={formData.universityOther} onChange={e => setFormData(p => ({...p, universityOther: e.target.value}))} className="w-full h-12 px-4 bg-muted border border-input rounded-xl font-medium text-sm" placeholder="University name" /></div>}

                            <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Shop/Brand Name</label><div className="relative"><Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><input value={formData.shopName} onChange={e => setFormData(p => ({...p, shopName: e.target.value}))} className="w-full h-12 pl-12 pr-4 bg-muted border border-input rounded-xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="E.g. Jay's Thrifts & Gadgets" /></div></div>

                            <Button onClick={handleSendOTP} disabled={isSubmitting} className="w-full h-14 mt-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 border-none">
                                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center">Continue <ArrowRight className="ml-2 h-4 w-4" /></div>}
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-4">
                            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2"><KeyRound className="h-8 w-8 text-primary" /></div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground italic">Check your email</h2>
                            <p className="text-xs text-muted-foreground font-medium mb-6">We've sent a secure 6-digit code to <strong className="text-foreground">{formData.email}</strong></p>
                            
                            <input autoFocus type="text" maxLength={6} value={formData.otp} onChange={e => setFormData(p => ({...p, otp: e.target.value.replace(/\D/g, '')}))} placeholder="••••••" className="w-full max-w-[200px] mx-auto h-16 bg-muted border border-input rounded-2xl text-center text-3xl tracking-[0.5em] font-black focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground block placeholder:text-muted-foreground/30" />

                            <div className="pt-6 flex justify-between items-center w-full gap-4">
                                <Button variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting} className="flex-1 h-12 uppercase text-[10px] font-black tracking-widest rounded-xl hover:bg-secondary"><ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back</Button>
                                <Button onClick={handleVerifyOTP} disabled={isSubmitting || formData.otp.length < 6} className="flex-[2] h-12 bg-foreground text-background font-black uppercase tracking-widest rounded-xl hover:opacity-90 border-none disabled:opacity-50">
                                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify Code'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center"><Briefcase className="h-5 w-5 text-primary" /></div>
                                <div><h2 className="text-lg font-black text-foreground">Final Details</h2><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Complete your shop setup</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Phone / WhatsApp</label><input value={formData.phoneNumber} onChange={e => setFormData(p => ({...p, phoneNumber: e.target.value}))} className="w-full h-12 px-4 bg-muted border border-input rounded-xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="080..." /></div>
                                <div className="space-y-1.5"><label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Campus Logistics</label><input value={formData.campusZone} onChange={e => setFormData(p => ({...p, campusZone: e.target.value}))} className="w-full h-12 px-4 bg-muted border border-input rounded-xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="Zone / Location" /></div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Top Selling Categories (Max 3)</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => {
                                        const isSelected = formData.sellCategories.includes(cat.value);
                                        return (
                                            <button key={cat.value} onClick={() => toggleCategory(cat.value)} className={`h-10 px-4 rounded-xl text-xs font-bold transition-all border ${isSelected ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(255,98,0,0.1)]' : 'bg-muted border-transparent text-muted-foreground hover:bg-secondary'}`}>
                                                {cat.emoji} {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="text-[10px] uppercase font-black text-foreground flex items-center gap-2 tracking-widest ml-2">Upload Student ID <span className="bg-muted px-2 py-0.5 rounded text-[8px]">Optional</span></label>
                                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center bg-muted/30 hover:bg-muted/50 transition-colors relative group">
                                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" title="Upload Student ID" />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center"><Loader2 className="h-8 w-8 text-primary animate-spin mb-2" /><p className="text-xs text-muted-foreground font-bold">Uploading secure channel...</p></div>
                                    ) : formData.idCardUrl ? (
                                        <div className="space-y-2"><div className="mx-auto h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div><p className="text-xs font-bold text-green-500/70">ID Uploaded Successfully</p></div>
                                    ) : (
                                        <div className="space-y-3"><div className="mx-auto h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="h-4 w-4 text-primary" /></div><p className="text-xs text-muted-foreground font-medium">Click to upload or drag & drop<br/><span className="opacity-70 text-[10px]">Max 5MB (Image or PDF)</span></p></div>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleSubmitApplication} disabled={isSubmitting || formData.phoneNumber.length < 10} className="w-full h-14 mt-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:opacity-90 border-none shadow-lg shadow-primary/20">
                                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Complete Setup & Auto-Approve'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
