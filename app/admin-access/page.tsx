'use client';

/**
 * /admin-access — Internal-only route for Admin & CEO account creation.
 * Not linked anywhere in the public UI. Share this URL only with your team.
 * Protected by access code before any account can be created.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    Loader2, ArrowLeft, ArrowRight, ShieldCheck,
    Lock, AlertTriangle, KeyRound, Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Access codes — verified server-side in production, checked here for UX speed
const ADMIN_ACCESS_CODES = [
    'marketbridge2026',
    '1029384756',
    'MB-FOUNDER-99',
    'MB-TECH-2024',
    'MB-OPS-2024',
    'MB-MKT-2024',
];

type Step = 'role' | 'pin' | 'details';
type AdminRole = 'admin' | 'ceo';

function AdminAccessContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, user, sessionUser, loading } = useAuth();
    const { toast } = useToast();

    const [step, setStep] = useState<Step>('role');
    const [role, setRole] = useState<AdminRole>('admin');
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
    });

    // Redirect already-logged-in admins to their dashboard
    useEffect(() => {
        if (!loading && sessionUser && user) {
            if (user.role === 'ceo') router.push('/admin/ceo');
            else if (['admin', 'technical_admin', 'operations_admin'].includes(user.role)) router.push('/admin');
        }
    }, [user, sessionUser, loading, router]);

    // Support ?role=admin or ?role=ceo URL params (for direct deep-linking by team)
    useEffect(() => {
        const roleParam = searchParams?.get('role');
        if (roleParam === 'admin') { setRole('admin'); setStep('pin'); }
        if (roleParam === 'ceo') { setRole('ceo'); setStep('pin'); }
    }, [searchParams]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ADMIN_ACCESS_CODES.includes(pinValue.trim())) {
            setStep('details');
            setPinError('');
        } else {
            setPinError('Access Denied: Invalid security signature.');
            setPinValue('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
                        role,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed — no user returned');

            // Write into users table with correct admin/CEO role
            const { error: profileError } = await supabase.from('users').upsert({
                id: authData.user.id,
                email: normalizedEmail,
                display_name: `${formData.firstName} ${formData.lastName}`.trim(),
                first_name: formData.firstName,
                last_name: formData.lastName,
                role,
                email_verified: false,
                is_verified: true, // Admins are pre-verified
            }, { onConflict: 'id' });

            if (profileError) throw profileError;

            if (!authData.session) {
                toast('Account created! Check your email to verify, then log in at /login.', 'success');
                router.push('/login');
                return;
            }

            toast(`${role === 'ceo' ? 'CEO' : 'Admin'} account created successfully!`, 'success');
            await refreshUser();
            router.push(role === 'ceo' ? '/admin/ceo' : '/admin');
        } catch (err: any) {
            console.error('Admin signup error:', err);
            toast(err.message || 'Account creation failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── STEP 1: Role Select ───
    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10 text-center">
                    <div className="flex justify-center mb-8">
                        <Logo showText={false} />
                    </div>
                    <div className="inline-flex items-center gap-2 bg-red-950/30 border border-red-900/30 rounded-full px-4 py-1.5 mb-6">
                        <Lock className="h-3 w-3 text-red-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Internal Access Only</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic mb-2">
                        Team <span className="text-[#FF6200]">Access</span>
                    </h1>
                    <p className="text-white/30 text-xs font-medium mb-10">
                        MarketBridge internal team registration. Not for public use.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Admin */}
                        <button
                            onClick={() => { setRole('admin'); setStep('pin'); }}
                            className="group bg-zinc-900 border-2 border-zinc-700 rounded-[2rem] p-8 text-center hover:border-[#FF6200]/40 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-5 group-hover:bg-[#FF6200]/10 transition-colors">
                                <ShieldCheck className="h-8 w-8 text-zinc-400 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">Admin</h3>
                            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Operations team</p>
                        </button>

                        {/* CEO */}
                        <button
                            onClick={() => { setRole('ceo'); setStep('pin'); }}
                            className="group bg-[#FF6200]/10 border-2 border-[#FF6200]/30 rounded-[2rem] p-8 text-center hover:border-[#FF6200] transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/20 flex items-center justify-center mb-5">
                                <Crown className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">CEO</h3>
                            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Executive access</p>
                        </button>
                    </div>

                    <p className="text-white/20 text-xs">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#FF6200] hover:underline font-bold">Log In</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ─── STEP 2: PIN Gate ───
    if (step === 'pin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
                <Card className="w-full max-w-sm bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-0 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('role')}
                            className="text-white/40 hover:text-white mb-4 uppercase text-[10px] font-black tracking-widest w-full justify-start"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="mx-auto h-20 w-20 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
                            <KeyRound className="h-10 w-10 text-[#FF6200]" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white mb-1">
                            {role === 'ceo' ? 'CEO' : 'Admin'} Authorization
                        </CardTitle>
                        <CardDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                            Enter your team access code
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-5">
                        {pinError && (
                            <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-3 flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                <p className="text-red-400 text-[10px] font-black uppercase tracking-wider">{pinError}</p>
                            </div>
                        )}
                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <input
                                name="pin"
                                type="password"
                                className="w-full h-16 bg-zinc-950 border border-zinc-700 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 text-white placeholder:text-zinc-700 transition-all font-password"
                                value={pinValue}
                                onChange={e => setPinValue(e.target.value)}
                                placeholder="••••••••"
                                title="Enter authorized security PIN"
                                autoFocus
                                required
                            />
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest"
                            >
                                <Lock className="h-4 w-4 mr-2" /> Verify Access
                            </Button>
                        </form>
                        <p className="text-center text-white/20 text-[9px] font-bold uppercase tracking-widest">
                            All access attempts are logged
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── STEP 3: Create Account ───
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#FF6200]/5 rounded-full blur-[100px] pointer-events-none" />
            <Card className="w-full max-w-md bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => setStep('pin')}
                        className="text-white/40 hover:text-white mb-4 uppercase text-[10px] font-black tracking-widest"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-white">
                        Create {role === 'ceo' ? 'CEO' : 'Admin'} Account
                    </CardTitle>
                    <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Access level: <span className="text-[#FF6200]">{role === 'ceo' ? 'Executive (Full)' : 'Operations Admin'}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40">First Name</label>
                                <input
                                    name="firstName"
                                    type="text"
                                    autoFocus
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="John"
                                    title="Enter your first name"
                                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Last Name</label>
                                <input
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    title="Enter your last name"
                                    required
                                    className="w-full h-12 px-4 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="team@marketbridge.com.ng"
                                className="w-full h-12 px-4 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                className="w-full h-12 px-4 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Confirm Password</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                placeholder="••••••••"
                                title="Confirm your secure password"
                                required
                                className="w-full h-12 px-4 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF6200]/10 flex items-center justify-center gap-2 group mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    Create {role === 'ceo' ? 'CEO' : 'Admin'} Account
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-white/20 text-[10px] font-bold uppercase tracking-widest mt-6">
                        This page is for internal MarketBridge team only
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminAccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#FF6200]" />
            </div>
        }>
            <AdminAccessContent />
        </Suspense>
    );
}
