'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Zap, Crown, Rocket, ArrowLeft, Sparkles, Shield, TrendingUp, Loader2, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { cn } from '@/lib/utils';
import { NIGERIAN_BANKS } from '@/lib/banks';
import { ABUJA_UNIVERSITIES } from '@/lib/location';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forcedRole = searchParams?.get('role');
    const selectedPlan = searchParams?.get('plan');
    const selectedCycle = searchParams?.get('billing') || 'monthly';
    const { toast } = useToast();
    const { user, sessionUser, loading: authLoading, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);
    const [confirmedUpgrade, setConfirmedUpgrade] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        location: '',
        photoURL: '',
        role: forcedRole || 'student_buyer',
        businessName: '',
        university: '',
        matricNumber: '',
        storeType: 'online' as 'physical' | 'online' | 'both',
        bankCode: '',
        accountNumber: '',
    });

    useEffect(() => {
        if (!authLoading && !user && !sessionUser) {
            router.push('/login');
            return;
        }

        if (user) {
            // Get detected location for pre-fill
            const detectedCampus = localStorage.getItem('mb-preferred-Campus');
            let prefUniversity = '';

            if (detectedCampus && detectedCampus !== 'global') {
                const foundUni = ABUJA_UNIVERSITIES.find(u => u.id === detectedCampus);
                if (foundUni) prefUniversity = foundUni.name;
            }

            setFormData({
                displayName: user.displayName || user.email?.split('@')[0] || '',
                location: user.location || (detectedCampus !== 'global' ? detectedCampus : '') || '',
                photoURL: user.photoURL || '',
                role: forcedRole || (user.role as any) || 'student_buyer',
                businessName: user.businessName || '',
                university: (user as any).university || prefUniversity || '',
                matricNumber: (user as any).matricNumber || '',
                storeType: (user.storeType as 'physical' | 'online' | 'both') || 'online',
                bankCode: (user as any).bank_name || '',
                accountNumber: (user as any).account_number || '',
            });

            if (['student_seller', 'dealer'].includes(user.role) && !user.email_verified) {
                router.push('/verify-email');
                return;
            }
        }
    }, [user, authLoading]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;

        if (user.role === 'student_buyer' && (formData.role === 'student_seller' || formData.role === 'dealer') && !showConfirmSwitch) {
            setShowConfirmSwitch(true);
            return;
        }

        setLoading(true);
        try {
            // 1. Update Profile in Supabase
            const updateData: any = {
                display_name: formData.displayName,
                location: formData.location,
                photo_url: formData.photoURL,
                role: formData.role,
                university: formData.university,
                matric_number: formData.matricNumber,
                bank_name: formData.bankCode,
                account_number: formData.accountNumber
            };

            if (formData.role === 'student_seller' || formData.role === 'dealer') {
                updateData.business_name = formData.businessName;
                updateData.store_type = formData.storeType;
                updateData.subscription_status = 'pending_verification';
            }

            const { error: profileError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Create Paystack Subaccount for Sellers
            if (['student_seller', 'dealer'].includes(formData.role)) {
                const paystackRes = await fetch('/api/paystack/subaccount', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessName: formData.businessName,
                        bankCode: formData.bankCode,
                        accountNumber: formData.accountNumber,
                        userId: user.id
                    })
                });

                if (!paystackRes.ok) {
                    console.warn('Paystack subaccount creation failed, will retry later.');
                }
            }

            // 3. Update Auth Metadata
            await supabase.auth.updateUser({
                data: { role: formData.role }
            });

            await refreshUser();

            // Redirect
            toast('Account setup complete!', 'success');
            if (['student_seller', 'dealer'].includes(formData.role)) {
                if (selectedPlan) {
                    router.push(`/checkout/subscription?plan=${selectedPlan}&billing=${selectedCycle}`);
                } else {
                    router.push('/pricing');
                }
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error('Onboarding failed:', err);
            toast(err.message || 'Onboarding failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative py-20 px-6 selection:bg-[#FF6200] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-2xl mx-auto relative z-10 space-y-12">
                {forcedRole === 'student_seller' && !confirmedUpgrade ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex justify-start">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                                className="text-white/40 hover:text-white flex items-center gap-2 px-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Return to Home</span>
                            </Button>
                        </div>

                        {user?.role === 'student_buyer' ? (
                            <div className="text-center space-y-8 py-20 glass-card rounded-[3.5rem] border border-[#FF6200]/20 bg-[#FF6200]/5">
                                <div className="mx-auto h-20 w-20 rounded-full bg-[#FF6200]/10 flex items-center justify-center mb-6">
                                    <ShieldCheck className="h-10 w-10 text-[#FF6200]" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                                    Account <span className="text-[#FF6200]">Restriction</span>
                                </h1>
                                <p className="text-white/60 text-lg max-w-lg mx-auto leading-relaxed px-8 font-bold text-[#FF6200]">
                                    Campus selling is for verified students only. Verify your student status.
                                </p>
                                <div className="space-y-4 pt-6">
                                    <p className="text-xs text-[#FF6200] font-black uppercase tracking-widest">Action Required:</p>
                                    <p className="text-sm text-white/40 max-w-sm mx-auto">Please logout and create a <span className="text-white">New Seller Account</span> using your student merchant credentials and a valid university email domain (.edu.ng).</p>
                                    <div className="pt-8">
                                        <Button
                                            onClick={async () => {
                                                await supabase.auth.signOut();
                                                router.push('/signup?role=student_seller');
                                            }}
                                            className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200"
                                        >
                                            Logout & Create Seller Account
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-center space-y-8">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#FF6200]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF6200] font-heading">Account Setup</span>
                                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#FF6200]" />
                                    </div>
                                    <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic font-heading leading-none">
                                        Start <span className="text-[#FF6200]">Selling.</span>
                                    </h1>
                                    <p className="text-white/60 text-lg max-w-lg mx-auto leading-relaxed italic border-x border-white/5 px-8">
                                        You are about to upgrade your profile to <span className="text-white font-bold underline decoration-[#FF6200] decoration-2 underline-offset-4">STUDENT SELLER</span>.
                                    </p>
                                </div>

                                <div className="glass-card p-12 rounded-[3.5rem] border border-white/10 space-y-10 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden group">
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF6200]/10 rounded-full blur-3xl group-hover:bg-[#FF6200]/20 transition-all duration-1000" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                        <div className="space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-[#FF6200]/30 transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center">
                                                <Zap className="h-5 w-5 text-[#FF6200]" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white">Sales Tools</h4>
                                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider font-bold">Manage listings and view analytics.</p>
                                        </div>
                                        <div className="space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-[#FF6200]/30 transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center">
                                                <ShieldCheck className="h-5 w-5 text-[#FF6200]" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white">Verified Seller</h4>
                                            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider font-bold">Get a verified badge for your profile.</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 relative z-10">
                                        <Button
                                            onClick={() => setConfirmedUpgrade(true)}
                                            className="w-full h-20 bg-[#FF6200] text-black font-black uppercase tracking-[0.25em] rounded-[2rem] hover:scale-[1.02] transition-all shadow-[0_20px_60px_rgba(255,98,0,0.25)] border-none text-xs"
                                        >
                                            Confirm Upgrade & Proceed
                                        </Button>
                                        <div className="flex items-center justify-center gap-4 mt-8">
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                            <p className="text-[8px] text-white/30 uppercase tracking-widest font-black italic">
                                                Seller Agreement Applies
                                            </p>
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 font-heading">Account Setup</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                                {forcedRole === 'student_seller' ? 'Seller' : 'Create'} <span className="text-[#FF6200]">{forcedRole === 'student_seller' ? 'Account' : 'Profile'}</span>
                            </h1>
                            <p className="text-white/40 font-medium italic">
                                Fill in your details for the Abuja Pilot Phase.
                            </p>
                        </div>

                        <div className="flex justify-start">
                            <Button
                                variant="ghost"
                                onClick={() => forcedRole === 'student_seller' ? setConfirmedUpgrade(false) : router.push('/')}
                                className="text-white/40 hover:text-white flex items-center gap-2 px-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{forcedRole === 'student_seller' ? 'Back to Confirmation' : 'Return to Home'}</span>
                            </Button>
                        </div>

                        <Card className="glass-card border-none rounded-[3rem] p-10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-gradient" />
                            <CardContent className="p-0">
                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-8">
                                        <div className="flex justify-center mb-10">
                                            <div className="w-40 space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center block font-heading">Profile Photo</Label>
                                                <div className="glass-card rounded-[2rem] p-2 hover:border-[#FF6200]/30 transition-all">
                                                    <ImageUpload
                                                        onImagesSelected={(urls) => setFormData({ ...formData, photoURL: urls[0] || '' })}
                                                        defaultImages={formData.photoURL ? [formData.photoURL] : []}
                                                        maxImages={1}
                                                        bucketName="avatars"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Display Name *</Label>
                                                <Input
                                                    id="displayName"
                                                    value={formData.displayName}
                                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                    placeholder="NAME"
                                                    required
                                                    className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Location</Label>
                                                <Input
                                                    id="location"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    placeholder="e.g. FCT - ABUJA"
                                                    className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                />
                                            </div>
                                        </div>

                                        {forcedRole !== 'student_seller' ? (
                                            <div className="space-y-4 pt-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Account Type *</Label>
                                                <RadioGroup
                                                    value={formData.role}
                                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                >
                                                    <div className={cn(
                                                        "flex items-center space-x-4 border rounded-[2rem] p-6 cursor-pointer transition-all duration-500",
                                                        formData.role === 'student_buyer' || formData.role === 'customer' ? "bg-[#FF6200] border-[#FF6200] text-black" : "bg-white/5 border-white/10 text-white hover:border-white/20"
                                                    )} onClick={() => setFormData({ ...formData, role: 'student_buyer' })}>
                                                        <RadioGroupItem value="student_buyer" id="student_buyer" className="hidden" />
                                                        <Label htmlFor="student_buyer" className="cursor-pointer flex-1 space-y-1">
                                                            <div className="font-black uppercase tracking-widest italic font-heading">Student Buyer</div>
                                                            <div className={cn("text-[10px] italic font-medium", formData.role === 'student_buyer' || formData.role === 'customer' ? "text-black/60" : "text-white/40")}>
                                                                Acquire verified campus assets
                                                            </div>
                                                        </Label>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center space-x-4 border rounded-[2rem] p-6 cursor-pointer transition-all duration-500",
                                                        formData.role === 'student_seller' || formData.role === 'dealer' ? "bg-[#FF6200] border-[#FF6200] text-black" : "bg-white/5 border-white/10 text-white hover:border-white/20"
                                                    )} onClick={() => setFormData({ ...formData, role: 'student_seller' })}>
                                                        <RadioGroupItem value="student_seller" id="student_seller" className="hidden" />
                                                        <Label htmlFor="student_seller" className="cursor-pointer flex-1 space-y-1">
                                                            <div className="font-black uppercase tracking-widest italic font-heading">Student Seller</div>
                                                            <div className={cn("text-[10px] italic font-medium", formData.role === 'student_seller' || formData.role === 'dealer' ? "text-black/60" : "text-white/40")}>
                                                                Start your campus business
                                                            </div>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        ) : null}

                                        {['student_seller', 'dealer'].includes(formData.role) && (
                                            <div className="space-y-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="businessName" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Business Name *</Label>
                                                        <Input
                                                            id="businessName"
                                                            value={formData.businessName}
                                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                            placeholder="e.g. UNIVERSITY GADGETS"
                                                            required={['student_seller', 'dealer'].includes(formData.role)}
                                                            className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                        />
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="university" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">University *</Label>
                                                        <Input
                                                            id="university"
                                                            value={formData.university}
                                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                                            placeholder="e.g. UNIVERSITY OF ABUJA"
                                                            required={['student_seller', 'dealer'].includes(formData.role)}
                                                            className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label htmlFor="matricNumber" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Matric Number *</Label>
                                                    <Input
                                                        id="matricNumber"
                                                        value={formData.matricNumber}
                                                        onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                                                        placeholder="e.g. U/2024/CORE/001"
                                                        required={['student_seller', 'dealer'].includes(formData.role)}
                                                        className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="bankName" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Settlement Bank *</Label>
                                                        <select
                                                            id="bankName"
                                                            value={formData.bankCode}
                                                            onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                                                            required={['student_seller', 'dealer'].includes(formData.role)}
                                                            className="w-full h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-[10px] px-4 text-white appearance-none"
                                                        >
                                                            <option value="" className="bg-black">SELECT BANK</option>
                                                            {NIGERIAN_BANKS.map(bank => (
                                                                <option key={bank.code} value={bank.code} className="bg-black">{bank.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="accountNumber" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Account Number *</Label>
                                                        <Input
                                                            id="accountNumber"
                                                            value={formData.accountNumber}
                                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                                            placeholder="10 DIGITS"
                                                            maxLength={10}
                                                            required={['student_seller', 'dealer'].includes(formData.role)}
                                                            className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 font-heading">Store Setup *</Label>
                                                    <RadioGroup
                                                        value={formData.storeType}
                                                        onValueChange={(value: 'physical' | 'online' | 'both') => setFormData({ ...formData, storeType: value })}
                                                        className="flex flex-wrap gap-6"
                                                    >
                                                        {['physical', 'online', 'both'].map((type) => (
                                                            <div key={type} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={type} id={type} className="border-zinc-700 text-[#FF6200]" />
                                                                <Label htmlFor={type} className="text-[10px] font-black uppercase tracking-widest cursor-pointer font-heading">{type}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                        )}

                                        <Button type="submit" disabled={loading} className="w-full h-16 bg-orange-gradient text-black hover:bg-[#FF6200] rounded-2xl font-black uppercase tracking-widest transition-all font-heading shadow-[0_10px_40px_rgba(255,184,0,0.2)] border-none mt-8">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    {forcedRole === 'student_seller' ? 'SETTING UP...' : 'SAVING...'}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-5 w-5" />
                                                    {forcedRole === 'student_seller' ? 'COMPLETE SETUP' : 'FINISH'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Confirmation Dialog for Role Switch */}
            {showConfirmSwitch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="glass-card border-[#FF6200]/20 max-w-md w-full p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6200]" />
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center mb-2">
                                <AlertCircle className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic italic">Account <span className="text-[#FF6200]">Upgrade</span></h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                You are about to upgrade your profile to <span className="text-white font-bold">STUDENT SELLER</span>.
                                This will grant you access to listing items and managing orders.
                            </p>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl w-full">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] mb-1">Subscription Required</p>
                                <p className="text-xs text-white/40">You may be required to choose a subscription plan to activate your account.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="w-full h-14 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FF7A29]"
                            >
                                {loading ? 'UPDATING...' : 'CONFIRM UPGRADE'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowConfirmSwitch(false)}
                                className="w-full h-14 text-white/40 hover:text-white font-black uppercase tracking-widest rounded-xl"
                            >
                                ABORT
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" /></div>}>
            <OnboardingContent />
        </Suspense>
    );
}
