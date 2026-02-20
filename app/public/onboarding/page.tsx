'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NIGERIAN_BANKS } from '@/lib/banks';
import { Loader2, CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

function PublicOnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, sessionUser, loading: authLoading, refreshUser } = useAuth();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'profile' | 'bank' | 'success'>('profile');
    const [form, setForm] = useState({
        displayName: '',
        phone: '',
        businessName: '',
        location: '',
        bankCode: '',
        accountNumber: '',
    });

    useEffect(() => {
        if (!authLoading && !sessionUser) {
            router.push('/signup?intent=sell&section=public');
        }
        if (user) {
            setForm(prev => ({
                ...prev,
                displayName: user.displayName || user.email?.split('@')[0] || '',
            }));
        }
    }, [user, authLoading, sessionUser]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.displayName.trim() || !form.businessName.trim()) {
            alert('Please fill in all required fields.');
            return;
        }
        setStep('bank');
    };

    const handleBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // Update user profile
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    display_name: form.displayName,
                    phone_number: form.phone,
                    business_name: form.businessName,
                    location: form.location,
                    role: 'dealer',
                    bank_name: form.bankCode,
                    account_number: form.accountNumber,
                    subscription_status: 'pending_verification',
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Create Paystack subaccount
            if (form.bankCode && form.accountNumber) {
                const res = await fetch('/api/paystack/subaccount', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessName: form.businessName,
                        bankCode: form.bankCode,
                        accountNumber: form.accountNumber,
                        userId: user.id,
                    }),
                });
                if (!res.ok) {
                    console.warn('Paystack subaccount creation failed – will retry later.');
                }
            }

            await supabase.auth.updateUser({ data: { role: 'dealer' } });
            await refreshUser();
            setStep('success');
        } catch (err: any) {
            console.error('Public onboarding failed:', err);
            alert(err.message || 'Onboarding failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans px-4 py-16 selection:bg-[#FF6200] selection:text-black">
            <div className="max-w-xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => step === 'bank' ? setStep('profile') : router.push('/public')}
                        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FF6200]">
                        <ShoppingBag className="h-4 w-4" />
                        Public Marketplace – Seller Setup
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic">
                        {step === 'success' ? 'Welcome,' : step === 'bank' ? 'Bank Details' : 'Your Profile'}
                        {step !== 'success' && <span className="text-[#FF6200]"> Seller</span>}
                    </h1>
                </div>

                {/* Steps */}
                {step !== 'success' && (
                    <div className="flex items-center gap-3">
                        {['profile', 'bank'].map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={`h-2 w-2 rounded-full transition-colors ${step === s ? 'bg-[#FF6200]' : step === 'success' || (step === 'bank' && s === 'profile') ? 'bg-white' : 'bg-zinc-700'}`} />
                                {i === 0 && <div className="flex-1 h-px bg-white/10" />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Step 1: Profile */}
                {step === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Display Name *</Label>
                            <Input
                                value={form.displayName}
                                onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                                required
                                placeholder="Your full name"
                                className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Business / Store Name *</Label>
                            <Input
                                value={form.businessName}
                                onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                                required
                                placeholder="e.g. Lagos Tech Hub"
                                className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone Number</Label>
                            <Input
                                value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="+234 800 000 0000"
                                type="tel"
                                className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">City / Location</Label>
                            <Input
                                value={form.location}
                                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                placeholder="e.g. Lagos, Abuja, Kano"
                                className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-[#FF6200]/50"
                            />
                        </div>

                        <div className="bg-[#FF6200]/5 border border-[#FF6200]/20 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] mb-1">Subscription</p>
                            <p className="text-xs text-zinc-400">₦1,000/month or ₦10,000/year · Auto-renew via Paystack · Cancel anytime</p>
                        </div>

                        <Button type="submit" className="w-full h-14 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF7A29] transition-all">
                            Continue to Bank Details
                        </Button>
                    </form>
                )}

                {/* Step 2: Bank */}
                {step === 'bank' && (
                    <form onSubmit={handleBankSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Settlement Bank *</Label>
                            <select
                                value={form.bankCode}
                                onChange={e => setForm(p => ({ ...p, bankCode: e.target.value }))}
                                required
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-[10px] font-black uppercase tracking-widest appearance-none focus:border-[#FF6200]/50 focus:outline-none"
                            >
                                <option value="" className="bg-black">Select Bank</option>
                                {NIGERIAN_BANKS.map(bank => (
                                    <option key={bank.code} value={bank.code} className="bg-black">{bank.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Account Number *</Label>
                            <Input
                                value={form.accountNumber}
                                onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                required
                                placeholder="10-digit account number"
                                maxLength={10}
                                className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono tracking-widest focus:border-[#FF6200]/50"
                            />
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">How Payouts Work</p>
                            <p className="text-xs text-zinc-400">
                                After each sale, 94.7% goes directly to your bank account. MarketBridge retains 5.3% commission. Automatic via Paystack.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep('profile')}
                                className="flex-1 h-14 border-white/10 text-white hover:bg-white/5 rounded-2xl font-black uppercase tracking-widest"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-14 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF7A29] transition-all"
                            >
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting Up...</> : 'Complete Setup'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Success */}
                {step === 'success' && (
                    <div className="text-center space-y-8 py-10">
                        <div className="h-24 w-24 rounded-3xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center mx-auto">
                            <CheckCircle className="h-10 w-10 text-[#FF6200]" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Bank Connected!</h2>
                            <p className="text-zinc-400 max-w-sm mx-auto">Your seller account is live. Payouts are automatic. Start listing now.</p>
                        </div>
                        <Button
                            onClick={() => router.push('/seller/listings/new')}
                            className="h-14 px-10 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF7A29] transition-all"
                        >
                            Create First Listing
                        </Button>
                        <button
                            onClick={() => router.push('/seller/dashboard')}
                            className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mx-auto"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PublicOnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
            </div>
        }>
            <PublicOnboardingContent />
        </Suspense>
    );
}
