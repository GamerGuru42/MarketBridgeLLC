'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon, Globe, KeyRound, AlertTriangle, ArrowRight, ArrowLeft, Briefcase, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'role' | 'credentials';
type Role = 'student_buyer' | 'student_seller';

function LoginContent() {
    const supabase = createClient();
    const { signInWithGoogle, refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || searchParams?.get('next');

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('student_buyer');

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoadingRole, setGoogleLoadingRole] = useState<Role | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && sessionUser && user) {
            const dest = redirectUrl || getRoleDestination(user.role);
            router.replace(dest);
        }
    }, [user, sessionUser, loading, router, redirectUrl]);

    useEffect(() => {
        const emailParam = searchParams?.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
            setCurrentStep('credentials');
        }
        const roleParam = searchParams?.get('role');
        if (roleParam === 'student_seller' || roleParam === 'seller') {
            setRole('student_seller');
            setCurrentStep('credentials');
        } else if (roleParam === 'student_buyer' || roleParam === 'buyer') {
            setRole('student_buyer');
            setCurrentStep('credentials');
        }
    }, [searchParams]);

    function getRoleDestination(r: string) {
        if (['dealer', 'student_seller', 'seller'].includes(r)) return '/seller/dashboard';
        return '/marketplace';
    }

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        setCurrentStep('credentials');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleGoogleLogin = async (selectedRole: Role) => {
        setGoogleLoadingRole(selectedRole);
        setError('');
        try {
            const next = redirectUrl || (selectedRole === 'student_seller' ? '/seller/dashboard' : '/marketplace');
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${selectedRole}&next=${next}`);
        } catch (err: any) {
            setError(err.message || 'Google Sign-In failed.');
            setGoogleLoadingRole(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const emailToUse = normalizeIdentifier(formData.email);

            const loginPromise = supabase.auth.signInWithPassword({
                email: emailToUse,
                password: formData.password,
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out.')), 8000)
            );

            const { data, error: signInError } = await Promise.race([loginPromise, timeoutPromise as any]);

            if (signInError) {
                const msg = signInError.message?.toLowerCase() ?? '';
                if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
                    setError('Incorrect email or password.');
                } else if (msg.includes('email not confirmed')) {
                    setError('Please verify your email first.');
                } else if (msg.includes('timed out')) {
                    setError('Connection timed out.');
                } else {
                    setError(signInError.message || 'Login failed.');
                }
                return;
            }

            if (!data?.user) {
                setError('Login failed.');
                return;
            }

            let userRole = data.user.user_metadata?.role as string;
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!profile) {
                const meta = data.user.user_metadata || {};
                const healedRole = meta.role || 'student_buyer';
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: data.user.email ?? '',
                    display_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim()
                        || data.user.email?.split('@')[0] || 'User',
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

            refreshUser(data.user.id).catch(err => console.warn('Context sync error:', err));
            router.replace(redirectUrl || getRoleDestination(userRole));

        } catch (err: any) {
            setError(err.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // ─── STEP 1: Role Selector with Google Sign-In inside each card ──
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-background text-foreground relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
                <div className="w-full max-w-2xl relative z-10 glass-card bg-card/80 border border-border rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 shadow-2xl">
                    <div className="text-center mb-10 space-y-4">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                            Log <span className="text-primary">In</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                            Select your account type
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:px-4">
                        {/* ─── Buyer Card ─────────────────────────────────────────── */}
                        <div className="bg-secondary border border-border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm">
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4">
                                <UserIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-5">Shop & Browse</p>
                            
                            <div className="w-full space-y-2.5">
                                <Button
                                    onClick={() => handleRoleSelect('student_buyer')}
                                    className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)] transition-all"
                                >
                                    Log In with Email <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleGoogleLogin('student_buyer')}
                                    disabled={googleLoadingRole === 'student_buyer'}
                                    className="w-full h-12 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {googleLoadingRole === 'student_buyer' ? (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    ) : (
                                        <>
                                            <Globe className="h-4 w-4" />
                                            Google Sign-In
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* ─── Seller Card ────────────────────────────────────────── */}
                        <div className="bg-secondary border border-border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm relative overflow-hidden">
                            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4">
                                <Briefcase className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-5">Sell on Campus</p>
                            
                            <div className="w-full space-y-2.5">
                                <Button
                                    onClick={() => handleRoleSelect('student_seller')}
                                    className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)] transition-all"
                                >
                                    Log In with Email <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleGoogleLogin('student_seller')}
                                    disabled={googleLoadingRole === 'student_seller'}
                                    className="w-full h-12 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {googleLoadingRole === 'student_seller' ? (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    ) : (
                                        <>
                                            <Globe className="h-4 w-4" />
                                            School Google Sign-In
                                        </>
                                    )}
                                </Button>
                                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                    Use your school email
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 mt-6 border-t border-border">
                        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                            No account?{' '}
                            <Link href="/signup" className="text-primary font-black ml-2 hover:opacity-80">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 2: Credentials Form ───────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-background text-foreground relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="w-full max-w-lg glass-card bg-card/80 border border-border shadow-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep('role')}
                            className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest px-0"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </div>
                    
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                        Log <span className="text-primary">In</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                        {role === 'student_seller' ? 'Seller credentials' : 'Enter your credentials'}
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-destructive text-[10px] font-bold uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <UserIcon className="h-4 w-4" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoFocus
                                placeholder="you@address.com"
                                className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-1">Password</label>
                            <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all pr-1">
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full h-16 pl-14 pr-16 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-16 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-6 w-6" />
                            ) : (
                                <>
                                    Log In <ArrowRight className="ml-4 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="relative py-8 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-border" />
                    <span className="relative bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Or</span>
                </div>

                <Button
                    type="button"
                    onClick={() => handleGoogleLogin(role)}
                    disabled={googleLoadingRole !== null}
                    className="w-full h-16 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                    {googleLoadingRole ? <Loader2 className="animate-spin h-5 w-5" /> : (
                        <>
                            <Globe className="h-5 w-5" />
                            {role === 'student_seller' ? 'School Google Sign-In' : 'Google Sign-In'}
                        </>
                    )}
                </Button>

            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
