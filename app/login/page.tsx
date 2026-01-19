'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ChevronRight, Lock, User, Globe, ArrowLeft, Briefcase, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';

export default function LoginPage() {
    const { signInWithGoogle, refreshUser } = useAuth();
    const router = useRouter();

    // State
    const [step, setStep] = useState<'role' | 'login' | 'admin-code'>('role');
    const [role, setRole] = useState<'customer' | 'dealer' | 'admin'>('customer');
    const [accessCode, setAccessCode] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRoleSelect = (selectedRole: 'customer' | 'dealer' | 'admin') => {
        setRole(selectedRole);
        setError('');
        if (selectedRole === 'admin') {
            setStep('admin-code');
        } else {
            setStep('login');
        }
    };

    const handleAdminCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessCode === '1029384756') {
            setStep('login');
            setError('');
        } else {
            setError('INVALID ACCESS CREDENTIALS');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const emailToUse = normalizeIdentifier(formData.email);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password: formData.password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                await refreshUser(data.user.id);

                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = profile?.role || data.user.user_metadata?.role;

                if (role === 'dealer') {
                    router.push('/dealer/dashboard');
                } else if (role === 'technical_admin') {
                    router.push('/admin/technical');
                } else if (role === 'operations_admin') {
                    router.push('/admin/operations');
                } else if (role === 'marketing_admin') {
                    router.push('/admin/marketing');
                } else if (role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/listings');
                }
            }
        } catch (err: unknown) {
            console.error('Login Error:', err);
            const message = err instanceof Error ? err.message : 'Login failed. Check credentials.';
            setError(message);
            setIsLoading(false);
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
            await signInWithGoogle();
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
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFB800]/5 blur-[120px] rounded-full" />

                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic mb-4">Welcome Back</h1>
                        <p className="text-zinc-500 font-medium lowercase italic">select your terminal to continue</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-4xl mx-auto">
                        {[
                            { id: 'customer', title: 'Customer', icon: User, desc: 'Personal Account', color: 'text-blue-400' },
                            { id: 'dealer', title: 'Dealer', icon: Briefcase, desc: 'Business Terminal', color: 'text-[#FFB800]' },
                            { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Secure Gateway', color: 'text-red-400' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className="glass-card border-white/5 rounded-[2rem] p-8 text-center group cursor-pointer hover:bg-white/[0.08] hover:translate-y-[-8px] transition-all duration-500"
                                onClick={() => handleRoleSelect(item.id as 'customer' | 'dealer' | 'admin')}
                            >
                                <div className="h-16 w-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">{item.title}</h3>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
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
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/50 shadow-[0_0_20px_red]" />
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-600 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="mx-auto h-16 w-16 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-red-500">Restricted</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">enter administrative access key</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        {error && <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-500/20">{error}</div>}
                        <form onSubmit={handleAdminCodeSubmit} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-black border border-white/5 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-red-500"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                                required
                            />
                            <Button type="submit" className="w-full h-16 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
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
            <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-[#FF8A00]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white relative z-10">
                <CardHeader className="p-0 mb-10 text-center">
                    <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-600 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Switch Role</Button>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter">MarketBridge</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium italic lowercase">
                        {role === 'admin' ? 'Secure Admin Login' : 'Initiate secure session terminal'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-8">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl text-center border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Identity Identifier</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={role === 'admin' ? "admin@marketbridge.io" : "user@example.com"}
                                    className="w-full h-16 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Security Signature</label>
                                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] hover:opacity-80 transition-opacity">Reset Key</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-16 pl-14 pr-16 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-16 bg-gold-gradient text-black font-black uppercase tracking-widest rounded-2xl glow-on-hover border-none flex items-center justify-center gap-2 group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                <>
                                    Establish Link
                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {role !== 'admin' && (
                        <>
                            <div className="relative py-4 flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-white/5"></div>
                                <span className="relative bg-zinc-950 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">Protocol Selection</span>
                            </div>

                            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-14 bg-transparent border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all">
                                <Globe className="mr-3 h-5 w-5" />
                                Google Cloud Login
                            </Button>
                        </>
                    )}

                    <p className="text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        Unauthorized? <Link href="/signup" className="text-[#FFB800] hover:opacity-80 transition-opacity italic ml-1 underline decoration-dotted">Register Identity</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
