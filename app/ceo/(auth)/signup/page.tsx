'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, Crown, Key, Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CEOSignupPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();

    // State
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            const identifier = normalizeIdentifier(formData.email);

            // 1. Create Auth User with CEO metadata
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: identifier,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        role: 'ceo',
                        is_executive: true
                    },
                },
            });

            if (signUpError) {
                if (signUpError.message?.includes('already registered')) {
                    setError('Identity detected. This email is already registered in the executive vault.');
                    setIsLoading(false);
                    return;
                }
                throw signUpError;
            }

            if (!authData.user) throw new Error('Signup failed.');

            // 2. Create Public Profile
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: identifier,
                    display_name: formData.displayName,
                    role: 'ceo',
                    is_verified: true,
                });

            if (profileError) {
                console.error('Profile error:', profileError);
                // We don't throw here as the auth user is created, but we log it
            }

            setSuccess(true);
            await refreshUser(authData.user.id);

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '/ceo';
            }, 1500);

        } catch (err: any) {
            console.error('Signup Error:', err);
            setError(err.message || 'An unexpected error occurred.');
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-4">
                <Card className="w-full max-w-md bg-zinc-950 border-[#d4af37]/20 text-center p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 rounded-full bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/30">
                            <Crown className="h-8 w-8 text-[#d4af37]" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">Welcome, Founding Partner</CardTitle>
                    <CardDescription className="text-zinc-400">Initializing your executive environment...</CardDescription>
                    <div className="mt-8 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
            {/* Background Accents */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05),transparent)] pointer-events-none"></div>

            <Card className="w-full max-w-lg bg-zinc-950 border-none shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent"></div>

                <CardHeader className="space-y-4 pt-12 pb-6 text-center">
                    <div className="mx-auto h-20 w-20 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-black shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                        <Crown className="h-10 w-10 text-[#d4af37]" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-[0.2em] uppercase italic text-white">
                            Executive Onboarding
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-serif italic text-sm">
                            MarketBridge Foundry | Founding Partner Protocol
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 mb-6 text-center space-y-3">
                            <p className="text-xs text-red-500 font-bold uppercase tracking-widest leading-relaxed">
                                {error}
                            </p>
                            {error.includes('already registered') && (
                                <div className="pt-2">
                                    <Button asChild variant="outline" className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 h-9 text-[10px] uppercase font-black px-6 rounded-none">
                                        <Link href="/ceo/login">Initialize Login Sequence</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest ml-1">Full Legal Name</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-700" />
                                <Input
                                    name="displayName"
                                    className="bg-transparent border-zinc-800 h-11 pl-10 focus:ring-0 focus:border-[#d4af37] text-white"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Benny Iduoku-Ben"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest ml-1">Executive Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-700" />
                                <Input
                                    name="email"
                                    type="email"
                                    className="bg-transparent border-zinc-800 h-11 pl-10 focus:ring-0 focus:border-[#d4af37] text-white"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="ceo@marketbridge.io"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest ml-1">Access Key</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-700" />
                                    <Input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="bg-transparent border-zinc-800 h-11 pl-10 focus:ring-0 focus:border-[#d4af37] text-white"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest ml-1">Verify Key</Label>
                                <Input
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    className="bg-transparent border-zinc-800 h-11 focus:ring-0 focus:border-[#d4af37] text-white"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#d4af37] hover:bg-[#e5c150] text-black font-black uppercase tracking-widest h-12 rounded-none transition-all group mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    Initialize CEO Status
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 py-10">
                    <Link href="/ceo/login" className="text-[10px] font-bold text-zinc-500 hover:text-[#d4af37] uppercase tracking-widest transition-colors">
                        Return to Command Center
                    </Link>
                    <Link href="/" className="text-[10px] font-medium text-zinc-700 hover:text-white uppercase tracking-widest transition-colors">
                        Public Portal
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
