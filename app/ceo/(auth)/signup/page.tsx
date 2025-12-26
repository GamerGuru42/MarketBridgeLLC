'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, Crown, ShieldAlert, Sparkles, User, Mail, Lock } from 'lucide-react';

export default function CEOSignupPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const identifier = normalizeIdentifier(formData.email);
            console.log('INITIATING FOUNDING PARTNER SETUP FOR:', identifier);

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: identifier,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        full_name: formData.displayName,
                        role: 'ceo',
                    },
                },
            });

            let activeUser = authData?.user;

            if (signUpError) {
                if (signUpError.message?.includes('User already registered') || signUpError.status === 400) {
                    console.log("CEO account exists, attempting recovery...");
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });
                    if (signInData.user) {
                        activeUser = signInData.user;
                    } else {
                        throw new Error("This email is already registered. Please use the login page.");
                    }
                } else if (signUpError.message?.includes('Database error saving new user')) {
                    console.warn("Database trigger failed, attempting recovery...");
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });
                    if (signInData.user) {
                        activeUser = signInData.user;
                    } else {
                        throw new Error("Database sync issue. Please contact technical support.");
                    }
                } else {
                    throw signUpError;
                }
            }

            if (activeUser) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    const { error: profileError } = await supabase
                        .from('users')
                        .upsert({
                            id: activeUser.id,
                            email: identifier,
                            display_name: formData.displayName,
                            role: 'ceo',
                            is_verified: true,
                        }, {
                            onConflict: 'id'
                        });

                    if (profileError) {
                        console.error('Profile creation failed:', profileError);
                    }
                } catch (upsertErr) {
                    console.error('Unexpected error during profile creation:', upsertErr);
                }

                // IMPORTANT: Refresh user profile so the app knows we are logged in
                await refreshUser();

                // Critical: Wait for AuthContext to fully update before navigation
                await new Promise(resolve => setTimeout(resolve, 500));

                router.push('/ceo');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to establish CEO profile');
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

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505]">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1300] via-black to-black pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10 pointer-events-none"></div>

            <Card className="w-full max-w-xl bg-black border-[#d4af37]/20 text-white shadow-[0_0_50px_rgba(212,175,55,0.1)] relative z-10">
                <div className="absolute -top-[1px] -left-[1px] -right-[1px] h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>

                <CardHeader className="space-y-4 pb-8 pt-12 items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <Crown className="h-10 w-10 text-black fill-black/10" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase italic text-[#d4af37]">
                            Founding Partner
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-serif italic">
                            Executive Onboarding Terminal | Abuja Automotive Market
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-10 pb-10">
                    {error && (
                        <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4 mb-6 flex items-center gap-3">
                            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-xs text-red-200 font-mono tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/60">Legal Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-700" />
                                <Input
                                    name="displayName"
                                    className="bg-zinc-950 border-zinc-800 pl-10 h-12 focus:ring-[#d4af37] focus:border-[#d4af37]"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/60">Executive Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-700" />
                                <Input
                                    name="email"
                                    type="email"
                                    className="bg-zinc-950 border-zinc-800 pl-10 h-12 focus:ring-[#d4af37]"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="ceo@marketbridge.io"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/60">Access Key</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-700" />
                                    <Input
                                        name="password"
                                        type="password"
                                        className="bg-zinc-950 border-zinc-800 pl-10 h-12 focus:ring-[#d4af37]"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        minLength={12}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/60">Confirm Key</Label>
                                <Input
                                    name="confirmPassword"
                                    type="password"
                                    className="bg-zinc-950 border-zinc-800 h-12 focus:ring-[#d4af37]"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#e5c150] hover:to-[#d4af37] text-black font-black italic h-14 text-lg shadow-[0_4px_20px_rgba(212,175,55,0.2)]" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                'INITIALIZE CEO STATUS'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center gap-6 pb-12">
                    <div className="flex flex-col items-center gap-4">
                        <Link href="/ceo/login" className="text-[10px] font-black uppercase text-[#d4af37] hover:text-[#e5c150] tracking-[0.2em] transition-colors">Existing Credentials Login</Link>
                        <Separator className="w-40 bg-zinc-800" />
                        <Link href="/" className="text-[10px] font-bold uppercase text-slate-600 hover:text-slate-400 transition-colors">MarketBridge.io Portal</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

import { Separator } from '@/components/ui/separator';
