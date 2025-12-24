'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Access Code State
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [targetRole, setTargetRole] = useState<'admin' | 'ceo' | null>(null);
    const [accessCode, setAccessCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let emailToUse = formData.email;

            // simple check: if no '@', assume it's a phone number
            if (!emailToUse.includes('@')) {
                const cleanPhone = emailToUse.replace(/\D/g, '');
                if (cleanPhone.length < 5) { // Basic length check
                    throw new Error("Invalid phone number format");
                }
                emailToUse = `phone-${cleanPhone}@marketbridge.local`;
            }

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password: formData.password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
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
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (signInError) throw signInError;
        } catch (err: any) {
            console.error(err);
            setError('Failed to sign in with Google');
            setIsLoading(false);
        }
    };

    const initiateExecutiveLogin = (role: 'admin' | 'ceo') => {
        setTargetRole(role);
        setAccessCode('');
        setError('');
        setShowCodeInput(true);
    };

    const verifyAccessCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (targetRole === 'admin') {
            if (accessCode === '1029384756') {
                router.push('/admin/login');
            } else {
                setError('Invalid Administrator Access Code');
            }
        } else if (targetRole === 'ceo') {
            if (accessCode === '244466666') {
                router.push('/ceo/login');
            } else {
                setError('Invalid Executive Access Code');
            }
        }
    };

    if (showCodeInput) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 font-sans">
                <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
                    <CardHeader className="space-y-1 pb-8 text-center">
                        <CardTitle className="text-xl font-bold uppercase tracking-widest text-white">
                            Restricted Access
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-mono text-xs">
                            Enter security clearance for {targetRole === 'admin' ? 'Mission Control' : 'Vision Command'}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-mono text-center">
                                {error}
                            </div>
                        )}
                        <form onSubmit={verifyAccessCode} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500 uppercase font-black tracking-widest">Access Code</Label>
                                <Input
                                    type="password"
                                    className="bg-slate-950 border-slate-800 text-center tracking-[0.5em] font-mono text-lg"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="••••••••••"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setShowCodeInput(false);
                                        setTargetRole(null);
                                    }}
                                    className="border border-slate-700 hover:bg-slate-800 text-slate-400"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold">
                                    Verify
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                    <CardDescription className="text-center">
                        Log in to your MarketBridge account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Sign in with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email or Phone Number</Label>
                            <Input
                                id="email"
                                name="email"
                                type="text"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Email or Phone Number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Log in'}
                        </Button>
                    </form>

                    <div className="pt-6 border-t mt-6">
                        <p className="text-center text-xs font-bold uppercase text-muted-foreground mb-4 tracking-widest">Staff & Executive Login</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" size="sm" onClick={() => initiateExecutiveLogin('admin')} className="text-xs">
                                Mission Control
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => initiateExecutiveLogin('ceo')} className="text-xs">
                                Vision Command
                            </Button>
                        </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground pt-4">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
