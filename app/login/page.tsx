'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ChevronRight, Lock, User, Globe, ArrowLeft, Briefcase, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';

export default function LoginPage() {
    const { signInWithGoogle, refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect');

    // State
    const [step, setStep] = useState<'role' | 'login' | 'admin-code'>('role');
    const [role, setRole] = useState<'student_buyer' | 'student_seller' | 'admin' | 'customer' | 'dealer' | 'ceo'>('student_buyer');
    const [accessCode, setAccessCode] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-redirect if already logged in (handles Google Auth return)
    useEffect(() => {
        if (!loading && sessionUser && user) {
            if (redirectUrl) {
                router.push(redirectUrl);
                return;
            }
            // Check if user is trying to login to a different role than they have
            // Or just redirect them to their dashboard
            if (['dealer', 'student_seller'].includes(user.role)) {
                router.push('/seller/dashboard');
            } else if (user.role === 'ceo') {
                router.push('/admin/ceo');
            } else if (user.role === 'cofounder') {
                router.push('/cofounder');
            } else if (user.role === 'cto') {
                router.push('/cto');
            } else if (user.role === 'coo') {
                router.push('/coo');
            } else if (user.role === 'technical_admin') {
                router.push('/admin/technical');
            } else if (user.role === 'operations_admin') {
                router.push('/admin/operations');
            } else if (user.role === 'marketing_admin') {
                router.push('/admin/marketing');
            } else if (user.role === 'admin') {
                router.push('/admin');
            }
            else {
                router.push('/listings');
            }
        }
    }, [user, sessionUser, loading, router]);

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
        // Updated secure signature
        const validCodes = ['marketbridge2026', '1029384756', 'MB-FOUNDER-99', 'MB-TECH-2024', 'MB-OPS-2024', 'MB-MKT-2024'];

        if (validCodes.includes(accessCode)) {
            setStep('login');
            setError('');
        } else {
            setError('Access Denied: Invalid Security Signature');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const emailToUse = normalizeIdentifier(formData.email);

            // 1. Race execution against a 15-second timeout
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
                // 2. Successful Auth - Keep loading true while we redirect
                // Don't setIsLoading(false) here to prevent UI flicker

                // Refresh context
                try {
                    await refreshUser(data.user.id);
                } catch (err) {
                    console.warn("Context refresh warning:", err); // Non-fatal
                }

                // 3. Determine Role with Database Fallback
                let userRole = data.user.user_metadata?.role;

                try {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();

                    if (profile?.role) userRole = profile.role;
                } catch {
                    // Fallback to metadata if DB read fails
                }

                // 4. Hard Redirect
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else if (['dealer', 'student_seller'].includes(userRole)) {
                    window.location.href = '/seller/dashboard';
                } else if (userRole === 'ceo') {
                    window.location.href = '/admin/ceo';
                } else if (userRole === 'cofounder') {
                    window.location.href = '/cofounder';
                } else if (userRole === 'cto') {
                    window.location.href = '/cto';
                } else if (userRole === 'coo') {
                    window.location.href = '/coo';
                } else if (userRole === 'technical_admin') {
                    window.location.href = '/admin/technical';
                } else if (userRole === 'operations_admin') {
                    window.location.href = '/admin/operations';
                } else if (userRole === 'marketing_admin') {
                    window.location.href = '/admin/marketing';
                } else if (userRole === 'admin') {
                    window.location.href = '/admin';
                }
                else {
                    window.location.href = '/listings';
                }

                // Return here so we don't trigger the "finally" block that stops loading
                return;
            } else {
                throw new Error("No user session created.");
            }
        } catch (err: unknown) {
            console.error('Login Error:', err);
            let message = 'Login failed. Check credentials.';
            if (err instanceof Error) {
                if (err.message.includes("Invalid login credentials")) message = "Incorrect credentials. Please try again.";
                else if (err.message.includes("timeout")) message = "Network timeout. Slow connection detected.";
                else message = err.message;
            }
            setError(message);
            setIsLoading(false); // Only stop loading on error
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Redirect back to login page to trigger the new auto-redirect logic
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=/login`);
        } catch (err: unknown) {
            console.error(err);
            setError('Google sign-in failed.');
            setIsLoading(false);
        }
    };

    // UI Renders
    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden relative">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF6200]/5 blur-[120px] rounded-full" />

                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-white/40 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic mb-4">Welcome Back</h1>
                        <p className="text-[#FF6200] font-medium uppercase tracking-[0.2em] text-[10px]">Select account type to continue</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 max-w-6xl mx-auto">
                        {[
                            { id: 'student_buyer', title: 'Buyer', icon: User, desc: 'Student Account', color: 'text-white' },
                            { id: 'student_seller', title: 'Seller', icon: Briefcase, desc: 'Business Account', color: 'text-[#FF6200]' },
                            { id: 'admin', title: 'Staff Admin', icon: ShieldCheck, desc: 'Management Access', color: 'text-white' },
                            { id: 'ceo', title: 'Executive', icon: Lock, desc: 'Full Access', color: 'text-[#FF6200]' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className={`glass-card border-white/10 rounded-[2rem] p-8 text-center group cursor-pointer hover:bg-white/[0.08] hover:translate-y-[-8px] transition-all duration-500 ${item.id === 'ceo' ? 'border-[#FF6200]/50' : ''}`}
                                onClick={() => handleRoleSelect(item.id as any)}
                            >
                                <div className={`h-16 w-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${item.id === 'ceo' ? 'bg-[#FF6200]/10' : ''}`}>
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">{item.title}</h3>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'admin-code') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-[#FF6200]/50 shadow-[0_0_20px_#FF6200]" />
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-white/30 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="mx-auto h-16 w-16 rounded-2xl border border-[#FF6200]/30 bg-[#FF6200]/5 flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-[#FF6200]" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-[#FF6200]">Restricted</CardTitle>
                        <CardDescription className="text-white font-medium uppercase tracking-widest text-[10px]">Enter access key</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        {error && <div className="bg-[#FF6200]/10 text-white text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-[#FF6200]/20">{error}</div>}
                        <form onSubmit={handleAdminCodeSubmit} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-black border border-white/5 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 text-[#FF6200]"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                                required
                            />
                            <Button type="submit" className="w-full h-16 rounded-2xl bg-[#FF6200] text-black font-black uppercase tracking-widest hover:bg-[#FF7A29] shadow-[0_0_30px_rgba(255,98,0,0.3)]">
                                Authorize
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
            <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white relative z-10">
                <CardHeader className="p-0 mb-10 text-center">
                    <Button variant="ghost" onClick={() => setStep('role')} className="text-white/30 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Switch Role</Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter">MarketBridge</CardTitle>
                    <CardDescription className="text-white font-medium uppercase tracking-widest text-[10px]">
                        {role === 'admin' ? 'Secure Admin Login' : 'Secure Account Login'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-8">
                    {error && (
                        <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl text-center border-2 border-[#FF6200]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white ml-2">Email Address</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                <input
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={role === 'admin' ? "admin@marketbridge.io" : "user@example.com / phone"}
                                    className="w-full h-16 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-white">Password</label>
                                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:opacity-80 transition-opacity">Reset Key</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-16 pl-14 pr-16 bg-black border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-16 bg-orange-gradient text-black font-black uppercase tracking-widest rounded-2xl glow-on-hover border-none flex items-center justify-center gap-2 group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                <>
                                    Login
                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {role === 'student_buyer' && (
                        <>
                            <div className="relative py-4 flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-white/10"></div>
                                <span className="relative bg-black px-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6200]">Social Login</span>
                            </div>

                            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-14 bg-transparent border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all">
                                <Globe className="mr-3 h-5 w-5" />
                                Google Login
                            </Button>
                        </>
                    )}

                    <p className="text-center text-white text-xs font-bold uppercase tracking-widest">
                        New here? <Link href="/signup" className="text-[#FF6200] hover:opacity-80 transition-opacity italic ml-1 underline decoration-dotted">Register Account</Link>
                    </p>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                            Beta platform – technical problems? Email <a href="mailto:support@marketbridge.com.ng?subject=Tech%20Support" className="text-[#FF6200] hover:underline">support@marketbridge.com.ng</a><br />
                            Refunds, subscriptions or seller questions? Email <a href="mailto:ops-support@marketbridge.com.ng?subject=Ops%20Support" className="text-[#FF6200] hover:underline">ops-support@marketbridge.com.ng</a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
