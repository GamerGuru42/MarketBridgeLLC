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
        lastName: '',
        adminCode: ''
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

        if (role === 'admin' || role === 'ceo') {
            const validCodes = ['marketbridge2026', '1029384756', 'MB-FOUNDER-99', 'MB-TECH-2024', 'MB-OPS-2024', 'MB-MKT-2024'];
            if (!validCodes.includes(formData.adminCode)) {
                toast('Invalid administrative access code', 'error');
                return;
            }
        }

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
            const signUpPromise = supabase.auth.signUp({
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

            const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error("Connection timed out. Please check your network and try again.")), 15000)
            );

            const { data: authData, error: authError } = await Promise.race([signUpPromise, timeoutPromise]);

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
                isVerified: false, // Explicitly unverified initially
                coins_balance: role === 'student_buyer' ? 100 : 0
            }, { onConflict: 'id' });

            if (profileError) throw profileError;

            if (!authData.session) {
                // Supabase requires email verification
                toast('Account created successfully! Please check your email inbox (or spam) to verify your account.', 'success');
                router.push('/login');
                return;
            }

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
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white mb-4">Join MarketBridge</h1>
                        <p className="text-[#FF6200] font-bold uppercase tracking-[0.2em] text-[10px]">Select how you want to use the platform</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-6xl mx-auto">
                        {[
                            { id: 'student_buyer', title: 'Buyer', icon: UserIcon, desc: 'Shop campus deals', color: 'text-zinc-900 dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-900', border: 'hover:border-[#FF6200]' },
                            { id: 'student_seller', title: 'Seller', icon: Briefcase, desc: 'List your items & sell', color: 'text-zinc-900 dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-900', border: 'hover:border-[#FF6200]' },
                            { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Manage operations', color: 'text-zinc-900 dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-900', border: 'hover:border-[#FF6200]' },
                            { id: 'ceo', title: 'CEO', icon: Lock, desc: 'Oversee everything', color: 'text-zinc-900 dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-900', border: 'hover:border-[#FF6200]' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className={`bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 text-center cursor-pointer hover:shadow-xl transition-all duration-300 ${item.border}`}
                                onClick={() => {
                                    setRole(item.id as any);
                                    setCurrentStep('details');
                                }}
                            >
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${item.bg}`}>
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">{item.title}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                            Already have an account? <Link href="/login" className="text-[#FF6200] font-bold hover:underline">Log In</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 relative">
            <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button variant="ghost" onClick={() => setCurrentStep('role')} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-4 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Change Role</Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Create Account</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Signing up as: <span className="text-[#FF6200]">{role.replace('student_', '')}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">First Name</label>
                                <input
                                    name="firstName"
                                    type="text"
                                    autoFocus
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">Last Name</label>
                                <input
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                className="w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">Confirm Password</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                className="w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                            />
                        </div>

                        {(role === 'admin' || role === 'ceo') && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">Admin Access Code</label>
                                <input
                                    name="adminCode"
                                    type="password"
                                    value={formData.adminCode}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter authorization code"
                                    className="w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                        )}

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
                                <div className="absolute inset-x-0 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                                <span className="relative bg-white dark:bg-zinc-900 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Or continue with</span>
                            </div>

                            <Button variant="outline" onClick={handleGoogleAuth} className="w-full h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm">
                                <Globe className="mr-3 h-5 w-5 text-[#FF6200]" />
                                Google Sign Up
                            </Button>
                        </>
                    )}

                    <p className="text-center text-zinc-600 dark:text-zinc-400 text-xs font-semibold mt-6">
                        By continuing, you agree to our <Link href="/terms" className="text-[#FF6200] hover:underline">Terms</Link> & <Link href="/privacy" className="text-[#FF6200] hover:underline">Privacy Policy</Link>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#FF6200]" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
