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
import { Loader2, Crown, Key, Lock, Mail, ChevronRight, Gavel, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CEOLoginPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [ceoExists, setCeoExists] = useState(false);

    // Initial check for existing CEO
    React.useEffect(() => {
        const checkCeoCount = async () => {
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'ceo');

            if (count && count >= 1) {
                setCeoExists(true);
            }
        };
        checkCeoCount();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setStatusMessage('AUTHENTICATING...');

        try {
            const identifier = normalizeIdentifier(formData.email);
            console.log('Login attempt for:', identifier);

            // 1. Authenticate with Supabase
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: formData.password,
            });

            if (signInError) throw signInError;
            if (!authData.user) throw new Error('Authentication failed');

            setStatusMessage('VERIFYING EXECUTIVE CLEARANCE...');

            // 2. Security Check: Verify Role in Database
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            // 3. STRICT Role Enforcement
            if (userProfile?.role !== 'ceo' && userProfile?.role !== 'cofounder') {
                // Determine if they are an admin trying to access the wrong portal
                if (['admin', 'technical_admin', 'operations_admin', 'marketing_admin'].includes(userProfile?.role || '')) {
                    setStatusMessage('REDIRECTING TO ADMIN PORTAL...');
                    await new Promise(r => setTimeout(r, 1000));
                    router.push('/admin');
                    return;
                }

                // Otherwise, reject access
                await supabase.auth.signOut();
                throw new Error('ACCESS DENIED: This portal is restricted to Founding Partners only.');
            }

            // 4. METADATA HEALING (The "Magic" Fix)
            // If the session metadata doesn't match the DB role, we force an update.
            // This fixes the "Middleware Infinite Loop" issue.
            const sessionRole = authData.user.user_metadata?.role;
            if (sessionRole !== 'ceo') {
                console.log('MISMATCH DETECTED: Executing Metadata Healing...');
                setStatusMessage('SYNCHRONIZING SECURE SESSION...');

                const { error: updateError } = await supabase.auth.updateUser({
                    data: { role: 'ceo' }
                });

                if (updateError) {
                    console.error('Metadata healing failed:', updateError);
                    // We continue anyway, hoping the DB role is enough, but log it.
                }

                // Force a session refresh to bake in the new metadata
                await supabase.auth.refreshSession();
            }

            // 5. Finalize Session
            setStatusMessage('ESTABLISHING SECURE CONNECTION...');
            await refreshUser(authData.user.id);

            // Hard redirect to force server-side session re-evaluation
            console.log('Redirecting to Vision Command...');
            window.location.href = '/ceo';


        } catch (err: any) {
            console.error('Login processing error:', err);
            setError(err.message || 'Authentication System Failure');
            setIsLoading(false);
            setStatusMessage('');
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
                        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 mb-8 text-center animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-relaxed">
                                Security Alert: {error}
                            </p>
                        </div>
                    )}

                    {statusMessage && !error && (
                        <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-lg p-4 mb-8 text-center animate-pulse">
                            <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest leading-relaxed">
                                {statusMessage}
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
                                    className="bg-transparent border-b border-zinc-900 border-x-0 border-t-0 rounded-none h-12 text-sm focus:ring-0 focus:border-[#d4af37] transition-all px-10 placeholder:text-zinc-800 text-white"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Executive Email"
                                    autoComplete="email"
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
                                    className="bg-transparent border-b border-zinc-900 border-x-0 border-t-0 rounded-none h-12 text-sm focus:ring-0 focus:border-[#d4af37] transition-all px-10 placeholder:text-zinc-800 text-white"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••••••"
                                    autoComplete="current-password"
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
