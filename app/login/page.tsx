'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon, Globe, KeyRound, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_CODES = ['marketbridge2026', '1029384756', 'MB-FOUNDER-99', 'MB-TECH-2024', 'MB-OPS-2024', 'MB-MKT-2024'];

function LoginContent() {
    const supabase = createClient();
    const { signInWithGoogle, refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || searchParams?.get('next');

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [showAdminPin, setShowAdminPin] = useState(false);
    const [adminPin, setAdminPin] = useState('');
    const [adminPinError, setAdminPinError] = useState('');
    const [adminVerified, setAdminVerified] = useState(false);

    useEffect(() => {
        if (!loading && sessionUser && user) {
            const dest = redirectUrl || getRoleDestination(user.role);
            router.replace(dest);
        }
    }, [user, sessionUser, loading, router, redirectUrl]);

    useEffect(() => {
        const emailParam = searchParams?.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
        }
    }, [searchParams]);

    function getRoleDestination(role: string) {
        if (['dealer', 'student_seller', 'seller'].includes(role)) return '/seller/dashboard';
        if (role === 'ceo') return '/admin/ceo';
        if (['admin', 'technical_admin', 'operations_admin'].includes(role)) return '/admin';
        return '/marketplace';
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleAdminPinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ADMIN_CODES.includes(adminPin.trim())) {
            setAdminVerified(true);
            setShowAdminPin(false);
            setAdminPinError('');
        } else {
            setAdminPinError('Clearance denied.');
            setAdminPin('');
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const next = redirectUrl || '/marketplace';
            await signInWithGoogle(`${window.location.origin}/auth/callback?next=${next}`);
        } catch (err: any) {
            setError(err.message || 'Transmission failed.');
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
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out.')), 8000)
            );

            const { data, error: signInError } = await Promise.race([loginPromise, timeoutPromise as any]);

            if (signInError) {
                const msg = signInError.message?.toLowerCase() ?? '';
                if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
                    setError('Incorrect identity or key.');
                } else if (msg.includes('email not confirmed')) {
                    setError('Verify email endpoint first.');
                } else if (msg.includes('timed out')) {
                    setError('Connection timed out.');
                } else {
                    setError(signInError.message || 'Authorization failed.');
                }
                return;
            }

            if (!data?.user) {
                setError('Authorization failed.');
                return;
            }

            let userRole = data.user.user_metadata?.role as string;
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!profile) {
                const meta = data.user.user_metadata || {};
                const healedRole = meta.role || 'student_buyer';
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: data.user.email ?? '',
                    display_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim()
                        || data.user.email?.split('@')[0] || 'User',
                    role: healedRole,
                    email_verified: !!data.user.email_confirmed_at,
                    is_verified: false,
                    is_verified_seller: false,
                    coins_balance: healedRole === 'student_buyer' ? 100 : 0,
                }, { onConflict: 'id' });
                userRole = healedRole;
            } else {
                userRole = profile.role || userRole;
            }

            refreshUser(data.user.id).catch(err => console.warn('Context sync error:', err));
            router.replace(redirectUrl || getRoleDestination(userRole));

        } catch (err: any) {
            setError(err.message || 'Authorization failed.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen grid place-items-center p-4 bg-background text-foreground relative overflow-hidden transition-colors duration-300">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />

            {/* Admin PIN Terminal */}
            {showAdminPin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-sm bg-card border border-primary/30 rounded-[2rem] p-8 space-y-6 shadow-[0_0_50px_rgba(255,98,0,0.15)]">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                                <KeyRound className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground italic font-heading">Secure Terminal</h3>
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Enter cryptographic clearance</p>
                        </div>
                        
                        {adminPinError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                <p className="text-destructive text-xs font-bold uppercase tracking-widest leading-none">{adminPinError}</p>
                            </div>
                        )}
                        
                        <form onSubmit={handleAdminPinSubmit} className="space-y-4 pt-2">
                            <input
                                type="password"
                                placeholder="ACCESS CODE"
                                className="w-full h-16 bg-secondary border border-border rounded-2xl text-center tracking-[0.5em] font-black text-foreground focus:outline-none focus:border-primary/50 transition-all text-sm uppercase"
                                value={adminPin}
                                onChange={e => setAdminPin(e.target.value)}
                                autoFocus
                                required
                            />
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => { setShowAdminPin(false); setAdminPin(''); setAdminPinError(''); }}
                                    className="flex-1 h-16 bg-transparent border border-border text-muted-foreground hover:text-foreground hover:bg-secondary uppercase text-[10px] font-black tracking-widest rounded-2xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] h-16 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest rounded-2xl border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all"
                                >
                                    <Lock className="h-4 w-4 mr-2" /> Decrypt
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Login Frame */}
            <div className="w-full max-w-lg glass-card bg-card/80 border border-border shadow-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 relative z-10 m-auto mt-20 mb-20">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Link>
                        {!adminVerified ? (
                            <button
                                type="button"
                                onClick={() => setShowAdminPin(true)}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <Lock className="h-3 w-3" /> Ops
                            </button>
                        ) : (
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <Lock className="h-3 w-3" /> Cleared
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                        Resume <span className="text-primary">Access</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                        {adminVerified ? 'Team terminal active' : 'Secure identification protocol'}
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-destructive text-[10px] font-bold uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Secure Endpoint (Email)</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <UserIcon className="h-4 w-4" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="you@address.com"
                                className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-1">Cryptographic Key</label>
                            <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all pr-1">
                                Reset Key?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full h-16 pl-14 pr-16 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-16 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-6 w-6" />
                            ) : (
                                <>
                                    Authenticate <ArrowRight className="ml-4 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="relative py-8 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-border" />
                    <span className="relative bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Or Bypass</span>
                </div>

                <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full h-16 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                    <Globe className="h-5 w-5" />
                    Google Fast Auth
                </Button>

                <div className="text-center pt-8 mt-8 border-t border-border">
                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                        No active clearance?{' '}
                        <Link href="/signup" className="text-primary font-black ml-2 hover:opacity-80">
                            Establish Protocol
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
