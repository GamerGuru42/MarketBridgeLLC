'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, ArrowLeft, Mail, Globe, Eye, EyeOff, ShieldCheck, User as UserIcon, Briefcase, Zap, Crown, Lock } from 'lucide-react';
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
        price: 'Freemium',
        sub: 'for new dealers',
        features: ['Up to 5 active listings', 'basic analytics', '5% transaction fee'],
        btn: 'Start Selling'
    },
    {
        id: 'professional' as SubscriptionPlan,
        name: 'Professional',
        price: '₦ 5,000',
        period: '/monthly',
        sub: '14-Day Free Trial Included',
        popular: true,
        features: ['Up to 50 active listings', 'Verified Dealer Badge', 'Priority Support', '2.5% transaction fee'],
        btn: 'Start Free Trial'
    },
    {
        id: 'enterprise' as SubscriptionPlan,
        name: 'Enterprise',
        price: '₦ 20,000',
        period: '/monthly',
        sub: 'for large dealership',
        features: ['Unlimited listings', 'Dedicated Account Manager', 'API ACCESS', '1% transaction fee'],
        btn: 'Contact Sales'
    }
];

function SignupContent() {
    const router = useRouter();
    const { initializePayment: initFlutterwave } = useFlutterwave();
    const { refreshUser, signInWithGoogle } = useAuth();

    // Steps
    const [step, setStep] = useState<'role' | 'plan' | 'details' | 'auth-method' | 'admin-code' | 'admin-dept'>('role');
    const [role, setRole] = useState<'customer' | 'dealer' | 'admin'>('customer');

    // Admin Flow
    const [adminCode, setAdminCode] = useState('');
    const [adminDept, setAdminDept] = useState<'technical' | 'operations' | 'marketing' | null>(null);

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

    const handleRoleSelect = (selectedRole: 'customer' | 'dealer' | 'admin') => {
        setRole(selectedRole);
        if (selectedRole === 'dealer') setStep('plan');
        else if (selectedRole === 'customer') setStep('auth-method');
        else if (selectedRole === 'admin') setStep('admin-code');
    };

    const handleAdminCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminCode === '1029384756') {
            setStep('admin-dept');
            setError('');
        } else {
            setError('INVALID ACCESS CREDENTIALS');
        }
    };

    const handleDeptSelect = (dept: 'technical' | 'operations' | 'marketing') => {
        setAdminDept(dept);
        router.push(`/admin/signup?dept=${dept}`);
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

            // Determine Subscription Status
            let subStatus = 'inactive';
            let subPlan = 'starter';
            let expiresAt = null;

            if (role === 'dealer') {
                subPlan = selectedPlan;
                if (selectedPlan === 'starter') {
                    subStatus = 'active'; // Starter is free forever? Or limited? Let's say active.
                } else if (selectedPlan === 'professional') {
                    subStatus = 'trial';
                    // 14 Days from now
                    const date = new Date();
                    date.setDate(date.getDate() + 14);
                    expiresAt = date.toISOString();
                } else {
                    subStatus = 'active'; // Enterprise/Paid immediately
                }
                // If paymentRef exists, it means they paid, so maybe it should be active?
                // But for Professional we are offering a free trial now.
                // If they paid (e.g. for enterprise), it's active.
                if (paymentRef) subStatus = 'active';
            }

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
                    subscription_plan: subPlan,
                    subscription_status: subStatus,
                    subscription_expires_at: expiresAt,
                    last_payment_ref: paymentRef || null,
                    is_verified: false
                });

            if (profileError) console.error("Profile creation error:", profileError);

            await refreshUser(authData.user.id);

            if (role === 'dealer') router.push('/dealer/dashboard');
            else router.push('/');

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create account.";
            setError(message);
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

        // MVP: Professional Plan = 14 Day Free Trial (No Payment)
        // Enterprise = Contact Sales (or Payment if implemented) - For now let's treat Enterprise as Contact Sales or disable in UI. 
        // But the previous code allowed payment.
        // Let's only trigger payment if it's NOT Professional (Trial) and NOT Starter (Free).

        const isPaidPlan = role === 'dealer' && selectedPlan !== 'starter' && selectedPlan !== 'professional';

        if (isPaidPlan) {
            const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
            const amount = parseInt(plan?.price.replace(/[^0-9]/g, '') || '0');
            const txRef = `SUB-${Date.now()}`;

            const onSuccess = (response: unknown) => {
                const res = response as { tx_ref?: string; reference?: string };
                createAccount(res.tx_ref || res.reference);
            };
            const onCancel = () => setIsLoading(false);

            if (paymentProvider === 'opay') {
                const res = await initiateOPayCheckout({ amount, email: formData.email, reference: txRef, description: `Subscription: ${plan?.name}` });
                if (!res.success) { setError(res.message || 'OPay initialization failed'); setIsLoading(false); }
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
            <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden relative">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFB800]/5 blur-[120px] rounded-full" />

                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic mb-4">Join MarketBridge</h1>
                        <p className="text-zinc-500 font-medium lowercase italic">select your status to begin identity establishment</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-4xl mx-auto">
                        {[
                            { id: 'customer', title: 'Customer', icon: UserIcon, desc: 'Browse & Buy Assets', color: 'text-blue-400' },
                            { id: 'dealer', title: 'Dealer', icon: Briefcase, desc: 'Sell High-Value inventory', color: 'text-[#FFB800]' },
                            { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Operations Gateway', color: 'text-red-400' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className="glass-card border-white/5 rounded-[2rem] p-8 text-center group cursor-pointer hover:bg-white/[0.08] hover:translate-y-[-8px] transition-all duration-500"
                                onClick={() => handleRoleSelect(item.id as 'customer' | 'dealer' | 'admin')}
                            >
                                <div className="h-16 w-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">{item.title}</h3>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'admin-code') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/50 shadow-[0_0_20px_red]" />
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-600 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="mx-auto h-16 w-16 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-red-500">Restricted</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">enter administrative access key</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        {error && <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-500/20">{error}</div>}
                        <form onSubmit={handleAdminCodeSubmit} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-black border border-white/5 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-red-500"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                                required
                            />
                            <Button type="submit" className="w-full h-16 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                                Authorize
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'admin-dept') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-2xl glass-card border-none rounded-[3rem] p-12 text-white">
                    <CardHeader className="p-0 text-center mb-12">
                        <CardTitle className="text-4xl font-black uppercase italic tracking-tighter mb-2">Select Sector</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">Define your administrative jurisdiction</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { id: 'marketing', title: 'Marketing', icon: Zap, color: 'text-orange-400' },
                            { id: 'operations', title: 'Operations', icon: Briefcase, desc: 'Ops & Escrow', color: 'text-red-400' },
                            { id: 'technical', title: 'Technical', icon: Loader2, desc: 'System Core', color: 'text-blue-400' }
                        ].map(dept => (
                            <button
                                key={dept.id}
                                onClick={() => handleDeptSelect(dept.id as any)}
                                className="glass-card p-8 rounded-3xl border-white/5 hover:bg-white/5 transition-all group flex flex-col items-center gap-4 text-center"
                            >
                                <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <dept.icon className={`h-7 w-7 ${dept.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase italic tracking-tight">{dept.title}</h4>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Management</p>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'plan') {
        return (
            <div className="min-h-screen bg-black py-20 px-4 relative flex flex-col items-center">
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-[#FFB800]/5 blur-[120px] rounded-full" />

                <div className="w-full max-w-6xl relative z-10">
                    <div className="text-center mb-16">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-[0.2em] mb-8">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Reset Status Selection
                        </Button>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 italic">Dealer Membership</h2>
                        <p className="text-zinc-500 font-medium italic lowercase">select your operational tier</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {PRICING_PLANS.map(plan => (
                            <Card
                                key={plan.id}
                                className={`glass-card relative border-none rounded-[2.5rem] p-10 text-left overflow-hidden group hover:scale-[1.02] transition-all duration-500 cursor-pointer ${selectedPlan === plan.id ? 'ring-2 ring-[#FFB800]' : ''}`}
                                onClick={() => { setSelectedPlan(plan.id); setStep('details'); }}
                            >
                                <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-gold-gradient blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-white uppercase italic">{plan.name}</h3>
                                    <p className="text-zinc-500 text-xs mb-8 font-medium italic">{plan.sub}</p>

                                    <div className="mb-10">
                                        <span className="text-3xl font-black text-[#FFB800] italic">{plan.price}</span>
                                        {plan.period && <span className="text-zinc-600 text-xs font-bold uppercase ml-1">{plan.period}</span>}
                                    </div>

                                    <ul className="space-y-4 mb-4">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-center gap-3 text-zinc-400 text-xs font-semibold uppercase tracking-tight">
                                                <div className="h-5 w-5 glass-card rounded-md flex items-center justify-center text-[#FFB800]">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'auth-method') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white">
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-600 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2">Verification Channel</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">choose your identity entry point</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        <Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest" onClick={signInWithGoogle}>
                            <Globe className="mr-3 h-5 w-5 text-blue-500" /> Google Identity Hub
                        </Button>
                        <div className="relative flex items-center justify-center py-4">
                            <div className="absolute inset-x-0 h-px bg-white/5"></div>
                            <span className="relative bg-zinc-950 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-800">Protocol Selection</span>
                        </div>
                        <Button className="w-full h-16 rounded-[1.5rem] bg-white border border-white/10 text-black font-black uppercase tracking-widest" onClick={() => setStep('details')}>
                            <Mail className="mr-3 h-5 w-5" /> Direct Email Path
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-black relative">
            <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-[#FFB800]/5 blur-[120px] rounded-full" />

            <Card className="w-full max-w-xl glass-card border-none rounded-[3rem] p-12 text-white relative z-10">
                <CardHeader className="p-0 mb-10 text-left">
                    <Button variant="ghost" onClick={() => setStep(role === 'dealer' ? 'plan' : 'auth-method')} className="text-zinc-600 hover:text-white p-0 h-auto mb-6 text-[10px] font-black uppercase tracking-widest"><ArrowLeft className="mr-2 h-3 w-3" /> Back</Button>
                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter mb-2">Establish Identity</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium italic lowercase">
                        {role === 'dealer' ? `Establishing node for ${selectedPlan} protocol` : "Please define your global attributes"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl border border-red-500/20 text-center mb-6">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Full Name</label>
                                <input name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="SAMUEL ADE" className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Email Identity</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="FOUNDER@MARKET.IO" className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Secure Key</label>
                                <div className="relative">
                                    <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required className="w-full h-14 pl-6 pr-14 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Confirm Key</label>
                                <input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Operational Region</label>
                            <select name="location" className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase" value={formData.location} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, location: e.target.value })} required>
                                <option value="" className="bg-zinc-900">Select Node State</option>
                                {NIGERIAN_STATES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                            </select>
                        </div>

                        {role === 'dealer' && (
                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Business Designation</label>
                                        <input name="businessName" value={formData.businessName} onChange={handleChange} required className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">CAC Identifier (Optional)</label>
                                        <input name="cacNumber" value={formData.cacNumber} onChange={handleChange} className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase" />
                                    </div>
                                </div>
                                <div className="glass-card p-8 rounded-[2rem] border-white/5 text-center">
                                    <p className="text-[9px] uppercase font-black text-zinc-600 mb-6 tracking-[0.3em]">Payment Terminal</p>
                                    <div className="flex justify-center gap-4">
                                        {(['card', 'transfer', 'opay'] as const).map(p => (
                                            <button key={p} type="button" onClick={() => setPaymentProvider(p)} className={`h-11 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${paymentProvider === p ? 'bg-gold-gradient text-black shadow-[0_0_20px_rgba(255,184,0,0.3)]' : 'border border-white/10 text-zinc-500 hover:text-white'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-16 bg-gold-gradient text-black font-black uppercase tracking-widest rounded-2xl glow-on-hover border-none mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                <span>{role === 'dealer' && selectedPlan !== 'starter' ? 'Initialize Pipe & Join' : 'Establish Identity'}</span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#FFB800]" /></div>}><SignupContent /></Suspense>;
}
