'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, CheckCircle, Upload, Loader2, ArrowLeft, ArrowRight, MapPin, Briefcase, FileText, User } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const UNIVERSITIES = [
    "University of Abuja",
    "Baze University",
    "Nile University of Nigeria",
    "Veritas University",
    "Bingham University"
];

const CATEGORIES = [
    "Textbooks", "Laptops", "Wigs & Hair", "Fashion", "Food & Snacks", "Gadgets", "Hostel Items", "Services"
];

export default function SellerOnboardPage() {
    const { toast } = useToast();
    const { user, refreshUser, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Existing DB status
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    const [formData, setFormData] = useState({
        university: '',
        campusArea: '',
        phoneNumber: '',
        sellCategories: [] as string[],
        otherCategoryDetails: '',
        idCardUrl: '',
        bio: ''
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signup?role=student_seller');
            return;
        }
        if (!user) return;

        async function fetchStatus() {
            try {
                const { data } = await supabase.from('seller_applications').select('status').eq('user_id', user?.id).single();
                if (data?.status) {
                    setExistingStatus(data.status);
                    if (data.status === 'pending') {
                        setIsSuccess(true);
                    } else if (data.status === 'approved') {
                        router.push('/seller/dashboard');
                    }
                }
            } catch (err) {
                // Not found, continue
            } finally {
                setIsLoadingInitial(false);
            }
        }

        // Let's populate phone number if we have it
        if (user.phone_number) {
            setFormData(prev => ({ ...prev, phoneNumber: user.phone_number! }));
        }

        fetchStatus();
    }, [user, loading, supabase, router]);

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const handleCategoryToggle = (category: string) => {
        setFormData(prev => {
            const temp = [...prev.sellCategories];
            if (temp.includes(category)) {
                return { ...prev, sellCategories: temp.filter(c => c !== category) };
            } else {
                return { ...prev, sellCategories: [...temp, category] };
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast('File too large. Please select an image under 5MB.', 'error');
            return;
        }

        setIsUploading(true);
        try {
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

            setFormData(prev => ({ ...prev, idCardUrl: publicUrl }));
            toast('ID Card uploaded successfully.', 'success');
        } catch (error: any) {
            toast(error.message || 'Upload failed', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const payload = {
                userId: user.id,
                fullName: user.displayName || user.email,
                studentEmail: user.email,
                phoneNumber: formData.phoneNumber,
                university: formData.university,
                campusArea: formData.campusArea,
                sellCategories: formData.sellCategories,
                idCardUrl: formData.idCardUrl,
                bio: formData.bio,
            };

            const res = await fetch('/api/seller-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Submission failed');

            // Also update raw users table status
            await supabase.from('users').update({ isVerified: false, phone_number: formData.phoneNumber }).eq('id', user.id);

            setIsSuccess(true);
            toast('Application submitted successfully!', 'success');

            // Re-fetch context
            await refreshUser();

        } catch (error: any) {
            toast(error.message || 'Submission failed.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Quick validation checkers
    const isStep1Valid = formData.university !== '' && formData.phoneNumber.length >= 10 && formData.campusArea !== '';
    const isStep2Valid = formData.sellCategories.length > 0;
    const isStep3Valid = formData.idCardUrl !== '';

    if (isLoadingInitial) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 text-[#FF6200] animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 animate-pulse">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-8">
                    <div className="mx-auto h-28 w-28 bg-[#FF6200]/10 border-2 border-[#FF6200]/20 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,98,0,0.15)]">
                        <CheckCircle className="h-14 w-14 text-[#FF6200]" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                            Application <span className="text-[#FF6200]">Submitted!</span>
                        </h2>
                        <p className="text-white/50 font-medium leading-relaxed max-w-sm mx-auto">
                            Your seller application is under review. Our team will manually verify your details and activate your account within 24 hours.
                        </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-left space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">What happens next</p>
                        {["Admin reviews your ID card & details", "You receive an approval notification", "Start listing products immediately"].map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-[#FF6200]/10 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-black text-[#FF6200]">{i + 1}</span>
                                </div>
                                <p className="text-white/60 text-sm font-medium">{step}</p>
                            </div>
                        ))}
                    </div>
                    <Link href="/marketplace" className="block">
                        <Button className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black uppercase tracking-widest rounded-2xl transition-all">
                            Browse Marketplace
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const stepLabels = ['Location', 'Products', 'ID Verify', 'Profile'];

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-zinc-950 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#FF6200]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-full max-w-2xl relative z-10">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <Link href="/" className="inline-flex items-center text-white/30 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-colors">
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic">
                        Seller <span className="text-[#FF6200]">Setup</span>
                    </h1>
                    <p className="text-white/40 font-medium mt-2 text-sm">Complete all 4 steps to apply as a verified seller</p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 mb-10">
                    {[1, 2, 3, 4].map(s => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-2 ${s < 4 ? 'flex-1' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${step > s ? 'bg-[#FF6200] text-black' :
                                    step === s ? 'bg-[#FF6200]/20 text-[#FF6200] border-2 border-[#FF6200]' :
                                        'bg-white/5 text-white/30 border border-white/10'
                                    }`}>
                                    {step > s ? '✓' : s}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${step >= s ? 'text-white/60' : 'text-white/20'}`}>
                                    {stepLabels[s - 1]}
                                </span>
                            </div>
                            {s < 4 && <div className={`h-px flex-1 transition-colors ${step > s ? 'bg-[#FF6200]' : 'bg-white/10'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-zinc-900/80 border border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm">

                    {/* STEP 1: Basics */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Location & Contact</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Where are you selling from?</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">University *</label>
                                    <select
                                        value={formData.university}
                                        onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                                        aria-label="Select your university"
                                        title="Select your university"
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white font-medium mt-2 outline-none appearance-none transition-colors"
                                    >
                                        <option value="" disabled>Select your university</option>
                                        {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Campus Area / Hostel *</label>
                                    <input
                                        type="text"
                                        value={formData.campusArea}
                                        onChange={(e) => setFormData(prev => ({ ...prev, campusArea: e.target.value }))}
                                        placeholder="e.g. Main Campus, Block C"
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">WhatsApp / Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                        placeholder="080XXXXXXXX"
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleNext} disabled={!isStep1Valid} className="w-full h-14 mt-4 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10 transition-all">
                                Next: Products <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: Business */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><Briefcase className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">What do you sell?</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Select all that apply</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryToggle(cat)}
                                        className={`h-14 flex items-center justify-center px-4 rounded-2xl border-2 font-bold text-sm transition-all ${formData.sellCategories.includes(cat)
                                            ? 'bg-[#FF6200]/10 border-[#FF6200] text-[#FF6200]'
                                            : 'bg-zinc-950 border-zinc-700 text-white/60 hover:border-zinc-500'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-700 bg-transparent text-white/60 hover:text-white hover:bg-white/5">Back</Button>
                                <Button onClick={handleNext} disabled={!isStep2Valid} className="flex-1 h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10">
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Verification */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><User className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Student ID Verification</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Keeps the platform safe & trusted</p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-zinc-700 hover:border-[#FF6200] transition-colors rounded-3xl p-12 flex flex-col items-center justify-center bg-zinc-950 relative cursor-pointer group">
                                {formData.idCardUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 rounded-full bg-[#FF6200]/10 flex items-center justify-center">
                                            <CheckCircle className="h-8 w-8 text-[#FF6200]" />
                                        </div>
                                        <span className="text-white font-black uppercase tracking-wider">ID Uploaded!</span>
                                        <span className="text-[#FF6200] text-xs font-bold uppercase tracking-wider group-hover:underline">Click to change</span>
                                    </div>
                                ) : isUploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin" />
                                        <span className="text-white/60 font-bold text-sm">Uploading...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 text-white/20 mb-4 group-hover:text-[#FF6200] transition-colors" />
                                        <span className="text-white font-black uppercase tracking-wide mb-2">Upload Student ID Card</span>
                                        <span className="text-white/40 text-sm text-center font-medium">JPG, PNG or WEBP — max 5MB</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" title="Upload Student ID" />
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-700 bg-transparent text-white/60 hover:text-white hover:bg-white/5">Back</Button>
                                <Button onClick={handleNext} disabled={!isStep3Valid} className="flex-1 h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10">
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Bio & Submit */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><FileText className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Store Profile</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Tell buyers about your store</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Store Bio (Optional)</label>
                                <textarea
                                    rows={5}
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell buyers what you sell and when you're available. e.g. I sell fresh snacks in Block C, available 6pm–10pm daily."
                                    className="w-full p-5 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none resize-none transition-colors"
                                />
                            </div>

                            <div className="bg-[#FF6200]/5 border border-[#FF6200]/10 rounded-2xl p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200]/60 mb-2">Ready to submit</p>
                                <p className="text-white/50 text-xs font-medium">Your application will be reviewed by our team within 24 hours. You'll be notified once approved.</p>
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-700 bg-transparent text-white/60 hover:text-white hover:bg-white/5" disabled={isSubmitting}>Back</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10 flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin h-5 w-5" /> Submitting...</>
                                    ) : (
                                        <><Store className="h-5 w-5" /> Submit Application</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
