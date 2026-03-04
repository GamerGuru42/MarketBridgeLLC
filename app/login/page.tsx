'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ChevronRight, Lock, User as UserIcon, Globe, ArrowLeft, Briefcase, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';

export default function LoginPage() {
    const supabase = createClient();
    const { signInWithGoogle, refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect');

    const [step, setStep] = useState<'role' | 'login' | 'admin-code'>('role');
    const [role, setRole] = useState<'student_buyer' | 'student_seller' | 'admin' | 'ceo'>('student_buyer');
    const [accessCode, setAccessCode] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && sessionUser && user) {
            if (redirectUrl) {
                router.push(redirectUrl);
                return;
            }
            if (['dealer', 'student_seller', 'seller'].includes(user.role)) {
                if (user.isVerified) {
                    router.push('/seller/dashboard');
                } else {
                    router.push('/seller-onboard');
                }
            } else if (user.role === 'ceo') {
                router.push('/admin/ceo');
            } else if (['admin', 'technical_admin', 'operations_admin'].includes(user.role)) {
                router.push('/admin');
            } else {
                router.push('/marketplace');
            }
        }
    }, [user, sessionUser, loading, router, redirectUrl]);

    const handleRoleSelect = (selectedRole: 'student_buyer' | 'student_seller' | 'admin' | 'ceo') => {
        setRole(selectedRole);
        setError('');
        if (selectedRole === 'admin' || selectedRole === 'ceo') {
            setStep('admin-code');
        } else {
            setStep('login');
        }
    };

    const handleAdminCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validCodes = ['marketbridge2026', '1029384756', 'MB-FOUNDER-99', 'MB-TECH-2024', 'MB-OPS-2024', 'MB-MKT-2024'];

        if (validCodes.includes(accessCode)) {
            setStep('login');
            setError('');
        } else {
            setError('Access Denied: Invalid Security Signature');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=/marketplace`);
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Login failed. Please check your connection.');
            setIsLoading(false);
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

            const timeoutPromise = new Promise<{ data: { user: null; session: null }; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error("Connection timed out. Please check your network.")), 15000)
            );

            const { data, error: signInError } = await Promise.race([loginPromise, timeoutPromise]);

            if (signInError) throw signInError;

            if (data?.user) {
                try {
                    await refreshUser(data.user.id);
                } catch (err) {
                    console.warn("Context refresh warning:", err);
                }

                let userRole = data.user.user_metadata?.role;
                let isVerified = false;

                try {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('role, is_verified, is_verified_seller')
                        .eq('id', data.user.id)
                        .single();

                    if (profile?.role) userRole = profile.role;
                    if (profile?.is_verified || profile?.is_verified_seller) isVerified = true;
                } catch {
                }

                if (redirectUrl) {
                    router.push(redirectUrl);
                } else if (['dealer', 'student_seller', 'seller'].includes(userRole)) {
                    if (isVerified) {
                        router.push('/seller/dashboard');
                    } else {
                        router.push('/seller-onboard');
                    }
                } else if (userRole === 'ceo') {
                    router.push('/admin/ceo');
                } else if (['admin', 'technical_admin', 'operations_admin'].includes(userRole)) {
                    router.push('/admin');
                } else {
                    router.push('/marketplace');
                }
            } else {
                throw new Error("Invalid response from server.");
            }

        } catch (err: any) {
            console.error('Login error:', err);
            if (err.message.includes('Invalid login credentials')) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(err.message || 'Login failed');
            }
            setIsLoading(false);
        }
    };

    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
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
                            Welcome <span className="text-[#FF6200]">Back</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Select account type to continue</p>
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

                        {/* Seller */}
                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-[#FF6200]/10 border-2 border-[#FF6200]/40 rounded-[2rem] p-8 text-center cursor-pointer hover:bg-[#FF6200]/15 hover:border-[#FF6200] transition-all duration-300 flex flex-col items-center"
                        >
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
                            New here? <Link href="/signup" className="text-[#FF6200] font-bold hover:underline">Register Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    if (step === 'admin-code') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
                <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-[#FF6200]" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Restricted</CardTitle>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Enter access key</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        {error && <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-100 dark:border-red-900/30">{error}</div>}
                        <form onSubmit={handleAdminCodeSubmit} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 text-zinc-900 dark:text-white"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                                required
                            />
                            <Button type="submit" className="w-full h-16 rounded-2xl bg-[#FF6200] text-white font-black uppercase tracking-widest hover:bg-[#FF7A29] shadow-lg">
                                Authorize
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 relative">
            <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-4 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Switch Role</Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">MarketBridge</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                        {role === 'admin' ? 'Secure Admin Login' : 'Secure Account Login'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400 ml-2">Email Address</label>
                            <div className="relative">
                                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                                <input
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={role === 'admin' ? "admin@marketbridge.io" : "user@example.com"}
                                    className="w-full h-14 pl-14 pr-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 dark:text-zinc-400">Password</label>
                                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:underline">Reset Key</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-14 pr-16 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-14 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    Login
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {role === 'student_buyer' && (
                        <>
                            <div className="relative py-4 flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                                <span className="relative bg-white dark:bg-zinc-900 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Social Login</span>
                            </div>

                            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm">
                                <Globe className="mr-3 h-5 w-5 text-[#FF6200]" />
                                Google Login
                            </Button>
                        </>
                    )}

                    <p className="text-center text-zinc-600 dark:text-zinc-400 text-xs font-semibold mt-6">
                        New here? <Link href="/signup" className="text-[#FF6200] hover:underline">Register Account</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
