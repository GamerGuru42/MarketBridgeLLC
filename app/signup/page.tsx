'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowLeft, ArrowRight, Mail, Eye, EyeOff, ShieldCheck, User as UserIcon, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

const StepProgress = ({ currentStep }: { currentStep: string }) => {
    const steps = ['Profile', 'Terms'];
    const activeIdx = currentStep === 'profile' ? 0 : 1;

    return (
        <div className="flex items-center justify-center gap-4 mb-12">
            {steps.map((s, i) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`h-2 w-12 rounded-full transition-all duration-500 ${i <= activeIdx ? 'bg-[#FF6200] shadow-[0_0_10px_rgba(255,98,0,0.5)]' : 'bg-zinc-800'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${i <= activeIdx ? 'text-[#FF6200]' : 'text-white/20'}`}>{s}</span>
                    </div>
                    {i < steps.length - 1 && <div className="h-[1px] w-4 bg-zinc-900 mb-4" />}
                </React.Fragment>
            ))}
        </div>
    );
};

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();
    const role = searchParams?.get('role') || 'buyer';
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState('profile');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Passwords do not match', 'error');
            return;
        }

        if (!agreedToTerms) {
            toast('You must agree to the terms', 'error');
            return;
        }

        const normalizedEmail = normalizeIdentifier(formData.email);

        setIsLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role: role
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed - no user returned');

            // 2. Create profile in users table
            const { error: profileError } = await supabase.from('users').insert({
                id: authData.user.id,
                email: normalizedEmail,
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: role,
                status: 'pending',
                email_verified: false
            });

            if (profileError) throw profileError;

            // 3. Capture referral code from query string (if present)
            try {
                const refCode = searchParams?.get('ref') || searchParams?.get('referral') || null;
                if (refCode) {
                    await fetch('/api/referrals/record', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refCode, referredUserId: authData.user.id })
                    });
                }
            } catch (e) {
                console.warn('Referral capture failed', e);
            }

            toast('Account created successfully!', 'success');
            await refreshUser();

            // Redirect to dashboard immediately after creation
            if (role === 'student_seller' || role === 'dealer') {
                router.push('/seller/dashboard');
            } else {
                router.push('/listings');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            toast(err.message || 'Initialization failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 'profile') {
            if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
                toast('Please complete profile fundamentals', 'error');
                return;
            }
            if (formData.password !== formData.passwordConfirm) {
                toast('Passwords do not match', 'error');
                return;
            }
            setCurrentStep('terms');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-10 sm:py-20 px-4 bg-black relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-2xl glass-card border-none rounded-[3rem] p-6 sm:p-12 text-white shadow-2xl relative z-10 transition-all">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/50 to-transparent" />

                {/* Top Navigation */}
                <div className="flex justify-start mb-8">
                    <Button
                        asChild
                        variant="ghost"
                        className="text-white/40 hover:text-[#FF6200] flex items-center gap-2 px-0 transition-colors group"
                    >
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Return to Home</span>
                        </Link>
                    </Button>
                </div>

                <CardHeader className="p-0 text-center mb-10">
                    <div className="flex justify-center mb-8">
                        <Logo showText={false} className="scale-125 saturate-150 drop-shadow-[0_0_20px_rgba(255,102,0,0.3)]" />
                    </div>
                    <CardTitle className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
                        Create <span className="text-[#FF6200]">Account</span>
                    </CardTitle>
                    <CardDescription className="text-white font-medium uppercase tracking-widest text-[10px] bg-white/5 py-2 px-6 rounded-full inline-block">
                        MarketBridge Campus Access
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <StepProgress currentStep={currentStep} />

                    <form onSubmit={handleSignup} className="space-y-8">
                        {currentStep === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-[#FF6200] ml-2">First Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all hover:bg-white/[0.05]"
                                                placeholder="Emeka"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-[#FF6200] ml-2">Last Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all hover:bg-white/[0.05]"
                                                placeholder="Okonkwo"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#FF6200] ml-2">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#FF6200] transition-colors" />
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full h-14 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all hover:bg-white/[0.05]"
                                            placeholder="operator@marketbridge.com.ng"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-[#FF6200] ml-2">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-14 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all hover:bg-white/[0.05]"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#FF6200] transition-colors">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-[#FF6200] ml-2">Confirm Password</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="passwordConfirm"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.passwordConfirm}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all hover:bg-white/[0.05]"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="button" onClick={nextStep} className="h-14 px-8 bg-[#FF6200] hover:bg-[#FF8533] text-black font-black uppercase tracking-widest rounded-2xl border-none transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,98,0,0.3)] hover:scale-105 active:scale-95">
                                        Next Step <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 'terms' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/5 text-center bg-gradient-to-b from-[#FF6200]/5 to-transparent relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/20 to-transparent" />
                                        <Sparkles className="h-6 w-6 text-[#FF6200] mx-auto mb-4" />
                                        <p className="text-[10px] uppercase font-black text-[#FF6200] mb-2 tracking-[0.2em]">Almost Done</p>
                                        <p className="text-white/60 text-xs font-bold leading-relaxed">
                                            Campus selling requires student verification—complete it in your dashboard to start listing.
                                            By creating this account, you agree to our fair-trade policies and campus safety rules.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-4 p-6 bg-zinc-950/50 rounded-3xl border border-white/5">
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="h-5 w-5 rounded-lg border-white/10 bg-black checked:bg-[#FF6200] checked:text-black focus:ring-[#FF6200]/50 transition-all cursor-pointer accent-[#FF6200]"
                                            />
                                        </div>
                                        <label htmlFor="terms" className="text-[11px] text-white/70 font-bold leading-tight cursor-pointer">
                                            I verify compliance with the <Link href="/terms" className="text-[#FF6200] hover:text-white underline decoration-[#FF6200]/40 decoration-1 underline-offset-4 transition-colors">Terms of Service</Link> & <Link href="/privacy" className="text-[#FF6200] hover:text-white underline decoration-[#FF6200]/40 decoration-1 underline-offset-4 transition-colors">Privacy Policy</Link>.
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button type="button" onClick={() => setCurrentStep('profile')} variant="ghost" className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px]">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="submit" disabled={isLoading || !agreedToTerms} className="h-14 px-8 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_40px_rgba(255,102,0,0.2)] border-none transition-all flex items-center gap-3">
                                        {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                            <>Create Account <ArrowRight className="h-4 w-4" /></>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="text-center mt-6">
                        <Link href="/login" className="text-xs text-white/50 hover:text-white transition-colors">
                            Already have an account? Log In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" /></div>}>
            <SignupContent />
        </Suspense>
    );
}

