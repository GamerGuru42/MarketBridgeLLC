'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ChevronRight } from 'lucide-react';
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
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950">
                <Card className="w-full max-w-sm bg-slate-900 border-slate-800 text-white shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-lg font-bold uppercase tracking-widest">Restricted Area</CardTitle>
                        <CardDescription className="text-slate-500">Security check for {targetRole?.toUpperCase()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && <div className="text-red-500 text-xs text-center font-bold tracking-widest">{error}</div>}
                        <form onSubmit={verifyAccessCode} className="space-y-6">
                            <Input
                                type="password"
                                className="bg-black border-zinc-800 text-center tracking-[0.4em] font-mono"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••••"
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <Button variant="ghost" onClick={() => setShowCodeInput(false)} className="flex-1">Back</Button>
                                <Button type="submit" className="flex-1">Verify</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-50 relative">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-black text-center italic uppercase tracking-tighter">MarketBridge Login</CardTitle>
                    <CardDescription className="text-center font-medium">Access your automotive portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-sm text-center font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Identity Identifier</Label>
                            <Input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="email@example.com"
                                className="h-12 border-slate-200 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Signature Key</Label>
                                <Link href="/forgot-password" size="sm" className="text-[10px] uppercase font-bold text-primary hover:underline">Reset</Link>
                            </div>
                            <div className="relative">
                                <Input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="h-12 border-slate-200 pr-12 focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg font-bold group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <div className="flex items-center gap-2">
                                    Authenticate Session
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-slate-400">Security Layer</span>
                    </div>

                    <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-11 font-bold border-slate-200 hover:bg-slate-50">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        Sign in with Google
                    </Button>

                    <p className="text-center text-sm font-medium text-slate-600">
                        New here? <Link href="/signup" className="text-primary hover:underline font-bold">Establish Account</Link>
                    </p>

                    <div className="pt-4 border-t flex flex-col items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Executive Portals</p>
                        <div className="flex gap-4">
                            <button onClick={() => { setTargetRole('admin'); setShowCodeInput(true); }} className="text-[9px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest">Admin</button>
                            <button onClick={() => { setTargetRole('ceo'); setShowCodeInput(true); }} className="text-[9px] font-bold text-slate-500 hover:text-[#d4af37] transition-colors uppercase tracking-widest">CEO</button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
