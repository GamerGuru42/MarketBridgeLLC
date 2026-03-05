'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Store, CheckCircle, Upload, Loader2, ArrowLeft, ArrowRight, MapPin, Briefcase, FileText, User, Zap, ShieldCheck } from 'lucide-react';
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
    "Bingham University",
    "Philomath University",
    "Other (specify below)",
];

const HOSTEL_ZONES = [
    "Gwagwalada (UniAbuja Main Campus)",
    "Gwarinpa",
    "Wuse / Wuse 2",
    "Garki",
    "Maitama",
    "Kubwa",
    "Karu / Nyanya",
    "Jabi / Airport Road",
    "Baze University Area",
    "Nile University Area",
    "Other",
];

const CATEGORIES: { label: string; emoji: string; value: string }[] = [
    { label: "Phones & Gadgets", emoji: "📱", value: "Phones/Gadgets" },
    { label: "Fashion & Thrift", emoji: "👗", value: "Fashion/Thrift" },
    { label: "Textbooks & Notes", emoji: "📚", value: "Textbooks/Notes" },
    { label: "Food & Snacks", emoji: "🍱", value: "Food/Snacks" },
    { label: "Beauty & Hair", emoji: "💄", value: "Beauty/Hair" },
    { label: "Services", emoji: "🛠️", value: "Services" },
    { label: "Digital Products", emoji: "💻", value: "Digital" },
    { label: "Other", emoji: "📦", value: "Other" },
];

