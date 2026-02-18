'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Zap, Crown, Rocket, ArrowLeft, Sparkles, Shield, TrendingUp, Loader2, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { cn } from '@/lib/utils';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forcedRole = searchParams.get('role');
    const selectedPlan = searchParams.get('plan');
    const selectedCycle = searchParams.get('billing') || 'monthly';
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
    });

    useEffect(() => {
        if (!authLoading && !user && !sessionUser) {
            router.push('/login');
            return;
        }

        if (user) {
            // Get detected location for pre-fill
            const detectedNode = localStorage.getItem('mb-preferred-node');

            // Pre-fill with existing data, using detected node as fallback for location
            setFormData({
                displayName: user.displayName || user.email?.split('@')[0] || '',
                location: user.location || (detectedNode !== 'global' ? detectedNode : '') || '',
                photoURL: user.photoURL || '',
                role: forcedRole || (user.role as any) || 'student_buyer',
                businessName: user.businessName || '',
                university: (user as any).university || '',
                matricNumber: (user as any).matricNumber || '',
                storeType: (user.storeType as 'physical' | 'online' | 'both') || 'online',
            });
        }
    }, [user, authLoading]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;

        // If user is switching from buyer to seller, show confirmation first
        if (user.role === 'student_buyer' && (formData.role === 'student_seller' || formData.role === 'dealer') && !showConfirmSwitch) {
            setShowConfirmSwitch(true);
            return;
        }

        setLoading(true);
        try {
            const updateData: any = {
                display_name: formData.displayName,
                location: formData.location,
                photo_url: formData.photoURL,
                role: formData.role,
                university: formData.university,
                matric_number: formData.matricNumber,
            };

            if (formData.role === 'student_seller' || formData.role === 'dealer') {
                updateData.business_name = formData.businessName;
                updateData.store_type = formData.storeType;
                updateData.subscription_status = 'pending_verification';
            }

            // Authoritative Role and Metadata Update
            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: { role: formData.role }
            });

            if (authUpdateError) console.warn('Auth metadata update failed, but proceeding with profile update.');

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            await refreshUser();

            // Direct Redirect Logic
            if (formData.role === 'student_seller' || formData.role === 'dealer') {
                if (selectedPlan) {
                    router.push(`/checkout/subscription?plan=${selectedPlan}&billing=${selectedCycle}`);
                } else {
                    router.push('/pricing');
                }
            } else {
                router.push('/');
            }
        } catch (err: unknown) {
            console.error('Failed to update profile:', err);
            const message = err instanceof Error ? err.message : 'Failed to update profile';
            alert(message);
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
        <div className="min-h-screen bg-black text-white relative py-20 px-6 selection:bg-[#FF6600] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-2xl mx-auto relative z-10 space-y-12">
                {forcedRole === 'student_seller' && !confirmedUpgrade ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex justify-start">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                                className="text-zinc-500 hover:text-white flex items-center gap-2 px-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Return to Home</span>
                            </Button>
                        </div>

                        <div className="text-center space-y-8">
                            <div className="flex items-center justify-center gap-3">
                                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#FF6600]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF6600] font-heading drop-shadow-[0_0_10px_rgba(255,102,0,0.5)]">Protocol Shift Initiated</span>
                                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#FF6600]" />
                            </div>
                            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic font-heading leading-none">
                                Start <span className="text-[#FF6600] drop-shadow-[0_0_30px_rgba(255,102,0,0.3)]">Selling.</span>
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed italic border-x border-white/5 px-8">
                                You are about to upgrade your profile to <span className="text-white font-bold underline decoration-[#FF6600] decoration-2 underline-offset-4">STUDENT MERCHANT</span>. Unlock the terminal and claim your campus node.
                            </p>
                        </div>

                        <div className="glass-card p-12 rounded-[3.5rem] border border-white/10 space-y-10 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden group">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF6600]/10 rounded-full blur-3xl group-hover:bg-[#FF6600]/20 transition-all duration-1000" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-[#FF6600]/30 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-[#FF6600]/10 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-[#FF6600]" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Merchant Tools</h4>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider font-bold">Inventory command & analytics terminal.</p>
                                </div>
                                <div className="space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-[#FF6600]/30 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-[#FF6600]/10 flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-[#FF6600]" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Trust Protocol</h4>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider font-bold">Verified merchant badge encryption.</p>
                                </div>
                            </div>

                            <div className="pt-4 relative z-10">
                                <Button
                                    onClick={() => setConfirmedUpgrade(true)}
                                    className="w-full h-20 bg-[#FF6600] text-black font-black uppercase tracking-[0.25em] rounded-[2rem] hover:scale-[1.02] transition-all shadow-[0_20px_60px_rgba(255,102,0,0.25)] border-none text-xs"
                                >
                                    Confirm Upgrade & Proceed
                                </Button>
                                <div className="flex items-center justify-center gap-4 mt-8">
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black italic">
                                        Merchant Code of Conduct Applies
                                    </p>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-[#FF6600] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Protocol Identification</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                                {forcedRole === 'student_seller' ? 'Merchant' : 'Establish'} <span className="text-[#FF6600]">{forcedRole === 'student_seller' ? 'Terminal' : 'Profile'}</span>
                            </h1>
                            <p className="text-zinc-500 font-medium italic">
                                Initialize your operational parameters for the Abuja Pilot Phase.
                            </p>
                        </div>

                        <div className="flex justify-start">
                            <Button
                                variant="ghost"
                                onClick={() => forcedRole === 'student_seller' ? setConfirmedUpgrade(false) : router.push('/')}
                                className="text-zinc-500 hover:text-white flex items-center gap-2 px-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{forcedRole === 'student_seller' ? 'Back to Confirmation' : 'Return to Home'}</span>
                            </Button>
                        </div>

                        <Card className="glass-card border-none rounded-[3rem] p-10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
                            <CardContent className="p-0">
                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-8">
                                        <div className="flex justify-center mb-10">
                                            <div className="w-40 space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center block font-heading">Digital Identity Avatar</Label>
                                                <div className="glass-card rounded-[2rem] p-2 hover:border-[#FF6600]/30 transition-all">
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
                                                <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Display Alias *</Label>
                                                <Input
                                                    id="displayName"
                                                    value={formData.displayName}
                                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                    placeholder="OPERATIVE NAME"
                                                    required
                                                    className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6600]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Operational Sector</Label>
                                                <Input
                                                    id="location"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    placeholder="e.g. FCT - ABUJA"
                                                    className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6600]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                />
                                            </div>
                                        </div>

                                        {forcedRole !== 'student_seller' ? (
                                            <div className="space-y-4 pt-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Deployment Protocol *</Label>
                                                <RadioGroup
                                                    value={formData.role}
                                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                >
                                                    <div className={cn(
                                                        "flex items-center space-x-4 border rounded-[2rem] p-6 cursor-pointer transition-all duration-500",
                                                        formData.role === 'student_buyer' || formData.role === 'customer' ? "bg-[#FF6600] border-[#FF6600] text-black" : "bg-white/5 border-white/10 text-white hover:border-white/20"
                                                    )} onClick={() => setFormData({ ...formData, role: 'student_buyer' })}>
                                                        <RadioGroupItem value="student_buyer" id="student_buyer" className="hidden" />
                                                        <Label htmlFor="student_buyer" className="cursor-pointer flex-1 space-y-1">
                                                            <div className="font-black uppercase tracking-widest italic font-heading">Student Buyer</div>
                                                            <div className={cn("text-[10px] italic font-medium", formData.role === 'student_buyer' || formData.role === 'customer' ? "text-black/60" : "text-zinc-500")}>
                                                                Acquire verified campus assets
                                                            </div>
                                                        </Label>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center space-x-4 border rounded-[2rem] p-6 cursor-pointer transition-all duration-500",
                                                        formData.role === 'student_seller' || formData.role === 'dealer' ? "bg-[#FF6600] border-[#FF6600] text-black" : "bg-white/5 border-white/10 text-white hover:border-white/20"
                                                    )} onClick={() => setFormData({ ...formData, role: 'student_seller' })}>
                                                        <RadioGroupItem value="student_seller" id="student_seller" className="hidden" />
                                                        <Label htmlFor="student_seller" className="cursor-pointer flex-1 space-y-1">
                                                            <div className="font-black uppercase tracking-widest italic font-heading">Student Merchant</div>
                                                            <div className={cn("text-[10px] italic font-medium", formData.role === 'student_seller' || formData.role === 'dealer' ? "text-black/60" : "text-zinc-500")}>
                                                                Command a campus business terminal
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
                                                        <Label htmlFor="businessName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Merchant Identity *</Label>
                                                        <Input
                                                            id="businessName"
                                                            value={formData.businessName}
                                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                            placeholder="e.g. UNIVERSITY GADGETS"
                                                            required={['student_seller', 'dealer'].includes(formData.role)}
                                                            className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6600]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                        />
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="university" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Campus Node *</Label>
                                                        <Input
                                                            id="university"
                                                            value={formData.university}
                                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                                            placeholder="e.g. UNIVERSITY OF ABUJA"
                                                            required={['student_seller', 'dealer'].includes(formData.role)}
                                                            className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6600]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label htmlFor="matricNumber" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Matriculation Entry *</Label>
                                                    <Input
                                                        id="matricNumber"
                                                        value={formData.matricNumber}
                                                        onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                                                        placeholder="e.g. U/2024/CORE/001"
                                                        required={['student_seller', 'dealer'].includes(formData.role)}
                                                        className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6600]/50 transition-all font-heading uppercase tracking-widest text-xs"
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 font-heading">Store Architecture *</Label>
                                                    <RadioGroup
                                                        value={formData.storeType}
                                                        onValueChange={(value: 'physical' | 'online' | 'both') => setFormData({ ...formData, storeType: value })}
                                                        className="flex flex-wrap gap-6"
                                                    >
                                                        {['physical', 'online', 'both'].map((type) => (
                                                            <div key={type} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={type} id={type} className="border-zinc-700 text-[#FF6600]" />
                                                                <Label htmlFor={type} className="text-[10px] font-black uppercase tracking-widest cursor-pointer font-heading">{type}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                        )}

                                        <Button type="submit" disabled={loading} className="w-full h-16 bg-gold-gradient text-black hover:bg-[#FF6600] rounded-2xl font-black uppercase tracking-widest transition-all font-heading shadow-[0_10px_40px_rgba(255,184,0,0.2)] border-none mt-8">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    {forcedRole === 'student_seller' ? 'INITIALIZING TERMINAL...' : 'SYNCING PROFILE...'}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-5 w-5" />
                                                    {forcedRole === 'student_seller' ? 'DECODE MERCHANT STATUS' : 'COMPLETE AUTHORIZATION'}
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
                    <Card className="glass-card border-[#FF6600]/20 max-w-md w-full p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]" />
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6600]/10 border border-[#FF6600]/20 flex items-center justify-center mb-2">
                                <AlertCircle className="h-8 w-8 text-[#FF6600]" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic italic">Protocol <span className="text-[#FF6600]">Shift</span></h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                You are about to upgrade your profile to <span className="text-white font-bold">STUDENT MERCHANT</span>.
                                This will grant you access to listing assets and managing orders.
                            </p>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl w-full">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6600] mb-1">Authorization Required</p>
                                <p className="text-xs text-zinc-500">You may be required to choose a subscription plan to activate your terminal.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="w-full h-14 bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FF8533]"
                            >
                                {loading ? 'UPDATING...' : 'CONFIRM UPGRADE'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowConfirmSwitch(false)}
                                className="w-full h-14 text-zinc-500 hover:text-white font-black uppercase tracking-widest rounded-xl"
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" /></div>}>
            <OnboardingContent />
        </Suspense>
    );
}
