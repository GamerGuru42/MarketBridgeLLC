'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon, Globe, AlertTriangle, ArrowRight, ArrowLeft, BookOpen, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Step = 'role' | 'buyer-credentials' | 'seller-google';
type Role = 'buyer' | 'seller';

function LoginContent() {
    const supabase = createClient();
    const { signInWithGoogle, refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || searchParams?.get('next');

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('buyer');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoadingRole, setGoogleLoadingRole] = useState<Role | null>(null);
    const [expandedRole, setExpandedRole] = useState<Role | null>(null);
    const [error, setError] = useState('');
    const [requireCaptcha, setRequireCaptcha] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        if (!loading && sessionUser && user) {
            const dest = redirectUrl || getRoleDestination(user.role);
            router.replace(dest);
        }
    }, [user, sessionUser, loading, router, redirectUrl]);

    useEffect(() => {
        const emailParam = searchParams?.get('email');
        if (emailParam) { setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) })); setCurrentStep('buyer-credentials'); }
        const roleParam = searchParams?.get('role');
        if (roleParam === 'seller' || roleParam === 'student_seller') { setRole('seller'); setCurrentStep('seller-google'); }
        else if (roleParam === 'buyer' || roleParam === 'student_buyer') { setRole('buyer'); setCurrentStep('buyer-credentials'); }
    }, [searchParams]);

    function getRoleDestination(r: string) {
        if (r === 'ceo') return '/admin/ceo';
        if (r === 'operations_admin') return '/admin/operations';
        if (r === 'marketing_admin') return '/admin/marketing';
        if (r === 'systems_admin' || r === 'technical_admin') return '/admin/systems';
        if (r === 'it_support') return '/admin/it-support';
        if (['admin'].includes(r)) return '/admin';
        if (r === 'student_seller') return '/seller/dashboard';
        return '/marketplace';
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); if (error) setError(''); };

    const handleGoogleLogin = async (selectedRole: Role) => {
        setGoogleLoadingRole(selectedRole);
        setError('');
        try {
            const mappedRole = selectedRole === 'seller' ? 'student_seller' : 'student_buyer';
            const next = redirectUrl || (selectedRole === 'seller' ? '/seller/dashboard' : '/marketplace');
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${mappedRole}&next=${next}`);
        } catch (err: any) { setError(err.message || 'Google Sign-In failed.'); setGoogleLoadingRole(null); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const emailToUse = normalizeIdentifier(formData.email);
            const { data: userRecord } = await supabase.from('users').select('id, login_attempts, locked_until').eq('email', emailToUse).maybeSingle();
            if (userRecord?.locked_until) {
                const lockTime = new Date(userRecord.locked_until).getTime();
                if (Date.now() < lockTime) { setError(`Account locked. Try again in ${Math.ceil((lockTime - Date.now()) / 60000)} minutes.`); setIsLoading(false); return; }
            }
            const loginPromise = supabase.auth.signInWithPassword({ email: emailToUse, password: formData.password });
            const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timed out.')), 8000));
            const { data, error: signInError } = await Promise.race([loginPromise, timeoutPromise as any]);

            if (signInError) {
                const msg = signInError.message?.toLowerCase() ?? '';
                if (userRecord && (msg.includes('invalid login') || msg.includes('invalid credentials'))) {
                    const attemptsCount = (userRecord.login_attempts || 0) + 1;
                    let updates: any = { login_attempts: attemptsCount };
                    if (attemptsCount >= 5) { updates.locked_until = new Date(Date.now() + 15 * 60000).toISOString(); setError('Account locked for 15 minutes.'); }
                    else if (attemptsCount >= 3) { setRequireCaptcha(true); setError('Incorrect email or password.'); }
                    else { setError('Incorrect email or password.'); }
                    await supabase.from('users').update(updates).eq('email', emailToUse);
                } else if (msg.includes('email not confirmed')) { setError('Please verify your email first.'); }
                else { setError(signInError.message || 'Login failed.'); }
                return;
            }
            if (userRecord?.login_attempts && userRecord.login_attempts > 0) { await supabase.from('users').update({ login_attempts: 0, locked_until: null }).eq('email', emailToUse); }
            if (!data?.user) { setError('Login failed.'); return; }

            let userRole = data.user.user_metadata?.role as string;
            const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
            if (!profile) {
                const meta = data.user.user_metadata || {};
                const healedRole = meta.role || 'student_buyer';
                await supabase.from('users').upsert({ id: data.user.id, email: data.user.email ?? '', display_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || data.user.email?.split('@')[0] || 'User', role: healedRole, email_verified: !!data.user.email_confirmed_at, is_verified: false, is_verified_seller: false, coins_balance: healedRole === 'student_buyer' ? 100 : 0 }, { onConflict: 'id' });
                userRole = healedRole;
            } else { userRole = profile.role || userRole; }
            refreshUser(data.user.id).catch(err => console.warn('Context sync error:', err));
            router.replace(redirectUrl || getRoleDestination(userRole));
        } catch (err: any) { setError(err.message || 'Login failed.'); }
        finally { setIsLoading(false); }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>;
    }

    // ─── STEP 1: Role Selector ────────────────────────────────────────────────
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
                <div className="w-full max-w-2xl relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-6 md:p-10 lg:p-14 shadow-2xl">
                    <div className="text-center mb-10 space-y-4">
                        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                            Log <span className="text-orange-500">In</span>
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] italic">Select your account type</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:px-4">
                        {/* Buyer Card */}
                        <div onClick={() => setExpandedRole(expandedRole === 'buyer' ? null : 'buyer')}
                            className={cn("bg-[#2a2a2a] border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm cursor-pointer transition-all duration-300",
                                expandedRole === 'buyer' ? "border-orange-500/50 ring-1 ring-orange-500/20 scale-[1.02]" : "border-[#3a3a3a] hover:border-orange-500/30")}>
                            <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-4"><UserIcon className="h-6 w-6 text-gray-400" /></div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-2">Shop & Browse</p>
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'buyer' ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button onClick={(e) => { e.stopPropagation(); setRole('buyer'); setCurrentStep('buyer-credentials'); }}
                                    className="w-full h-12 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)]">
                                    Log In with Email <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button type="button" onClick={(e) => { e.stopPropagation(); handleGoogleLogin('buyer'); }} disabled={googleLoadingRole === 'buyer'}
                                    className="w-full h-12 bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2">
                                    {googleLoadingRole === 'buyer' ? <Loader2 className="animate-spin h-4 w-4" /> : <><Globe className="h-4 w-4" /> Google Sign-In</>}
                                </Button>
                            </div>
                        </div>

                        {/* Seller Card */}
                        <div onClick={() => setExpandedRole(expandedRole === 'seller' ? null : 'seller')}
                            className={cn("bg-[#2a2a2a] border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer transition-all duration-300",
                                expandedRole === 'seller' ? "border-orange-500/50 ring-1 ring-orange-500/20 scale-[1.02]" : "border-[#3a3a3a] hover:border-orange-500/30")}>
                            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-4"><BookOpen className="h-6 w-6 text-gray-400" /></div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-2">Sell on Campus</p>
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'seller' ? "max-h-56 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button type="button" onClick={(e) => { e.stopPropagation(); handleGoogleLogin('seller'); }} disabled={googleLoadingRole === 'seller'}
                                    className="w-full h-14 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,98,0,0.25)]">
                                    {googleLoadingRole === 'seller' ? <Loader2 className="animate-spin h-4 w-4" /> : <><Globe className="h-4 w-4" /> School Google Sign-In</>}
                                </Button>
                                <p className="text-[7.5px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed mt-4 px-2">
                                    Sellers sign in securely with their verified university account. No account?{' '}
                                    <Link href="/signup?role=seller" className="text-orange-500 hover:underline" onClick={e => e.stopPropagation()}>Sign Up as Seller</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 mt-6 border-t border-[#2a2a2a]">
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                            No account?{' '}<Link href="/signup" className="text-orange-500 font-black ml-2 hover:opacity-80">Sign Up</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 2b: Seller Google-Only ──────────────────────────────────────────
    if (currentStep === 'seller-google') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
                <div className="w-full max-w-lg relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-6 md:p-10 lg:p-14 shadow-2xl">
                    <div className="text-center mb-10 space-y-4">
                        <Button variant="ghost" onClick={() => setCurrentStep('role')} className="text-gray-400 hover:text-white uppercase text-[10px] font-black tracking-widest px-0 mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic leading-none">
                            Seller <span className="text-orange-500">Sign In</span>
                        </h1>
                        <p className="text-gray-400 font-bold text-[10px] leading-relaxed max-w-sm mx-auto">
                            Sellers sign in securely with their verified university Google account.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <Button type="button" onClick={() => handleGoogleLogin('seller')} disabled={googleLoadingRole !== null}
                        className="w-full h-16 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] flex items-center justify-center gap-3 mb-6">
                        {googleLoadingRole ? <Loader2 className="animate-spin h-5 w-5" /> : <><Globe className="h-5 w-5" /> Sign In with Google</>}
                    </Button>

                    <div className="text-center">
                        <p className="text-gray-500 text-[9px] font-bold">
                            No account? <Link href="/signup" className="text-orange-500 hover:underline">Sign Up as Seller</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 2a: Buyer Credentials Form ──────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="w-full max-w-lg relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-6 md:p-10 lg:p-14 shadow-2xl">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Button variant="ghost" onClick={() => setCurrentStep('role')} className="text-gray-400 hover:text-white uppercase text-[10px] font-black tracking-widest px-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                        Log <span className="text-orange-500">In</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] italic">Enter your credentials</p>
                </div>

                <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-orange-500 font-black uppercase text-[10px] tracking-widest mb-1 italic">🚀 Private Beta Mode Active</h4>
                        <p className="text-orange-500/80 text-[10px] font-bold leading-relaxed">No real transactions or money will be processed during this beta phase.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 ml-2">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><UserIcon className="h-4 w-4" /></div>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required autoFocus placeholder="you@address.com"
                                className="w-full h-16 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 ml-1">Password</label>
                            <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:opacity-80 pr-1">Forgot Password?</Link>
                        </div>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><Lock className="h-4 w-4" /></div>
                            <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required placeholder="••••••••"
                                className="w-full h-16 pl-14 pr-16 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="remember" className="rounded bg-[#2a2a2a] text-orange-500 cursor-pointer w-4 h-4 border-0" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                        <label htmlFor="remember" className="text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer">Remember Me</label>
                    </div>
                    <div className="pt-4">
                        <Button type="submit" className="w-full h-16 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] flex items-center justify-center" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <>Log In <ArrowRight className="ml-4 h-5 w-5" /></>}
                        </Button>
                    </div>
                </form>

                <div className="relative py-8 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-[#2a2a2a]" />
                    <span className="relative bg-[#1a1a1a] px-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Or</span>
                </div>

                <Button type="button" onClick={() => handleGoogleLogin(role)} disabled={googleLoadingRole !== null}
                    className="w-full h-16 bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3">
                    {googleLoadingRole ? <Loader2 className="animate-spin h-5 w-5" /> : <><Globe className="h-5 w-5" /> Google Sign-In</>}
                </Button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-orange-500" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