function makeSlug(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');
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
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    const [formData, setFormData] = useState({
        university: '',
        universityOther: '',
        campusZone: '',
        pickupSpot: '',
        phoneNumber: '',
        businessType: 'side_hustler' as 'side_hustler' | 'registered_business',
        shopName: '',
        sellCategories: [] as string[],
        serviceMode: '' as '' | 'in_person' | 'remote' | 'both',
        idCardUrl: '',
        bio: '',
    });

    // Derived slug preview
    const shopSlug = makeSlug(formData.shopName || (user?.displayName?.split(' ')[0] || '') + 's-shop');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signup?role=student_seller');
            return;
        }
        if (!user) return;

        async function fetchStatus() {
            try {
                const { data } = await supabase
                    .from('seller_applications')
                    .select('status')
                    .eq('user_id', user?.id)
                    .single();
                if (data?.status) {
                    setExistingStatus(data.status);
                    if (data.status === 'pending') setIsSuccess(true);
                    else if (data.status === 'approved') router.push('/seller/dashboard');
                }
            } catch {
                // Not found — first time, continue
            } finally {
                setIsLoadingInitial(false);
            }
        }

        if (user.phone_number) {
            setFormData(prev => ({ ...prev, phoneNumber: user.phone_number! }));
        }
        fetchStatus();
    }, [user, loading, supabase, router]);

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const handleCategoryToggle = (value: string) => {
        setFormData(prev => {
            const temp = [...prev.sellCategories];
            if (temp.includes(value)) {
                return { ...prev, sellCategories: temp.filter(c => c !== value) };
            } else if (temp.length < 3) {
                return { ...prev, sellCategories: [...temp, value] };
            }
            return prev; // max 3 for Starter
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            toast('File too large. Please select an image or PDF under 10MB.', 'error');
            return;
        }

        setIsUploading(true);
        try {
            let uploadFile: File | Blob = file;
            let ext = 'webp';

            const isPDF = file.type === 'application/pdf';
            if (!isPDF && file.type.startsWith('image/')) {
                // Compress images to WebP
                const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/webp' as const };
                uploadFile = await imageCompression(file, options);
            } else if (isPDF) {
                ext = 'pdf';
            } else {
                throw new Error('Only image files (JPG, PNG, WebP) or PDF are accepted.');
            }

            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${ext}`;
            const filePath = `id_cards/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('seller_docs')
                .upload(filePath, uploadFile, { upsert: true, contentType: isPDF ? 'application/pdf' : 'image/webp' });

            if (uploadError) {
                if (uploadError.message?.includes('bucket') || uploadError.message?.includes('404')) {
                    throw new Error('Storage not configured. Please contact support or run the setup script.');
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('seller_docs').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, idCardUrl: publicUrl }));
            toast('ID uploaded! ✅', 'success');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast(error.message || 'Upload failed. Check your connection and try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const shopName = formData.shopName.trim() || `${user.displayName?.split(' ')[0] || 'My'}'s Shop`;
            const university = formData.university === 'Other (specify below)' ? formData.universityOther : formData.university;

            const payload = {
                userId: user.id,
                fullName: user.displayName || user.email,
                studentEmail: user.email,
                phoneNumber: formData.phoneNumber,
                university,
                campusArea: `${formData.campusZone}${formData.pickupSpot ? ' — ' + formData.pickupSpot : ''}`,
                sellCategories: formData.sellCategories,
                businessType: formData.businessType,
                shopName,
                shopSlug: makeSlug(shopName),
                serviceMode: formData.serviceMode || undefined,
                idCardUrl: formData.idCardUrl,
                bio: formData.bio,
            };

            const res = await fetch('/api/seller-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Submission failed');

            // Fix: use is_verified (snake_case) not isVerified
            await supabase.from('users').update({
                is_verified: false,
                phone_number: formData.phoneNumber,
            }).eq('id', user.id);

            setIsSuccess(true);
            toast('Application submitted! 🎉 Review takes 2–24 hours.', 'success');
            await refreshUser();
        } catch (error: any) {
            toast(error.message || 'Submission failed. Try again!', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validation
    const isOnlyServices = formData.sellCategories.length > 0 &&
        formData.sellCategories.every(c => c === 'Services');
    const isStep1Valid = formData.university !== '' &&
        (formData.university !== 'Other (specify below)' || formData.universityOther.trim().length > 2) &&
        formData.campusZone !== '' &&
        formData.phoneNumber.length >= 10;
    const isStep2Valid = formData.sellCategories.length > 0;
    // Step 3 (ID) is always valid — ID upload is optional, sellers get 14-day trial regardless
    const isStep3Valid = true;

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
                            You're <span className="text-[#FF6200]">In!</span>
                        </h2>
                        <p className="text-white/50 font-medium leading-relaxed max-w-sm mx-auto">
                            Your seller application is under review. Our team verifies details within 2–24 hours. You'll get a WhatsApp notification when approved!
                        </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-left space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">What happens next</p>
                        {[
                            "Admin reviews your ID & shop details",
                            "You get a WhatsApp approval notification",
                            "Start listing & making money 🔥",
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-[#FF6200]/10 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-black text-[#FF6200]">{i + 1}</span>
                                </div>
                                <p className="text-white/60 text-sm font-medium">{s}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-[#FF6200]/5 border border-[#FF6200]/10 rounded-2xl p-4 flex items-center gap-3">
                        <Zap className="h-5 w-5 text-[#FF6200] shrink-0" />
                        <p className="text-white/60 text-sm font-medium text-left">
                            <strong className="text-[#FF6200]">₦500 MarketCredit</strong> will be added to your account on your first sale. 🎁
                        </p>
                    </div>
                    <Link href="/marketplace">
                        <Button className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black uppercase tracking-widest rounded-2xl transition-all">
                            Browse Marketplace While You Wait
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const stepLabels = ['Campus Info', 'Your Shop', 'ID (Optional)', 'Profile & Submit'];

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-zinc-950 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#FF6200]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-full max-w-2xl relative z-10">

                {/* Page Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center text-white/30 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-colors">
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic">
                        Start <span className="text-[#FF6200]">Selling</span>
                    </h1>
                    <p className="text-white/40 font-medium mt-2 text-sm">
                        No CAC required — perfect for campus side hustles ✨
                    </p>
                </div>

                {/* Incentive Banner */}
                <div className="flex items-center gap-3 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-2xl px-5 py-3 mb-8">
                    <Zap className="h-5 w-5 text-[#FF6200] shrink-0" />
                    <p className="text-white/70 text-sm font-bold">
                        <span className="text-[#FF6200]">⚡ Complete setup today</span> — earn ₦500 MarketCredit on your first sale
                    </p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-1.5 mb-8">
                    {[1, 2, 3, 4].map(s => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-1.5 ${s < 4 ? 'flex-1' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${step > s ? 'bg-[#FF6200] text-black' :
                                    step === s ? 'bg-[#FF6200]/20 text-[#FF6200] border-2 border-[#FF6200]' :
                                        'bg-white/5 text-white/30 border border-white/10'
                                    }`}>
                                    {step > s ? '✓' : s}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${step >= s ? 'text-white/50' : 'text-white/20'}`}>
                                    {stepLabels[s - 1]}
                                </span>
                            </div>
                            {s < 4 && <div className={`h-px flex-1 transition-colors ${step > s ? 'bg-[#FF6200]' : 'bg-white/10'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-zinc-900/80 border border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm">

                    {/* ─── STEP 1: Campus Info ─── */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Campus Info</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Where are you selling from?</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* University */}
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">University *</label>
                                    <select
                                        value={formData.university}
                                        onChange={e => setFormData(prev => ({ ...prev, university: e.target.value, universityOther: '' }))}
                                        aria-label="Select your university"
                                        title="Select your university"
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white font-medium mt-2 outline-none appearance-none transition-colors"
                                    >
                                        <option value="" disabled>Select your university</option>
                                        {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>

                                {/* If "Other" university */}
                                {formData.university === 'Other (specify below)' && (
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Your University Name *</label>
                                        <input
                                            type="text"
                                            value={formData.universityOther}
                                            onChange={e => setFormData(prev => ({ ...prev, universityOther: e.target.value }))}
                                            placeholder="e.g. Summit University Offa"
                                            className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                {/* Hostel / Campus Zone */}
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Hostel / Campus Zone *</label>
                                    <select
                                        value={formData.campusZone}
                                        onChange={e => setFormData(prev => ({ ...prev, campusZone: e.target.value }))}
                                        aria-label="Select your campus zone"
                                        title="Select your campus zone"
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white font-medium mt-2 outline-none appearance-none transition-colors"
                                    >
                                        <option value="" disabled>Where will buyers find you?</option>
                                        {HOSTEL_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                    <p className="text-[10px] text-white/30 font-medium mt-1.5 ml-1">Affects your delivery ETA shown to buyers</p>
                                </div>

                                {/* Pickup Spot */}
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Preferred Pickup Spot (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.pickupSpot}
                                        onChange={e => setFormData(prev => ({ ...prev, pickupSpot: e.target.value }))}
                                        placeholder="e.g. SUG complex gate, Block C canteen"
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none transition-colors"
                                    />
                                </div>

                                {/* WhatsApp Number */}
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1 flex items-center gap-1.5">
                                        <span className="text-green-400 text-sm">📱</span> WhatsApp Number *
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        placeholder="080XXXXXXXX"
                                        maxLength={11}
                                        className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none transition-colors"
                                    />
                                    <p className="text-[10px] text-white/30 font-medium mt-1.5 ml-1">Order alerts & buyer messages come here via WhatsApp</p>
                                </div>
                            </div>

                            <Button onClick={handleNext} disabled={!isStep1Valid} className="w-full h-14 mt-2 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10 transition-all">
                                Next: Your Shop <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* ─── STEP 2: Your Shop ─── */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><Briefcase className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Your Shop</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Tell buyers what you sell</p>
                                </div>
                            </div>

                            {/* Business Type */}
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Business Type</label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {[
                                        { value: 'side_hustler', label: 'Student / Side Hustler', sub: 'No CAC needed ✓', color: 'border-[#FF6200] bg-[#FF6200]/10 text-white' },
                                        { value: 'registered_business', label: 'Registered Business', sub: 'Have CAC docs', color: 'border-zinc-700 bg-zinc-950 text-white/60' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFormData(prev => ({ ...prev, businessType: opt.value as any }))}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.businessType === opt.value ? opt.color : 'border-zinc-800 bg-zinc-950/50 text-white/40'}`}
                                        >
                                            <p className="text-sm font-black">{opt.label}</p>
                                            <p className="text-[10px] font-bold opacity-70 mt-0.5">{opt.sub}</p>
                                        </button>
                                    ))}
                                </div>
                                {formData.businessType === 'side_hustler' && (
                                    <p className="text-[10px] text-[#FF6200]/70 font-bold mt-2 ml-1">
                                        🎉 No CAC registration needed — perfect for campus hustles!
                                    </p>
                                )}
                            </div>

                            {/* Shop Name */}
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Shop / Store Name (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.shopName}
                                    onChange={e => setFormData(prev => ({ ...prev, shopName: e.target.value.slice(0, 40) }))}
                                    placeholder={`${user?.displayName?.split(' ')[0] || 'Your'}'s Shop`}
                                    maxLength={40}
                                    className="w-full h-14 px-4 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none transition-colors"
                                />
                                {shopSlug && (
                                    <p className="text-[10px] text-white/30 font-mono mt-1.5 ml-1 truncate">
                                        🔗 marketbridge.com.ng/shop/<span className="text-[#FF6200]/70">{shopSlug}</span>
                                    </p>
                                )}
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">
                                    What do you sell? * {formData.sellCategories.length > 0 && <span className="text-[#FF6200]">({formData.sellCategories.length}/3 selected)</span>}
                                </label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {CATEGORIES.map(cat => {
                                        const selected = formData.sellCategories.includes(cat.value);
                                        const maxReached = formData.sellCategories.length >= 3 && !selected;
                                        return (
                                            <button
                                                key={cat.value}
                                                onClick={() => handleCategoryToggle(cat.value)}
                                                disabled={maxReached}
                                                className={`h-14 flex items-center gap-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all text-left ${selected
                                                    ? 'bg-[#FF6200]/10 border-[#FF6200] text-[#FF6200]'
                                                    : maxReached
                                                        ? 'bg-zinc-950/50 border-zinc-800 text-white/20 cursor-not-allowed'
                                                        : 'bg-zinc-950 border-zinc-700 text-white/60 hover:border-zinc-500'
                                                    }`}
                                            >
                                                <span className="text-xl">{cat.emoji}</span>
                                                <span>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-white/20 mt-2 ml-1">Max 3 categories on Starter plan</p>
                            </div>

                            {/* Service mode — only visible if Services is selected */}
                            {formData.sellCategories.includes('Services') && (
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">How do you provide your service?</label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {[
                                            { value: 'in_person', label: 'In-Person' },
                                            { value: 'remote', label: 'Remote' },
                                            { value: 'both', label: 'Both' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFormData(prev => ({ ...prev, serviceMode: opt.value as any }))}
                                                className={`h-12 rounded-xl border-2 font-bold text-sm transition-all ${formData.serviceMode === opt.value
                                                    ? 'bg-[#FF6200]/10 border-[#FF6200] text-[#FF6200]'
                                                    : 'bg-zinc-950 border-zinc-700 text-white/50 hover:border-zinc-500'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-700 bg-transparent text-white/60 hover:text-white hover:bg-white/5">Back</Button>
                                <Button onClick={handleNext} disabled={!isStep2Valid} className="flex-1 h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10">
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 3: ID Verify ─── */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><User className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Student ID Verification</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Keeps campus MarketBridge safe & trusted 🎓</p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-[#FF6200] shrink-0 mt-0.5" />
                                <p className="text-white/50 text-xs font-medium leading-relaxed">
                                    Upload your <strong className="text-white/70">School ID, NIN Slip, or any government-issued ID</strong>. Blur your photo if needed — we only check name & school. Review takes 2–24 hours.
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-zinc-700 hover:border-[#FF6200] transition-colors rounded-3xl p-12 flex flex-col items-center justify-center bg-zinc-950 relative cursor-pointer group">
                                {formData.idCardUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 rounded-full bg-[#FF6200]/10 flex items-center justify-center">
                                            <CheckCircle className="h-8 w-8 text-[#FF6200]" />
                                        </div>
                                        <span className="text-white font-black uppercase tracking-wider">ID Uploaded! ✅</span>
                                        <span className="text-[#FF6200] text-xs font-bold uppercase tracking-wider group-hover:underline">Tap to change</span>
                                    </div>
                                ) : isUploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin" />
                                        <span className="text-white/60 font-bold text-sm">Uploading... hang tight 📤</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 text-white/20 mb-4 group-hover:text-[#FF6200] transition-colors" />
                                        <span className="text-white font-black uppercase tracking-wide mb-1">Upload Your ID Card</span>
                                        <span className="text-white/40 text-sm text-center font-medium">School ID, NIN Slip, Voter's Card · max 5MB</span>
                                        <span className="text-white/20 text-[10px] mt-2">Tap or drag & drop</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    capture="environment"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    title="Upload Student ID"
                                    aria-label="Upload Student ID"
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-zinc-700 bg-transparent text-white/60 hover:text-white hover:bg-white/5">Back</Button>
                                <Button onClick={handleNext} disabled={!isStep3Valid} className="flex-1 h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10">
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 4: Bio & Submit ─── */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center"><FileText className="h-5 w-5 text-[#FF6200]" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Store Profile</h2>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">One last thing — tell buyers about you!</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">
                                    Your Bio <span className="text-white/20">(Optional — but highly recommended)</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.bio}
                                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
                                    placeholder={`e.g. 2nd year UniAbuja student. Fresh UK thrift drops every Friday 🔥 DM to order!`}
                                    maxLength={200}
                                    className="w-full p-5 bg-zinc-950 border border-zinc-700 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]/30 rounded-2xl text-white placeholder:text-zinc-600 font-medium mt-2 outline-none resize-none transition-colors"
                                />
                                <p className="text-[10px] text-white/20 mt-1 ml-1 text-right">{formData.bio.length}/200</p>
                            </div>

                            {/* Summary card */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Application Summary</p>
                                {[
                                    { label: 'University', val: formData.university === 'Other (specify below)' ? formData.universityOther : formData.university },
                                    { label: 'Zone', val: formData.campusZone },
                                    { label: 'Shop', val: formData.shopName || `${user?.displayName?.split(' ')[0] || 'My'}'s Shop` },
                                    { label: 'Categories', val: formData.sellCategories.join(', ') },
                                    { label: 'Type', val: formData.businessType === 'side_hustler' ? 'Student / Side Hustler' : 'Registered Business' },
                                ].filter(r => r.val).map(row => (
                                    <div key={row.label} className="flex justify-between items-start gap-4">
                                        <span className="text-[10px] font-black uppercase text-white/30">{row.label}</span>
                                        <span className="text-sm font-bold text-white/60 text-right max-w-[60%] truncate">{row.val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-[#FF6200]/5 border border-[#FF6200]/10 rounded-2xl p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200]/60 mb-1">No CAC · No stress · Review in 2–24 hrs</p>
                                <p className="text-white/40 text-xs font-medium">You'll receive a WhatsApp message when your account is approved and ready to sell!</p>
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

                {/* Support Link */}
                <p className="text-center mt-6 text-white/20 text-[10px] font-bold">
                    Stuck? <a href="https://wa.me/2348000000000?text=Hi%2C%20I%20need%20help%20setting%20up%20my%20seller%20account" target="_blank" rel="noopener noreferrer" className="text-[#FF6200]/60 hover:text-[#FF6200] transition-colors">Chat us on WhatsApp →</a>
                </p>
            </div>
        </div>
    );
}
