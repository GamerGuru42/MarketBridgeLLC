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
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Crown, Key, Lock, Mail, ChevronRight, Gavel, Eye, EyeOff } from 'lucide-react';

export default function CEOLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [ceoExists, setCeoExists] = useState(false);

    const { user, refreshUser, loading: authLoading } = useAuth();

    React.useEffect(() => {
        // Redirect if already logged in as CEO
        if (!authLoading && user && (user.role === 'ceo' || user.role === 'cofounder')) {
            router.push('/ceo');
        }

        const checkCeoCount = async () => {
            const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'ceo');

            if (!countError && count !== null && count >= 1) {
                setCeoExists(true);
            }
        };
        checkCeoCount();
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('INITIATING EXECUTIVE SESSION...');
        setIsLoading(true);
        setError('');

        try {
            const identifier = normalizeIdentifier(formData.email);
            console.log('Verifying credentials for:', identifier);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: formData.password,
            });

            if (signInError) {
                console.error('Sign-in error:', signInError);
                throw signInError;
            }

            if (data.user) {
                console.log('Auth successful, verifying clearance...');
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                }

                if (profile && profile.role === 'ceo') {
                    console.log('CEO Clearance Confirmed. Syncing session...');
                    await refreshUser();
                    // Brief delay to ensure context update
                    await new Promise(r => setTimeout(r, 500));
                    router.push('/ceo');
                } else if (profile && (profile.role === 'admin' || profile.role === 'technical_admin')) {
                    console.log('Admin Clearance Detected. Syncing session...');
                    await refreshUser();
                    await new Promise(r => setTimeout(r, 500));
                    router.push('/admin');
                } else {
                    console.warn('Unauthorized role detected:', profile?.role);
                    await supabase.auth.signOut();
                    setError('ACCESS REVOKED: Only Founding Partners may enter this terminal.');
                }
            }
        } catch (err: any) {
            console.error('System exception:', err);
            setError(err.message || 'Verification failure - check connectivity');
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05),transparent)] pointer-events-none"></div>

            <Card className="w-full max-w-lg bg-zinc-950 border-none shadow-[0_30px_100px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/5">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent"></div>

                <CardHeader className="space-y-6 pt-16 pb-10 text-center relative z-10">
                    <div className="relative mx-auto group">
                        <div className="absolute -inset-4 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/20 transition-all"></div>
                        <div className="relative h-24 w-24 rounded-full border border-[#d4af37]/30 bg-black flex items-center justify-center">
                            <Crown className="h-12 w-12 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-[0.3em] text-white uppercase italic">
                            Vision Command
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-serif italic text-sm mt-2">
                            MarketBridge.io | Executive Authentication Portal
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-12 relative z-10">
                    {error && (
                        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-8 text-center">
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-relaxed">
                                Security Alert: {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Master ID</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-700 group-focus-within:text-[#d4af37] transition-colors" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="bg-transparent border-b border-zinc-900 border-x-0 border-t-0 rounded-none h-12 text-sm focus:ring-0 focus:border-[#d4af37] transition-all px-10 placeholder:text-zinc-800"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Executive Email"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 pt-2">
                            <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Signature Key</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-700 group-focus-within:text-[#d4af37] transition-colors" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="bg-transparent border-b border-zinc-900 border-x-0 border-t-0 rounded-none h-12 text-sm focus:ring-0 focus:border-[#d4af37] transition-all px-10 placeholder:text-zinc-800"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-800 hover:text-[#d4af37] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#d4af37] hover:bg-[#e5c150] text-black font-black uppercase tracking-[0.2em] h-14 rounded-none transition-all relative overflow-hidden group shadow-[0_0_20px_rgba(212,175,55,0.1)] z-50"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    Initiate Session
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col items-center gap-6 py-12 relative z-10">
                    <div className="flex items-center gap-8">
                        {!ceoExists && (
                            <Link href="/ceo/signup" className="text-[9px] font-bold text-zinc-600 hover:text-[#d4af37] uppercase tracking-widest transition-colors">Grant Onboarding</Link>
                        )}
                        <Link href="/" className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors underline">Public Terminal</Link>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-800">
                        <Gavel className="h-3 w-3" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.3em]">MarketBridge Legal Protocol 2024</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
