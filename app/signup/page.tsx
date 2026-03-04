'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import {
    Loader2, ArrowLeft, ArrowRight, User as UserIcon, ShieldCheck,
    Lock, Globe, Briefcase, AlertTriangle, KeyRound
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Access codes — in production ideally move to env vars or backend check
const ADMIN_ACCESS_CODES = ['marketbridge2026', '1029384756', 'MB-FOUNDER-99', 'MB-TECH-2024', 'MB-OPS-2024', 'MB-MKT-2024'];

type Step = 'role' | 'pin' | 'details';
type Role = 'student_buyer' | 'student_seller' | 'admin' | 'ceo';

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('student_buyer');
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    // If URL has ?role=student_seller (from seller-onboard redirect), skip role step 
    useEffect(() => {
        const roleParam = searchParams?.get('role');
        if (roleParam === 'student_seller' || roleParam === 'seller') {
            setRole('student_seller');
            setCurrentStep('details'); // Go straight to the form
        } else if (roleParam === 'admin') {
            setRole('admin');
            setCurrentStep('pin'); // Admin must pass PIN first
        } else if (roleParam === 'ceo') {
            setRole('ceo');
            setCurrentStep('pin'); // CEO must pass PIN first
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        setPinValue('');
        setPinError('');
        if (selectedRole === 'admin' || selectedRole === 'ceo') {
            setCurrentStep('pin');
        } else {
            setCurrentStep('details');
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ADMIN_ACCESS_CODES.includes(pinValue)) {
            setCurrentStep('details');
            setPinError('');
        } else {
            setPinError('Access Denied: Invalid security signature.');
            setPinValue('');
        }
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
                is_verified: false,
                is_verified_seller: false,
                coins_balance: role === 'student_buyer' ? 100 : 0
            }, { onConflict: 'id' });

            if (profileError) throw profileError;

            if (!authData.session) {
                toast('Account created! Please check your email to verify your account.', 'success');
                router.push('/login');
                return;
            }

            toast('Account created successfully!', 'success');
            await refreshUser();

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

    // ─── STEP 1: Role Selector ───
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-5xl relative z-10">
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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 max-w-4xl mx-auto">
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
                                Popular
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/20 flex items-center justify-center mb-5">
                                <Briefcase className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">Seller</h3>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">List & sell items</p>
                        </button>

                        {/* Admin — locked */}
                        <button
                            onClick={() => handleRoleSelect('admin')}
                            className="group bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 text-center cursor-pointer hover:border-zinc-600 transition-all duration-300 flex flex-col items-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded-full">
                                <Lock className="h-2.5 w-2.5 text-zinc-400" />
                                <span className="text-[7px] font-black uppercase text-zinc-400 tracking-wider">Restricted</span>
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-5">
                                <ShieldCheck className="h-8 w-8 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                            </div>
                            <h3 className="text-base font-black text-zinc-400 uppercase tracking-tight mb-2">Admin</h3>
                            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Manage operations</p>
                        </button>

                        {/* CEO — locked */}
                        <button
                            onClick={() => handleRoleSelect('ceo')}
                            className="group bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 text-center cursor-pointer hover:border-zinc-600 transition-all duration-300 flex flex-col items-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded-full">
                                <Lock className="h-2.5 w-2.5 text-zinc-400" />
                                <span className="text-[7px] font-black uppercase text-zinc-400 tracking-wider">Restricted</span>
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-5">
                                <Lock className="h-8 w-8 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                            </div>
                            <h3 className="text-base font-black text-zinc-400 uppercase tracking-tight mb-2">CEO</h3>
                            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Oversee everything</p>
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

    // ─── STEP 2: PIN Gate (Admin / CEO only) ───
    if (currentStep === 'pin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
                <Card className="w-full max-w-sm bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep('role')}
                            className="text-white/40 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest w-full justify-start"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="mx-auto h-20 w-20 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 shadow-lg">
                            <KeyRound className="h-10 w-10 text-[#FF6200]" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                            Restricted Access
                        </CardTitle>
                        <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                            {role === 'ceo' ? 'CEO' : 'Admin'} authorization required
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 space-y-6">
                        {pinError && (
                            <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-4 flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                <p className="text-red-400 text-[10px] font-black uppercase tracking-wider">{pinError}</p>
                            </div>
                        )}
                        <form onSubmit={handlePinSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">
                                    Security PIN / Access Code
                                </label>
                                <input
                                    type="password"
                                    className="w-full h-16 bg-zinc-950 border border-zinc-700 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 text-white placeholder:text-zinc-700 transition-all"
                                    value={pinValue}
                                    onChange={(e) => setPinValue(e.target.value)}
                                    placeholder="••••••••"
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest shadow-lg shadow-[#FF6200]/10 transition-all"
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Authorize Access
                            </Button>
                        </form>
                        <p className="text-center text-white/20 text-[9px] font-bold uppercase tracking-widest">
                            Unauthorized access attempts are logged
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── STEP 3: Signup Form ───
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#FF6200]/5 rounded-full blur-[100px] pointer-events-none" />
            <Card className="w-full max-w-md bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => role === 'admin' || role === 'ceo' ? setCurrentStep('pin') : setCurrentStep('role')}
                        className="text-white/40 hover:text-white mb-4 uppercase text-[10px] font-black tracking-widest"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {role === 'admin' || role === 'ceo' ? 'Back to PIN' : 'Change Role'}
                    </Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-white">Create Account</CardTitle>
                    <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Signing up as:{' '}
                        <span className="text-[#FF6200]">
                            {role === 'student_seller' ? 'Seller' : role === 'student_buyer' ? 'Buyer' : role.toUpperCase()}
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
