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
    "Cosmopolitan University Abuja",
    "Nile University of Nigeria",
    "Veritas University",
    "University of Abuja",
    "Baze University",
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
            return prev;
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        const MAX_SIZE = 10 * 1024 * 1024;
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
                autoApprove: true, // Beta auto-approve
            };

            const res = await fetch('/api/seller-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Submission failed');

            // Beta: auto-approve seller — update user role to dealer immediately
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

    const isStep1Valid = formData.university !== '' &&
        (formData.university !== 'Other (specify below)' || formData.universityOther.trim().length > 2) &&
        formData.campusZone !== '' &&
        formData.phoneNumber.length >= 10;
    const isStep2Valid = formData.sellCategories.length > 0;
    const isStep3Valid = true;

    if (isLoadingInitial) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
                <div className="w-full max-w-md text-center space-y-8">
                    <div className="mx-auto h-28 w-28 bg-primary/10 border-2 border-primary/20 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,98,0,0.15)]">
                        <CheckCircle className="h-14 w-14 text-primary" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground italic">
                            You're <span className="text-primary">In!</span>
                        </h2>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 rounded-full px-5 py-2">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Founding Seller</span>
                        </div>
                        <p className="text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
                            Welcome to MarketBridge! You're officially a Founding Seller. Your shop is live — start listing products now!
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-3xl p-6 text-left space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your next steps</p>
                        {[
                            "Go to your Seller Dashboard",
                            "List your first product or service 🔥",
                            "Subscribe for ₦1,000/month to unlock premium features",
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-black text-primary">{i + 1}</span>
                                </div>
                                <p className="text-muted-foreground text-sm font-medium">{s}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3">
                        <Zap className="h-5 w-5 text-primary shrink-0" />
                        <p className="text-muted-foreground text-sm font-medium text-left">
                            <strong className="text-primary">₦500 MarketCredit</strong> will be added to your account on your first sale. 🎁
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                        <Link href="/seller/dashboard" className="block w-full">
                            <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-primary/20">
                                Go to Seller Dashboard
                            </Button>
                        </Link>
                        <Link href="/subscriptions" className="block w-full">
                            <Button variant="outline" className="w-full h-14 border-primary/30 text-primary font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-primary/5">
                                Subscribe — ₦1,000/month
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const stepLabels = ['Campus Info', 'Your Shop', 'Final Details'];

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-background relative transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-full max-w-2xl relative z-10">

                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 uppercase text-[10px] font-black tracking-widest transition-colors">
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic">
                        Start <span className="text-primary">Selling</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2 text-sm">
                        No CAC required — 3 quick steps and you're live ✨
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 mb-8">
                    <Zap className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-muted-foreground text-sm font-bold">
                        <span className="text-primary">⚡ Instant approval</span> — become a Founding Seller today + earn ₦500 on your first sale
                    </p>
                </div>

                <div className="flex items-center gap-1.5 mb-8">
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-1.5 ${s < 3 ? 'flex-1' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${step > s ? 'bg-primary text-primary-foreground' :
                                    step === s ? 'bg-primary/20 text-primary border-2 border-primary' :
                                        'bg-muted text-muted-foreground border border-border'
                                    }`}>
                                    {step > s ? '✓' : s}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${step >= s ? 'text-foreground/50' : 'text-muted-foreground/30'}`}>
                                    {stepLabels[s - 1]}
                                </span>
                            </div>
                            {s < 3 && <div className={`h-px flex-1 transition-colors ${step > s ? 'bg-primary' : 'bg-border'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm shadow-xl">

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Campus Info</h2>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Where are you selling from?</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">University *</label>
                                    <select
                                        value={formData.university}
                                        onChange={e => setFormData(prev => ({ ...prev, university: e.target.value, universityOther: '' }))}
                                        aria-label="Select your university"
                                        title="Select your university"
                                        className="w-full h-14 px-4 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground font-medium mt-2 outline-none appearance-none transition-colors"
                                    >
                                        <option value="" disabled className="bg-card">Select your university</option>
                                        {UNIVERSITIES.map(u => <option key={u} value={u} className="bg-card">{u}</option>)}
                                    </select>
                                </div>

                                {formData.university === 'Other (specify below)' && (
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Your University Name *</label>
                                        <input
                                            type="text"
                                            value={formData.universityOther}
                                            onChange={e => setFormData(prev => ({ ...prev, universityOther: e.target.value }))}
                                            placeholder="e.g. Summit University Offa"
                                            className="w-full h-14 px-4 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground placeholder:text-muted-foreground font-medium mt-2 outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Hostel / Campus Zone *</label>
                                    <select
                                        value={formData.campusZone}
                                        onChange={e => setFormData(prev => ({ ...prev, campusZone: e.target.value }))}
                                        aria-label="Select your campus zone"
                                        title="Select your campus zone"
                                        className="w-full h-14 px-4 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground font-medium mt-2 outline-none appearance-none transition-colors"
                                    >
                                        <option value="" disabled className="bg-card">Where will buyers find you?</option>
                                        {HOSTEL_ZONES.map(z => <option key={z} value={z} className="bg-card">{z}</option>)}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground/50 font-medium mt-1.5 ml-1">Affects your delivery ETA shown to buyers</p>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Preferred Pickup Spot (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.pickupSpot}
                                        onChange={e => setFormData(prev => ({ ...prev, pickupSpot: e.target.value }))}
                                        placeholder="e.g. SUG complex gate, Block C canteen"
                                        className="w-full h-14 px-4 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground placeholder:text-muted-foreground font-medium mt-2 outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                                        <span className="text-green-500 text-sm">📱</span> WhatsApp Number *
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        placeholder="080XXXXXXXX"
                                        maxLength={11}
                                        className="w-full h-14 px-4 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground placeholder:text-muted-foreground font-medium mt-2 outline-none transition-colors"
                                    />
                                    <p className="text-[10px] text-muted-foreground/50 font-medium mt-1.5 ml-1">Order alerts & buyer messages come here via WhatsApp</p>
                                </div>
                            </div>

                            <Button onClick={handleNext} disabled={!isStep1Valid} className="w-full h-14 mt-2 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/10 transition-all border-none">
                                Next: Your Shop <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Briefcase className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Your Shop</h2>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tell buyers what you sell</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Business Type</label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {[
                                        { value: 'side_hustler', label: 'Student / Side Hustler', sub: 'No CAC needed ✓' },
                                        { value: 'registered_business', label: 'Registered Business', sub: 'Have CAC docs' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFormData(prev => ({ ...prev, businessType: opt.value as any }))}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.businessType === opt.value ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-muted/50 text-muted-foreground'}`}
                                        >
                                            <p className="text-sm font-black">{opt.label}</p>
                                            <p className="text-[10px] font-bold opacity-70 mt-0.5">{opt.sub}</p>
                                        </button>
                                    ))}
                                </div>
                                {formData.businessType === 'side_hustler' && (
                                    <p className="text-[10px] text-primary/80 font-bold mt-2 ml-1">
                                        🎉 No CAC registration needed — perfect for campus hustles!
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Shop / Store Name (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.shopName}
                                    onChange={e => setFormData(prev => ({ ...prev, shopName: e.target.value.slice(0, 40) }))}
                                    placeholder={`${user?.displayName?.split(' ')[0] || 'Your'}'s Shop`}
                                    maxLength={40}
                                    className="w-full h-14 px-4 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground placeholder:text-muted-foreground font-medium mt-2 outline-none transition-colors"
                                />
                                {shopSlug && (
                                    <p className="text-[10px] text-muted-foreground/50 font-mono mt-1.5 ml-1 truncate">
                                        🔗 marketbridge.com.ng/shop/<span className="text-primary/70">{shopSlug}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                                    What do you sell? * {formData.sellCategories.length > 0 && <span className="text-primary">({formData.sellCategories.length}/3 selected)</span>}
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
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : maxReached
                                                        ? 'bg-muted/50 border-border text-muted-foreground/30 cursor-not-allowed'
                                                        : 'bg-muted border-input text-muted-foreground hover:border-foreground/30'
                                                    }`}
                                            >
                                                <span className="text-xl">{cat.emoji}</span>
                                                <span>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-muted-foreground/30 mt-2 ml-1">Max 3 categories on Starter plan</p>
                            </div>

                            {formData.sellCategories.includes('Services') && (
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">How do you provide your service?</label>
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
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-muted border-input text-muted-foreground hover:border-foreground/30'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted">Back</Button>
                                <Button onClick={handleNext} disabled={!isStep2Valid} className="flex-1 h-14 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/10 border-none">
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Final Details</h2>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Almost done — ID + bio & you're live!</p>
                                </div>
                            </div>

                            {/* Student ID Upload (Optional) */}
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Student ID <span className="text-muted-foreground/50">(Optional — speeds up verification)</span>
                                </label>
                                <div className="border-2 border-dashed border-input hover:border-primary transition-colors rounded-2xl p-8 flex flex-col items-center justify-center bg-muted relative cursor-pointer group mt-2">
                                    {formData.idCardUrl ? (
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-6 w-6 text-primary" />
                                            <span className="text-foreground font-black uppercase tracking-wider text-sm">ID Uploaded! ✅</span>
                                            <span className="text-primary text-xs font-bold uppercase tracking-wider group-hover:underline">Change</span>
                                        </div>
                                    ) : isUploading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                            <span className="text-muted-foreground font-bold text-sm">Uploading... 📤</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <Upload className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                            <div>
                                                <span className="text-foreground font-bold text-sm block">Drag & drop or tap to upload</span>
                                                <span className="text-muted-foreground text-xs">School ID, NIN Slip · max 2MB · JPG/PNG/PDF</span>
                                            </div>
                                        </div>
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
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                                    Your Bio <span className="text-muted-foreground/50">(Optional — but recommended)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.bio}
                                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
                                    placeholder={`e.g. 2nd year UniAbuja student. Fresh UK thrift drops every Friday 🔥 DM to order!`}
                                    maxLength={200}
                                    className="w-full p-5 bg-muted border border-input focus:ring-1 focus:ring-primary/30 rounded-2xl text-foreground placeholder:text-muted-foreground font-medium mt-2 outline-none resize-none transition-colors"
                                />
                                <p className="text-[10px] text-muted-foreground/30 mt-1 ml-1 text-right">{formData.bio.length}/200</p>
                            </div>

                            {/* Application Summary */}
                            <div className="bg-muted/30 border border-border rounded-3xl p-5 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Application Summary</p>
                                {[
                                    { label: 'University', val: formData.university === 'Other (specify below)' ? formData.universityOther : formData.university },
                                    { label: 'Zone', val: formData.campusZone },
                                    { label: 'Shop', val: formData.shopName || `${user?.displayName?.split(' ')[0] || 'My'}'s Shop` },
                                    { label: 'Categories', val: formData.sellCategories.join(', ') },
                                    { label: 'Type', val: formData.businessType === 'side_hustler' ? 'Student / Side Hustler' : 'Registered Business' },
                                ].filter(r => r.val).map(row => (
                                    <div key={row.label} className="flex justify-between items-start gap-4">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/50">{row.label}</span>
                                        <span className="text-sm font-bold text-foreground/80 text-right max-w-[60%] truncate">{row.val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                                <span className="text-xl">🏆</span>
                                <p className="text-muted-foreground text-xs font-bold">
                                    <span className="text-amber-600 dark:text-amber-400 font-black">Instant Founding Seller</span> — you'll be approved immediately and can start selling right away!
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={handlePrev} variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted" disabled={isSubmitting}>Back</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] h-14 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 border-none">
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin h-5 w-5" /> Submitting...</>
                                    ) : (
                                        <><Store className="h-5 w-5" /> Start Selling Now</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center mt-6 text-muted-foreground/30 text-[10px] font-bold">
                    Stuck? <a href="https://wa.me/2348000000000?text=Hi%2C%20I%20need%20help%20setting%20up%20my%20seller%20account" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors">Chat us on WhatsApp →</a>
                </p>
            </div>
        </div>
    );
}
