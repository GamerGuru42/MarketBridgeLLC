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
        return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#FF6200]" /></div>;
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] p-10 text-center">
                    <div className="mx-auto h-24 w-24 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-12 w-12 text-[#FF6200]" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 mb-4">Application Pending</h2>
                    <p className="text-zinc-500 font-medium mb-8">
                        Your seller application has been securely submitted. We're keeping things trusted, so expect a quick manual approval before you can start posting listings.
                    </p>
                    <Link href="/marketplace">
                        <Button className="w-full h-14 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-2xl">
                            Return to Marketplace
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-[#FAFAFA]">
            <Card className="w-full max-w-2xl bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] p-8 md:p-12">
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Seller Setup</h1>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] bg-[#FF6200]/10 px-3 py-1.5 rounded-full">
                            Step {step} of 4
                        </div>
                    </div>

                    {/* Clean Progress Bar */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-[#FF6200]' : 'bg-zinc-100'}`} />
                        ))}
                    </div>
                </div>

                {/* STEP 1: Basics */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><MapPin className="h-5 w-5 text-[#FF6200]" /></div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-900">The Basics</h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Where are you selling?</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">University *</label>
                                <select
                                    value={formData.university}
                                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                                    className="w-full h-14 px-4 bg-zinc-50 border border-zinc-200 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] rounded-2xl text-zinc-900 font-medium mt-1 outline-none appearance-none"
                                >
                                    <option value="" disabled>Select your university</option>
                                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Campus Area / Hostel *</label>
                                <input
                                    type="text"
                                    value={formData.campusArea}
                                    onChange={(e) => setFormData(prev => ({ ...prev, campusArea: e.target.value }))}
                                    placeholder="e.g. Main Campus, Block C"
                                    className="w-full h-14 px-4 bg-zinc-50 border border-zinc-200 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] rounded-2xl text-zinc-900 font-medium mt-1 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">WhatsApp / Phone Number *</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                    placeholder="080XXXXXXXX"
                                    className="w-full h-14 px-4 bg-zinc-50 border border-zinc-200 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] rounded-2xl text-zinc-900 font-medium mt-1 outline-none"
                                />
                            </div>
                        </div>

                        <Button onClick={handleNext} disabled={!isStep1Valid} className="w-full h-14 mt-8 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg">
                            Next: Business Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* STEP 2: Business */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><Briefcase className="h-5 w-5 text-[#FF6200]" /></div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-900">What do you sell?</h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select your primary crates</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryToggle(cat)}
                                    className={`h-14 flex items-center justify-center px-4 rounded-xl border-2 font-bold text-sm transition-all ${formData.sellCategories.includes(cat) ? 'bg-[#FF6200]/10 border-[#FF6200] text-[#FF6200]' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-200">Back</Button>
                            <Button onClick={handleNext} disabled={!isStep2Valid} className="flex-1 h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg">
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Verification */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><User className="h-5 w-5 text-[#FF6200]" /></div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-900">Student ID Check</h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Keep buyers safe</p>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-zinc-200 hover:border-[#FF6200] transition-colors rounded-2xl p-10 flex flex-col items-center justify-center bg-zinc-50 relative cursor-pointer group">
                            {formData.idCardUrl ? (
                                <div className="flex flex-col items-center">
                                    <CheckCircle className="h-12 w-12 text-[#FF6200] mb-3" />
                                    <span className="text-sm font-bold text-zinc-900">Uploaded Successfully</span>
                                    <span className="text-xs text-[#FF6200] mt-2 group-hover:underline">Click to change</span>
                                </div>
                            ) : isUploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin mb-3" />
                                    <span className="text-sm font-bold text-zinc-600">Compressing & Uploading...</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 text-zinc-400 mb-4 group-hover:text-[#FF6200] transition-colors" />
                                    <span className="text-base font-bold text-zinc-900 mb-1">Upload Student ID</span>
                                    <span className="text-sm text-zinc-500 text-center font-medium">Clear photo of your Uni ID Card (Max 5MB)</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                title="Upload Student ID"
                            />
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-200">Back</Button>
                            <Button onClick={handleNext} disabled={!isStep3Valid} className="flex-1 h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg">
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 4: Bio & Submit */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><FileText className="h-5 w-5 text-[#FF6200]" /></div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-900">Store Profile</h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">A short description</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Store Description / Bio (Optional)</label>
                            <textarea
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="I sell the freshest cookies in Block C. Delivery times from 6pm to 9pm daily."
                                className="w-full p-4 bg-zinc-50 border border-zinc-200 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] rounded-2xl text-zinc-900 font-medium mt-1 outline-none resize-none"
                            />
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-200" disabled={isSubmitting}>Back</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin h-5 w-5" /> Submitting...</>
                                ) : (
                                    <><Store className="h-5 w-5" /> Submit Setup</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
