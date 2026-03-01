'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowLeft, ArrowRight, User as UserIcon, ShieldCheck, Lock, Globe, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<'role' | 'details'>('role');
    const [role, setRole] = useState<'student_buyer' | 'student_seller' | 'admin' | 'ceo'>('student_buyer');

    useEffect(() => {
        const roleParam = searchParams?.get('role');
        if (roleParam === 'student_seller' || roleParam === 'seller') {
            setRole('student_seller');
        } else if (roleParam === 'admin') {
            setRole('admin');
        } else if (roleParam === 'ceo') {
            setRole('ceo');
        }
    }, [searchParams]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: ''
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            const nextPath = role === 'student_buyer' ? '/marketplace' : '/seller-onboard';
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=${nextPath}&role=${role}`);
        } catch (err: any) {
            console.error('Google signup error:', err);
            toast(err.message || 'Verification failed. Please try again.', 'error');
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Passwords do not match', 'error');
            return;
        }

        if (formData.password.length < 8) {
            toast('Password must be at least 8 characters', 'error');
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

            const { error: profileError } = await supabase.from('users').upsert({
                id: authData.user.id,
                email: normalizedEmail,
                display_name: `${formData.firstName} ${formData.lastName}`.trim(),
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: role,
                email_verified: false,
                isVerified: false // Explicitly unverified initially
            }, { onConflict: 'id' });

            if (profileError) throw profileError;

            toast('Account created successfully!', 'success');
            await refreshUser();

            // Redirect logic based on Chowdeck spec
            if (role === 'student_buyer') {
                router.push('/marketplace');
            } else if (role === 'student_seller') {
                router.push('/seller-onboard');
            } else if (role === 'admin') {
                router.push('/admin');
            } else if (role === 'ceo') {
                router.push('/admin/ceo');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            toast(err.message || 'Initialization failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] relative overflow-hidden">
                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 mb-6 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900 mb-4">Join MarketBridge</h1>
                        <p className="text-[#FF6200] font-bold uppercase tracking-[0.2em] text-[10px]">Select how you want to use the platform</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-6xl mx-auto">
                        {[
                            { id: 'student_buyer', title: 'Buyer', icon: UserIcon, desc: 'Shop campus deals', color: 'text-[#111111]', bg: 'bg-zinc-100', border: 'hover:border-[#FF6200]' },
                            { id: 'student_seller', title: 'Seller', icon: Briefcase, desc: 'List your items & sell', color: 'text-[#111111]', bg: 'bg-zinc-100', border: 'hover:border-[#FF6200]' },
                            { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Manage operations', color: 'text-[#111111]', bg: 'bg-zinc-100', border: 'hover:border-[#FF6200]' },
                            { id: 'ceo', title: 'CEO', icon: Lock, desc: 'Oversee everything', color: 'text-[#111111]', bg: 'bg-zinc-100', border: 'hover:border-[#FF6200]' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className={`bg-white border-zinc-200 rounded-[2rem] p-8 text-center cursor-pointer hover:shadow-xl transition-all duration-300 ${item.border}`}
                                onClick={() => {
                                    setRole(item.id as any);
                                    setCurrentStep('details');
                                }}
                            >
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${item.bg}`}>
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight mb-2">{item.title}</h3>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-zinc-600 font-medium text-sm">
                            Already have an account? <Link href="/login" className="text-[#FF6200] font-bold hover:underline">Log In</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA] relative">
            <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button variant="ghost" onClick={() => setCurrentStep('role')} className="text-zinc-500 hover:text-zinc-900 mb-4 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Change Role</Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Create Account</CardTitle>
                    <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Signing up as: <span className="text-[#FF6200]">{role.replace('student_', '')}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-2">First Name</label>
                                <input
                                    name="firstName"
                                    type="text"
                                    autoFocus
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-2">Last Name</label>
                                <input
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full h-14 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                className="w-full h-14 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-2">Confirm Password</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                className="w-full h-14 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                            />
                        </div>

                        <Button type="submit" className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    Create Account
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {role === 'student_buyer' && (
                        <>
                            <div className="relative py-4 flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-zinc-200"></div>
                                <span className="relative bg-white px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Or continue with</span>
                            </div>

                            <Button variant="outline" onClick={handleGoogleAuth} className="w-full h-14 bg-white border-zinc-200 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-50 transition-all shadow-sm">
                                <Globe className="mr-3 h-5 w-5 text-[#FF6200]" />
                                Google Sign Up
                            </Button>
                        </>
                    )}

                    <p className="text-center text-zinc-600 text-xs font-semibold mt-6">
                        By continuing, you agree to our <Link href="/terms" className="text-[#FF6200] hover:underline">Terms</Link> & <Link href="/privacy" className="text-[#FF6200] hover:underline">Privacy Policy</Link>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#FF6200]" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
