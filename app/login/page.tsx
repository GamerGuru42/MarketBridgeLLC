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
                        .select('role, isVerified')
                        .eq('id', data.user.id)
                        .single();

                    if (profile?.role) userRole = profile.role;
                    if (profile?.isVerified) isVerified = profile.isVerified;
                } catch {
                }

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else if (['dealer', 'student_seller', 'seller'].includes(userRole)) {
                    if (isVerified) {
                        window.location.href = '/seller/dashboard';
                    } else {
                        window.location.href = '/seller-onboard';
                    }
                } else if (userRole === 'ceo') {
                    window.location.href = '/admin/ceo';
                } else if (['admin', 'technical_admin', 'operations_admin'].includes(userRole)) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/marketplace';
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
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] relative overflow-hidden">
                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 mb-6 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900 mb-4">Welcome Back</h1>
                        <p className="text-[#FF6200] font-bold uppercase tracking-[0.2em] text-[10px]">Select account type to continue</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-6xl mx-auto">
                        {[
                            { id: 'student_buyer', title: 'Buyer', icon: UserIcon, desc: 'Student Account', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/50' },
                            { id: 'student_seller', title: 'Seller', icon: Briefcase, desc: 'Business Account', color: 'text-[#FF6200]', bg: 'bg-[#FF6200]/10', border: 'hover:border-[#FF6200]/50' },
                            { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Management Access', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/50' },
                            { id: 'ceo', title: 'Executive', icon: Lock, desc: 'Full Access', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/50' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className={`bg-white border-zinc-200 rounded-[2rem] p-8 text-center cursor-pointer hover:shadow-xl transition-all duration-300 ${item.border}`}
                                onClick={() => handleRoleSelect(item.id as any)}
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
                            New here? <Link href="/signup" className="text-[#FF6200] font-bold hover:underline">Register Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'admin-code') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA]">
                <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-500 hover:text-zinc-900 mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-[#FF6200]/10 flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-[#FF6200]" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter mb-2 text-zinc-900">Restricted</CardTitle>
                        <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Enter access key</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        {error && <div className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-100">{error}</div>}
                        <form onSubmit={handleAdminCodeSubmit} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-zinc-50 border border-zinc-200 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 text-zinc-900"
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAFA] relative">
            <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-500 hover:text-zinc-900 mb-4 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Switch Role</Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-zinc-900">MarketBridge</CardTitle>
                    <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                        {role === 'admin' ? 'Secure Admin Login' : 'Secure Account Login'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-2">Email Address</label>
                            <div className="relative">
                                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={role === 'admin' ? "admin@marketbridge.io" : "user@example.com"}
                                    className="w-full h-14 pl-14 pr-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Password</label>
                                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:underline">Reset Key</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-14 pr-16 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
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
                                <div className="absolute inset-x-0 h-px bg-zinc-200"></div>
                                <span className="relative bg-white px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Social Login</span>
                            </div>

                            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-14 bg-white border-zinc-200 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-50 transition-all shadow-sm">
                                <Globe className="mr-3 h-5 w-5 text-[#FF6200]" />
                                Google Login
                            </Button>
                        </>
                    )}

                    <p className="text-center text-zinc-600 text-xs font-semibold mt-6">
                        New here? <Link href="/signup" className="text-[#FF6200] hover:underline">Register Account</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
