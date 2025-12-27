'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, ArrowLeft, Mail, Phone, User as UserIcon, CreditCard, Globe, ShoppingCart, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SubscriptionPlan } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useFlutterwave, getFlutterwaveConfig } from '@/lib/flutterwave';
import { initiateOPayCheckout } from '@/lib/opay';
import { NIGERIAN_STATES } from '@/lib/constants';
import { normalizeIdentifier } from '@/lib/auth/utils';

const PRICING_PLANS = [
    {
        id: 'starter' as SubscriptionPlan,
        name: 'Starter',
        price: 'Free',
        features: ['5 listings', 'Standard support', '5% fee']
    },
    {
        id: 'professional' as SubscriptionPlan,
        name: 'Professional',
        price: '₦5,000',
        period: '/mo',
        popular: true,
        features: ['50 listings', 'Priority support', '2.5% fee', 'Verified Badge']
    },
    {
        id: 'enterprise' as SubscriptionPlan,
        name: 'Enterprise',
        price: '₦20,000',
        period: '/mo',
        features: ['Unlimited listings', 'Dedicated Manager', '1% fee']
    }
];

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { initializePayment: initFlutterwave } = useFlutterwave();
    const { refreshUser, signInWithGoogle } = useAuth();

    // Steps
    const [step, setStep] = useState<'role' | 'plan' | 'details' | 'auth-method'>('role');
    const [role, setRole] = useState<'customer' | 'dealer' | 'admin' | 'ceo'>('customer');

    // Form
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
        businessName: '',
        cacNumber: '',
        phoneNumber: '',
    });
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter');
    const [paymentProvider, setPaymentProvider] = useState<'card' | 'transfer' | 'opay'>('card');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (selectedRole: 'customer' | 'dealer' | 'admin' | 'ceo') => {
        setRole(selectedRole);
        if (selectedRole === 'dealer') setStep('plan');
        else if (selectedRole === 'customer') setStep('auth-method');
        else if (selectedRole === 'ceo') router.push('/ceo/signup');
        else if (selectedRole === 'admin') router.push('/admin/signup');
    };

    const createAccount = async (paymentRef?: string) => {
        try {
            const emailToUse = normalizeIdentifier(formData.email);

            // 1. Auth Sign Up
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: emailToUse,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        role: role,
                        location: formData.location
                    },
                },
            });

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error("Creation failed.");

            // 2. Profile Upsert
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: emailToUse,
                    display_name: formData.displayName,
                    role: role,
                    location: formData.location,
                    phone_number: formData.phoneNumber,
                    business_name: role === 'dealer' ? formData.businessName : null,
                    cac_number: role === 'dealer' ? formData.cacNumber : null,
                    subscription_plan: role === 'dealer' ? selectedPlan : 'starter',
                    subscription_status: role === 'dealer' ? (selectedPlan === 'starter' ? 'trial' : 'active') : 'inactive',
                    last_payment_ref: paymentRef || null,
                    is_verified: false
                });

            if (profileError) console.error("Profile creation error:", profileError);

            await refreshUser(authData.user.id);

            if (role === 'dealer') router.push('/dealer/dashboard');
            else router.push('/');

        } catch (err: any) {
            setError(err.message || "Failed to create account.");
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords mismatch.");
            setIsLoading(false);
            return;
        }

        if (role === 'dealer' && selectedPlan !== 'starter') {
            const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
            const amount = parseInt(plan?.price.replace(/[^0-9]/g, '') || '0');
            const txRef = `SUB-${Date.now()}`;

            const onSuccess = (response: any) => createAccount(response.tx_ref || response.reference);
            const onCancel = () => setIsLoading(false);

            if (paymentProvider === 'opay') {
                const res = await initiateOPayCheckout({ amount, email: formData.email, reference: txRef, description: `Subscription: ${plan?.name}` });
                if (!res.success) { setError(res.message); setIsLoading(false); }
            } else {
                const config = getFlutterwaveConfig(txRef, amount, formData.email, formData.displayName, formData.phoneNumber || '000', onSuccess, onCancel, paymentProvider === 'card' ? 'card' : 'banktransfer');
                initFlutterwave(config);
            }
            return;
        }

        await createAccount();
    };

    // UI Renders
    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
                <Card className="w-full max-w-4xl border-none shadow-2xl">
                    <CardHeader className="text-center py-10">
                        <CardTitle className="text-4xl font-black italic uppercase tracking-tighter">Join MarketBridge</CardTitle>
                        <p className="text-slate-500 font-medium">Select your role to begin onboarding</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
                        {[
                            { id: 'customer', title: 'Customer', icon: '🛍️', desc: 'Browse & Buy' },
                            { id: 'dealer', title: 'Dealer', icon: '🚗', desc: 'Sell Inventory' },
                            { id: 'admin', title: 'Admin', icon: '🛡️', desc: 'Staff Gateway' },
                            { id: 'ceo', title: 'CEO', icon: '👑', desc: 'Executive' }
                        ].map(item => (
                            <Card key={item.id} className="cursor-pointer hover:border-primary transition-all p-6 text-center group" onClick={() => handleRoleSelect(item.id as any)}>
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                                <h3 className="font-bold uppercase text-xs mb-1">{item.title}</h3>
                                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'plan') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Change Role</Button>
                        <h2 className="text-3xl font-black italic uppercase">Dealer Membership</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PRICING_PLANS.map(plan => (
                            <Card key={plan.id} className={`cursor-pointer hover:shadow-xl transition-all ${selectedPlan === plan.id ? 'border-primary ring-2 ring-primary/10' : ''}`} onClick={() => { setSelectedPlan(plan.id); setStep('details'); }}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="font-bold">{plan.name}</CardTitle>
                                        {plan.popular && <Check className="h-5 w-5 text-primary" />}
                                    </div>
                                    <div className="text-3xl font-black text-primary mt-2">{plan.price}<span className="text-xs font-normal text-slate-400">{plan.period}</span></div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {plan.features.map(f => <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> {f}</div>)}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'auth-method') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-none">
                    <CardHeader className="text-center">
                        <Button variant="ghost" onClick={() => setStep('role')} className="w-fit mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <CardTitle className="text-2xl font-bold">Secure Verification</CardTitle>
                        <CardDescription>Choose your signup channel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-8">
                        <Button variant="outline" className="w-full h-12" onClick={signInWithGoogle}><Globe className="mr-2 h-5 w-5 text-blue-500" /> Google Account</Button>
                        <div className="relative flex items-center py-2 text-[10px] uppercase font-bold text-slate-300"><span className="w-full border-t" /><span className="px-2">Direct</span><span className="w-full border-t" /></div>
                        <Button className="w-full h-12" onClick={() => setStep('details')}><Mail className="mr-2 h-5 w-5" /> Email Registration</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl border-none">
                <CardHeader>
                    <Button variant="ghost" onClick={() => setStep(role === 'dealer' ? 'plan' : 'auth-method')} className="w-fit mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <CardTitle className="text-2xl font-bold">Establishing Profile</CardTitle>
                    <CardDescription>{role === 'dealer' ? `Registering for ${selectedPlan} Tier` : "Please provide your credentials"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">{error}</div>}
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Full Name</Label>
                            <Input name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="e.g. Samuel Ade" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Email Address</Label>
                            <Input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-slate-500">Password</Label>
                                <div className="relative">
                                    <Input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-slate-500">Confirm</Label>
                                <Input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Location (Nigeria)</Label>
                            <select name="location" className="w-full h-10 border rounded-md px-3 text-sm bg-background border-slate-200" value={formData.location} onChange={(e: any) => setFormData({ ...formData, location: e.target.value })} required>
                                <option value="">Select State</option>
                                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {role === 'dealer' && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-500">Business Name</Label><Input name="businessName" value={formData.businessName} onChange={handleChange} required /></div>
                                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-slate-500">CAC Number (Optional)</Label><Input name="cacNumber" value={formData.cacNumber} onChange={handleChange} /></div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[10px] uppercase font-black text-center mb-4 text-slate-400">Payment Gateway</p>
                                    <div className="flex justify-center gap-2">
                                        {['card', 'transfer', 'opay'].map(p => (
                                            <Button key={p} type="button" variant={paymentProvider === p ? 'default' : 'outline'} size="sm" onClick={() => setPaymentProvider(p as any)} className="capitalize">{p}</Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <Button type="submit" className="w-full h-12 text-lg font-bold group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <div className="flex items-center gap-2">
                                    {role === 'dealer' && selectedPlan !== 'starter' ? 'Pay & Join' : 'Create Account'}
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="h-8 w-8 animate-spin" /></div>}><SignupContent /></Suspense>;
}
