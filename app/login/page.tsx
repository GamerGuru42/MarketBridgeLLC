'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ChevronRight, Lock, User as UserIcon, Globe, KeyRound, AlertTriangle, Store } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';

const ADMIN_CODES = ['marketbridge2026', '1029384756', 'MB-FOUNDER-99', 'MB-TECH-2024', 'MB-OPS-2024', 'MB-MKT-2024'];

function LoginContent() {
    const supabase = createClient();
    const { signInWithGoogle, refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || searchParams?.get('next');

    const [currentStep, setCurrentStep] = useState<'role' | 'details'>('role');
    const [loginRole, setLoginRole] = useState<string>('student_buyer');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Admin PIN overlay — hidden by default, slides in on demand
    const [showAdminPin, setShowAdminPin] = useState(false);
    const [adminPin, setAdminPin] = useState('');
    const [adminPinError, setAdminPinError] = useState('');
    const [adminVerified, setAdminVerified] = useState(false);

    // Redirect already-logged-in users instantly (no role picker step)
    useEffect(() => {
        if (!loading && sessionUser && user) {
            const dest = redirectUrl || getRoleDestination(user.role);
            router.replace(dest);
        }
    }, [user, sessionUser, loading, router, redirectUrl]);

    // Pre-fill email when redirected from signup duplicate detection
    useEffect(() => {
        const emailParam = searchParams?.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
        }
    }, [searchParams]);

    function getRoleDestination(role: string) {
        if (['dealer', 'student_seller', 'seller'].includes(role)) return '/seller/dashboard';
        if (role === 'ceo') return '/admin/ceo';
        if (['admin', 'technical_admin', 'operations_admin'].includes(role)) return '/admin';
        return '/marketplace';
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleAdminPinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ADMIN_CODES.includes(adminPin.trim())) {
            setAdminVerified(true);
            setShowAdminPin(false);
            setAdminPinError('');
        } else {
            setAdminPinError('Invalid access code. Contact your team lead.');
            setAdminPin('');
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const next = redirectUrl || '/marketplace';
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=${next}`);
        } catch (err: any) {
            setError(err.message || 'Google login failed. Please try again.');
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const emailToUse = normalizeIdentifier(formData.email);

            // 8-second timeout — fail fast
            const loginPromise = supabase.auth.signInWithPassword({
                email: emailToUse,
                password: formData.password,
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. Check your connection.')), 8000)
            );

            const { data, error: signInError } = await Promise.race([loginPromise, timeoutPromise as any]);

            if (signInError) {
                const msg = signInError.message?.toLowerCase() ?? '';
                if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
                    setError('Incorrect email or password.');
                } else if (msg.includes('email not confirmed')) {
                    setError('Please verify your email first — check your inbox.');
                } else if (msg.includes('timed out')) {
                    setError('Connection issue. Check your internet and try again.');
                } else {
                    setError(signInError.message || 'Login failed. Please try again.');
                }
                return;
            }

            if (!data?.user) {
                setError('Login failed. Please try again.');
                return;
            }

            // Fetch profile (or auto-create if missing — handles deleted profiles)
            let userRole = data.user.user_metadata?.role as string;
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!profile) {
                // Auto-heal — create missing profile so they're not stuck
                const meta = data.user.user_metadata || {};
                const healedRole = meta.role || 'student_buyer';
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: data.user.email ?? '',
                    display_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim()
                        || data.user.email?.split('@')[0] || 'User',
                    first_name: meta.first_name || '',
                    last_name: meta.last_name || '',
                    role: healedRole,
                    email_verified: !!data.user.email_confirmed_at,
                    is_verified: false,
                    is_verified_seller: false,
                    coins_balance: healedRole === 'student_buyer' ? 100 : 0,
                }, { onConflict: 'id' });
                userRole = healedRole;
            } else {
                userRole = profile.role || userRole;
            }

            // Refresh context (non-blocking)
            refreshUser(data.user.id).catch(err => console.warn('Context refresh:', err));

            // Redirect immediately — no waiting
            router.replace(redirectUrl || getRoleDestination(userRole));

        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleSelect = (role: string) => {
        setLoginRole(role);
        setCurrentStep('details');
        if (role === 'admin') {
            setShowAdminPin(true);
        }
    };

    // Show nothing while checking existing session (prevents flicker)
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Logo showText={false} />
                    <div className="h-1 w-32 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF6200] w-1/2 animate-pulse rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 1: Role Selector ───
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-lg relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-white/40 hover:text-white mb-8 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            ← Return to Home
                        </Link>
                        <div className="flex justify-center mb-6">
                            <Logo showText={false} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4 italic">
                            Welcome <span className="text-[#FF6200]">Back</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Choose your workspace to continue
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        {/* Buyer */}
                        <button
                            onClick={() => handleRoleSelect('student_buyer')}
                            className="group bg-white/[0.04] border border-white/10 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-white/[0.07] hover:border-[#FF6200]/30 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#FF6200]/10 transition-colors">
                                <UserIcon className="h-6 w-6 text-white/60 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Shop</p>
                        </button>

                        {/* Seller */}
                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-white/[0.04] border border-white/10 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-white/[0.07] hover:border-[#FF6200]/30 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#FF6200]/10 transition-colors">
                                <Store className="h-6 w-6 text-white/60 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Sell</p>
                        </button>

                        {/* Admin */}
                        <button
                            onClick={() => handleRoleSelect('admin')}
                            className="group bg-white/[0.04] border border-white/10 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-white/[0.07] hover:border-[#FF6200]/30 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#FF6200]/10 transition-colors">
                                <Lock className="h-6 w-6 text-white/60 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Admin</h3>
                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Ops</p>
                        </button>

                        {/* CEO */}
                        <button
                            onClick={() => handleRoleSelect('ceo')}
                            className="group bg-[#FF6200]/5 border border-[#FF6200]/20 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-[#FF6200]/10 hover:border-[#FF6200]/50 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-12 w-12 rounded-xl bg-[#FF6200]/10 flex items-center justify-center mb-4">
                                <KeyRound className="h-6 w-6 text-[#FF6200]" />
                            </div>
                            <h3 className="text-sm font-black text-[#FF6200] uppercase tracking-tight mb-1">CEO</h3>
                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Growth</p>
                        </button>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-white/40 font-medium text-sm">
                            No account?{' '}
                            <Link href="/signup" className="text-[#FF6200] font-bold hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#FF6200]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Admin PIN Modal */}
            {showAdminPin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-5 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                                <KeyRound className="h-7 w-7 text-[#FF6200]" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Team Access</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Enter your access code</p>
                        </div>
                        {adminPinError && (
                            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                                <p className="text-red-400 text-xs font-bold">{adminPinError}</p>
                            </div>
                        )}
                        <form onSubmit={handleAdminPinSubmit} className="space-y-3">
                            <input
                                type="password"
                                aria-label="Admin access code"
                                placeholder="Access code"
                                className="w-full h-14 bg-zinc-950 border border-zinc-700 rounded-xl text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 text-white placeholder:text-zinc-700 transition-all"
                                value={adminPin}
                                onChange={e => setAdminPin(e.target.value)}
                                autoFocus
                                required
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { setShowAdminPin(false); setAdminPin(''); setAdminPinError(''); }}
                                    className="flex-1 h-12 text-white/40 hover:text-white rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-xl"
                                >
                                    <Lock className="h-4 w-4 mr-1" /> Verify
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Login Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setCurrentStep('role');
                                setAdminVerified(false);
                            }}
                            className="inline-flex items-center text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            ← Role
                        </Button>
                        <Link href="/" className="text-white/20 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                            Home
                        </Link>
                    </div>
                    <div className="flex justify-center mb-5">
                        <Logo showText={false} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
                        Welcome <span className="text-[#FF6200]">Back</span>
                    </h1>
                    <p className="text-white/30 text-xs font-medium mt-1">
                        {adminVerified ? '🔒 Team access granted. Enter your credentials.' : 'Sign in to your account'}
                    </p>
                </div>

                <div className="bg-zinc-900/80 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm space-y-5">
                    {error && (
                        <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-3 flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                            <p className="text-red-400 text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-white/40">
                                Email Address
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="w-full h-14 pl-12 pr-4 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="text-[10px] uppercase font-black tracking-widest text-white/40">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-12 pr-14 bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/40 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF6200]/10 flex items-center justify-center gap-2 group transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Log In
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Google login — restricted to public roles */}
                    {!['admin', 'ceo', 'technical_admin', 'operations_admin'].includes(loginRole) && (
                        <>
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-zinc-800" />
                                <span className="relative bg-zinc-900 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Or</span>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full h-12 bg-transparent border-zinc-700 text-white/70 font-bold rounded-2xl hover:bg-zinc-800 hover:text-white transition-all"
                            >
                                <Globe className="mr-3 h-5 w-5 text-[#FF6200]" />
                                Continue with Google
                            </Button>
                        </>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-white/30 text-xs">
                            No account?{' '}
                            <Link href="/signup" className="text-[#FF6200] font-bold hover:underline">Sign up</Link>
                        </p>
                        {/* Discrete Team Login link — only visible if actively needed */}
                        {!adminVerified ? (
                            <button
                                type="button"
                                onClick={() => setShowAdminPin(true)}
                                className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
                            >
                                <Lock className="h-2.5 w-2.5" />
                                Team Login
                            </button>
                        ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#FF6200] flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" /> Access Granted
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-[#FF6200] border-t-transparent animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
