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
import { Loader2, CheckCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { cn } from '@/lib/utils';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forcedRole = searchParams.get('role');
    const { user, sessionUser, loading: authLoading, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

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

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            await refreshUser();

            // Redirect based on role
            if (formData.role === 'student_seller' || formData.role === 'dealer') {
                router.push('/dealer/dashboard');
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
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FF6600] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Protocol Identification</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Establish <span className="text-[#FF6600]">Profile</span>
                    </h1>
                    <p className="text-zinc-500 font-medium italic">
                        Initialize your operational parameters for the Abuja Pilot Phase.
                    </p>
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
                                            SYNCING PROFILE...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-5 w-5" />
                                            COMPLETE AUTHORIZATION
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
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
