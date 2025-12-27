'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ChevronRight, Lock, User, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const { signInWithGoogle, refreshUser } = useAuth();
    const router = useRouter();

    // State
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Executive Code Logic
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [targetRole, setTargetRole] = useState<'admin' | 'ceo' | null>(null);
    const [accessCode, setAccessCode] = useState('');

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

                // Fetch profile to see if it's a dealer or executive
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = profile?.role || data.user.user_metadata?.role;

                if (role === 'dealer') {
                    router.push('/dealer/dashboard');
                } else if (['ceo', 'cofounder'].includes(role || '')) {
                    router.push('/ceo');
                } else if (['admin', 'technical_admin', 'operations_admin', 'marketing_admin'].includes(role || '')) {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            }
        } catch (err: any) {
            console.error('Login Error:', err);
            setError(err.message || 'Login failed. Check credentials.');
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
        } catch (err: any) {
            console.error(err);
            setError('Google sign-in failed.');
            setIsLoading(false);
        }
    };

    const verifyAccessCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetRole === 'admin' && accessCode === '1029384756') {
            router.push('/admin/login');
        } else if (targetRole === 'ceo' && accessCode === '244466666') {
            router.push('/ceo/login');
        } else {
            setError('Invalid access code.');
        }
    };

    if (showCodeInput) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />

                <Card className="w-full max-w-md glass-card border-none rounded-[2.5rem] p-8 text-white relative z-10">
                    <CardHeader className="text-center p-0 mb-8">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Lock className="text-red-500 h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Restricted Access</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium lowercase italic">Security check for {targetRole} terminal</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {error && <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center mb-6">{error}</div>}
                        <form onSubmit={verifyAccessCode} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-black border border-white/10 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-[#FFB800]"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                                required
                            />
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setShowCodeInput(false)} className="flex-1 h-14 rounded-2xl border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/5">Back</Button>
                                <Button type="submit" className="flex-1 h-14 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700">Verify</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
            {/* Background blobs */}
            <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-[#FF8A00]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white relative z-10">
                <CardHeader className="p-0 mb-10 text-center">
                    <div className="mx-auto w-20 h-20 bg-gold-gradient rounded-3xl flex items-center justify-center mb-6 transform rotate-12 shadow-[0_0_30px_rgba(255,184,0,0.2)]">
                        <Lock className="h-10 w-10 text-black shadow-inner" />
                    </div>
                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter">MarketBridge</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium italic lowercase">Initiate secure session terminal</CardDescription>
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
                                    placeholder="founder@example.com"
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

                    <div className="relative py-4 flex items-center justify-center">
                        <div className="absolute inset-x-0 h-px bg-white/5"></div>
                        <span className="relative bg-zinc-950 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">Protocol Selection</span>
                    </div>

                    <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-14 bg-transparent border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all">
                        <Globe className="mr-3 h-5 w-5" />
                        Google Cloud Login
                    </Button>

                    <p className="text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        Unauthorized? <Link href="/signup" className="text-[#FFB800] hover:opacity-80 transition-opacity italic ml-1 underline decoration-dotted">Register Identity</Link>
                    </p>

                    <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800">Restricted Executive Pipes</p>
                        <div className="flex gap-8">
                            <button onClick={() => { setTargetRole('admin'); setShowCodeInput(true); }} className="text-[10px] font-black text-zinc-600 hover:text-white transition-all uppercase tracking-widest italic hover:scale-110">Admin</button>
                            <button onClick={() => { setTargetRole('ceo'); setShowCodeInput(true); }} className="text-[10px] font-black text-zinc-600 hover:text-[#FFB800] transition-all uppercase tracking-widest italic hover:scale-110">CEO Control</button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
