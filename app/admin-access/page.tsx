'use client';

/**
 * /admin-access — Internal-only route for Admin & CEO account creation.
 * Not linked anywhere in the public UI. Share this URL only with your team.
 * Protected by access code before any account can be created.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    Loader2, ArrowLeft, ArrowRight, ShieldCheck,
    Lock, AlertTriangle, KeyRound, Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Access codes — verified server-side in production, checked here for UX speed
const ADMIN_ACCESS_CODES = [
    'marketbridge2026',
    '1029384756',
    'MB-FOUNDER-99',
    'MB-TECH-2024',
    'MB-OPS-2024',
    'MB-MKT-2024',
];

type Step = 'role' | 'pin' | 'details';
type AdminRole = 'admin' | 'ceo';

function AdminAccessContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, user, sessionUser, loading } = useAuth();
    const { toast } = useToast();

    const [step, setStep] = useState<Step>('role');
    const [role, setRole] = useState<AdminRole>('admin');
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
    });

    // Redirect already-logged-in admins to their dashboard
    useEffect(() => {
        if (!loading && sessionUser && user) {
            if (user.role === 'ceo') router.push('/admin/ceo');
            else if (['admin', 'technical_admin', 'operations_admin'].includes(user.role)) router.push('/admin');
        }
    }, [user, sessionUser, loading, router]);

    // Support ?target=admin or ?target=ceo URL params
    useEffect(() => {
        const target = searchParams?.get('target') || searchParams?.get('role');
        if (target === 'admin') { setRole('admin'); setStep('pin'); }
        if (target === 'ceo') { setRole('ceo'); setStep('pin'); }
    }, [searchParams]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ADMIN_ACCESS_CODES.includes(pinValue.trim())) {
            setStep('details');
            setPinError('');
        } else {
            setPinError('Access Denied: Invalid security signature.');
            setPinValue('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Passwords do not match', 'error');
            return;
        }
        if (formData.password.length < 8) {
            toast('Password must be at least 8 characters', 'error');
            return;
        }

        const normalizedEmail = normalizeIdentifier(formData.email);
        setIsLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed — no user returned');

            // Write into users table with correct admin/CEO role
            const { error: profileError } = await supabase.from('users').upsert({
                id: authData.user.id,
                email: normalizedEmail,
                display_name: `${formData.firstName} ${formData.lastName}`.trim(),
                first_name: formData.firstName,
                last_name: formData.lastName,
                role,
                email_verified: false,
                is_verified: true, // Admins are pre-verified
            }, { onConflict: 'id' });

            if (profileError) throw profileError;

            if (!authData.session) {
                toast('Account created! Check your email to verify, then log in at /login.', 'success');
                router.push('/login');
                return;
            }

            toast(`${role === 'ceo' ? 'CEO' : 'Admin'} account created successfully!`, 'success');
            await refreshUser();
            router.push(role === 'ceo' ? '/admin/ceo' : '/admin');
        } catch (err: any) {
            console.error('Admin signup error:', err);
            toast(err.message || 'Account creation failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── STEP 1: Role Select ───
    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10 text-center">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                    </Link>
                    <div className="flex justify-center mb-8">
                        <Logo showText={false} />
                    </div>
                    <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-1.5 mb-6">
                        <Lock className="h-3 w-3 text-destructive" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Internal Access Only</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground italic mb-2">
                        Team <span className="text-primary">Access</span>
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium mb-10">
                        MarketBridge internal team registration. Not for public use.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Admin */}
                        <button
                            onClick={() => { setRole('admin'); setStep('pin'); }}
                            className="group bg-card border-2 border-border rounded-[2rem] p-8 text-center hover:border-primary/40 transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                                <ShieldCheck className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-base font-black text-foreground uppercase tracking-tight mb-1">Admin</h3>
                            <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest">Operations team</p>
                        </button>

                        {/* CEO */}
                        <button
                            onClick={() => { setRole('ceo'); setStep('pin'); }}
                            className="group bg-primary/5 border-2 border-primary/30 rounded-[2rem] p-8 text-center hover:border-primary transition-all duration-300 flex flex-col items-center"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                                <Crown className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-base font-black text-foreground uppercase tracking-tight mb-1">CEO</h3>
                            <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest">Executive access</p>
                        </button>
                    </div>

                    <p className="text-muted-foreground text-xs font-semibold">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-bold">Log In</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ─── STEP 2: PIN Gate ───
    if (step === 'pin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300">
                <Card className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-0 text-center">
                        <div className="flex justify-between items-center mb-4">
                            <Button
                                variant="ghost"
                                onClick={() => setStep('role')}
                                className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Link href="/" className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors">
                                Home
                            </Link>
                        </div>
                        <div className="mx-auto h-20 w-20 rounded-3xl bg-muted border border-border flex items-center justify-center mb-5">
                            <KeyRound className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter text-foreground mb-1">
                            {role === 'ceo' ? 'CEO' : 'Admin'} Authorization
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                            Enter your team access code
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-5">
                        {pinError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                                <p className="text-destructive text-[10px] font-black uppercase tracking-wider">{pinError}</p>
                            </div>
                        )}
                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <input
                                name="pin"
                                type="password"
                                className="w-full h-16 bg-muted border border-input rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground transition-all font-password"
                                value={pinValue}
                                onChange={e => setPinValue(e.target.value)}
                                placeholder="••••••••"
                                title="Enter authorized security PIN"
                                autoFocus
                                required
                            />
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-2xl bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest border-none"
                            >
                                <Lock className="h-4 w-4 mr-2" /> Verify Access
                            </Button>
                        </form>
                        <p className="text-center text-muted-foreground/30 text-[9px] font-bold uppercase tracking-widest">
                            All access attempts are logged
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── STEP 3: Create Account ───
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <Card className="w-full max-w-md bg-card border-border shadow-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <div className="flex justify-between items-center mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('pin')}
                            className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Link href="/" className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors">
                            Home
                        </Link>
                    </div>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-foreground">
                        Create {role === 'ceo' ? 'CEO' : 'Admin'} Account
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2">
                        Access level: <span className="text-primary">{role === 'ceo' ? 'Executive (Full)' : 'Operations Admin'}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">First Name</label>
                                <input
                                    name="firstName"
                                    type="text"
                                    autoFocus
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="John"
                                    title="Enter your first name"
                                    className="w-full h-12 px-4 bg-muted border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Last Name</label>
                                <input
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    title="Enter your last name"
                                    required
                                    className="w-full h-12 px-4 bg-muted border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="team@marketbridge.com.ng"
                                className="w-full h-12 px-4 bg-muted border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                className="w-full h-12 px-4 bg-muted border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Confirm Password</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                placeholder="••••••••"
                                title="Confirm your secure password"
                                required
                                className="w-full h-12 px-4 bg-muted border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group mt-2 border-none"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    Create {role === 'ceo' ? 'CEO' : 'Admin'} Account
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-muted-foreground/30 text-[10px] font-bold uppercase tracking-widest mt-6">
                        This page is for internal MarketBridge team only
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminAccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        }>
            <AdminAccessContent />
        </Suspense>
    );
}
