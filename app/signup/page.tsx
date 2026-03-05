'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import {
    Loader2, ArrowLeft, ArrowRight, User as UserIcon,
    Globe, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Only buyers and sellers can self-register.
// Admin/CEO accounts are provisioned internally by the MarketBridge team.
type Step = 'role' | 'details';
type Role = 'student_buyer' | 'student_seller';

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('student_buyer');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const roleParam = searchParams?.get('role');
        if (roleParam === 'student_seller' || roleParam === 'seller') {
            setRole('student_seller');
            setCurrentStep('details');
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        setCurrentStep('details');
    };


    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            const nextPath = role === 'student_buyer' ? '/marketplace' : '/seller-onboard';
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=${nextPath}&role=${role}`);
        } catch (err: any) {
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
            const signUpPromise = supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role,
                    }
                }
            });

            const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out. Check your network and try again.')), 8000)
            );

            const { data: authData, error: authError } = await Promise.race([signUpPromise, timeoutPromise]);

            // Hard auth error
            if (authError) {
                // Supabase returns this when email already exists in auth.users
                if (authError.message?.toLowerCase().includes('already registered') ||
                    authError.message?.toLowerCase().includes('already exists') ||
                    authError.status === 422) {
                    toast('An account with this email already exists. Redirecting to login...', 'info');
                    setTimeout(() => router.push(`/login?email=${encodeURIComponent(normalizedEmail)}`), 1500);
                    return;
                }
                throw authError;
            }

            // Supabase silently returns a user with no session + empty identities when email
            // is already registered but unconfirmed — detect and handle it
            if (!authData?.user) {
                throw new Error('Account creation failed. Please try again.');
            }

            const isGhostUser =
                !authData.session &&
                Array.isArray(authData.user?.identities) &&
                authData.user.identities.length === 0;

            if (isGhostUser) {
                toast('An account with this email already exists. Please log in or reset your password.', 'info');
                setTimeout(() => router.push(`/login`), 1800);
                return;
            }

            // Write profile to users table — use upsert so re-attempts don't fail
            const { error: profileError } = await supabase.from('users').upsert({
                id: authData.user.id,
                email: normalizedEmail,
                display_name: `${formData.firstName} ${formData.lastName}`.trim(),
                first_name: formData.firstName,
                last_name: formData.lastName,
                role,
                email_verified: false,
                is_verified: false,
                is_verified_seller: false,
                coins_balance: role === 'student_buyer' ? 100 : 0,
            }, { onConflict: 'id' });

            if (profileError) {
                // Profile failed but auth succeeded — user can still log in, profile syncs on login
                console.error('Profile creation error (non-fatal):', profileError);
                toast('Account created! Profile sync will complete on first login.', 'success');
                router.push('/login');
                return;
            }

            // Email confirmation required
            if (!authData.session) {
                toast('Account created! Check your email to verify your account.', 'success');
                router.push('/login');
                return;
            }

            // Fully signed in
            toast('Welcome to MarketBridge! 🎉', 'success');
            await refreshUser();

            router.push(role === 'student_buyer' ? '/marketplace' : '/seller-onboard');

        } catch (err: any) {
            console.error('Signup error:', err);
            const msg = err.message || 'Something went wrong. Please try again.';
            if (msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('network')) {
                toast('Connection issue. Please check your internet and try again.', 'error');
            } else {
                toast(msg, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };


    // ─── STEP 1: Role Selector ───
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-lg relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-white/40 hover:text-white mb-8 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <div className="flex justify-center mb-6">
                            <Logo showText={false} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4 italic">
                            Join Market<span className="text-[#FF6200]">Bridge</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Select how you want to use the platform
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        {/* Buyer */}
                        <button
                            onClick={() => handleRoleSelect('student_buyer')}
                            className="group bg-white/[0.04] border border-white/10 rounded-[2rem] p-8 text-center cursor-pointer hover:bg-white/[0.07] hover:border-[#FF6200]/30 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-[#FF6200]/10 transition-colors">
                                <UserIcon className="h-8 w-8 text-white/60 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">Buyer</h3>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Shop campus deals</p>
                        </button>

                        {/* Seller — highlighted */}
                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-[#FF6200]/10 border-2 border-[#FF6200]/40 rounded-[2rem] p-8 text-center cursor-pointer hover:bg-[#FF6200]/15 hover:border-[#FF6200] transition-all duration-300 flex flex-col items-center relative"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6200] text-black text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                Start Selling
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/20 flex items-center justify-center mb-5">
                                <Briefcase className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">Seller</h3>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">List &amp; sell items</p>
                        </button>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-white/40 font-medium text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#FF6200] font-bold hover:underline">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 2: Signup Form ───
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#FF6200]/5 rounded-full blur-[100px] pointer-events-none" />
            <Card className="w-full max-w-md bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep('role')}
                        className="text-white/40 hover:text-white mb-4 uppercase text-[10px] font-black tracking-widest"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Change Role
                    </Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-white">Create Your Account</CardTitle>
                    <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Signing up as:{' '}
                        <span className="text-[#FF6200]">
                            {role === 'student_seller' ? 'Seller' : 'Buyer'}
                        </span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">First Name</label>
                                <input
                                    name="firstName"
                                    type="text"
                                    autoFocus
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="John"
                                    title="First Name"
                                    className="w-full h-14 px-5 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Last Name</label>
                                <input
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Doe"
                                    title="Last Name"
                                    className="w-full h-14 px-5 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="name@email.com"
                                title="Email Address"
                                className="w-full h-14 px-5 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                className="w-full h-14 px-5 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Confirm Password</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                title="Confirm Password"
                                className="w-full h-14 px-5 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10 flex items-center justify-center gap-2 group"
                            disabled={isLoading}
                        >
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
                                <div className="absolute inset-x-0 h-px bg-zinc-800" />
                                <span className="relative bg-zinc-900 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Or continue with</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleGoogleAuth}
                                className="w-full h-14 bg-transparent border-zinc-700 text-white/70 font-bold rounded-2xl hover:bg-zinc-800 transition-all"
                            >
                                <Globe className="mr-3 h-5 w-5 text-[#FF6200]" />
                                Google Sign Up
                            </Button>
                        </>
                    )}

                    <p className="text-center text-white/30 text-xs font-semibold mt-6">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="text-[#FF6200] hover:underline">Terms</Link>
                        {' '}&{' '}
                        <Link href="/privacy" className="text-[#FF6200] hover:underline">Privacy Policy</Link>.
                    </p>

                    <p className="text-center text-white/30 text-xs font-semibold">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#FF6200] font-bold hover:underline">Log In</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#FF6200]" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
