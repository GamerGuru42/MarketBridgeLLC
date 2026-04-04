'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowLeft, ArrowRight, User as UserIcon, Globe, Briefcase, Mail, ShieldAlert, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Step = 'role' | 'details';
type Role = 'student_buyer' | 'student_seller' | 'admin' | 'ceo';

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('student_buyer');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        passwordConfirm: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const roleParam = searchParams?.get('role');
        if (roleParam === 'student_seller' || roleParam === 'seller') {
            setRole('student_seller');
            setCurrentStep('details');
        } else if (roleParam === 'student_buyer' || roleParam === 'buyer') {
            setRole('student_buyer');
            setCurrentStep('details');
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        if (selectedRole === 'student_seller') {
            router.push('/seller-onboard');
        } else if (selectedRole === 'admin') {
            router.push('/admin-access?target=admin');
        } else if (selectedRole === 'ceo') {
            router.push('/admin-access?target=ceo');
        } else {
            setCurrentStep('details');
        }
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=student_buyer&next=/marketplace`);
        } catch (error: any) {
            toast(error.message || 'Google Auth failed', 'error');
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Security keys do not match.', 'error');
            return;
        }
        if (formData.password.length < 8) {
            toast('Security key must be at least 8 characters.', 'error');
            return;
        }

        const normalizedEmail = normalizeIdentifier(formData.email);
        setIsLoading(true);

        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', normalizedEmail)
                .maybeSingle();

            if (existingUser) {
                toast('Identity already secured. Please log in.', 'error');
                router.push(`/login?email=${encodeURIComponent(normalizedEmail)}`);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'student_buyer',
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            if (data.user) {
                const { error: profileError } = await supabase.from('users').upsert({
                    id: data.user.id,
                    email: normalizedEmail,
                    display_name: formData.fullName.trim(),
                    role: 'student_buyer',
                    email_verified: false,
                });

                if (profileError) throw profileError;

                if (data.session) {
                    toast('Identity verified! Connecting to MarketBridge...', 'success');
                    await refreshUser();
                    router.push('/marketplace');
                } else {
                    toast('Identity registered! Verify incoming transmission.', 'success');
                    router.push('/login');
                }
            }
        } catch (error: any) {
            toast(error.message || 'Registration failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />

                <div className="w-full max-w-2xl relative z-10 bg-card border border-border rounded-[3rem] p-10 md:p-14 shadow-2xl">
                    <div className="text-center mb-12 space-y-4">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Abort To Main
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                            Network <span className="text-primary">Access</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                            Select clearance authorization level
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <button
                            onClick={() => handleRoleSelect('student_buyer')}
                            className="group bg-secondary border border-border rounded-3xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <UserIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest">Shop</p>
                        </button>

                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-secondary border border-border rounded-3xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 flex flex-col items-center shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <Briefcase className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest">Merchant</p>
                        </button>
                        
                        <button
                            onClick={() => handleRoleSelect('admin')}
                            className="group bg-secondary border border-border rounded-3xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <ShieldAlert className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Admin</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest">Ops</p>
                        </button>

                        <button
                            onClick={() => handleRoleSelect('ceo')}
                            className="group bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <KeyRound className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-sm font-black text-primary uppercase tracking-tight mb-1">CEO</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest">Growth</p>
                        </button>
                    </div>

                    <div className="text-center pt-8 mt-8 border-t border-border">
                        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                            System credentials active?{' '}
                            <Link href="/login" className="text-primary font-black ml-2 hover:opacity-80">
                                Execute Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background text-foreground relative transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />

            <div className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-[3rem] p-10 md:p-14 relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep('role')}
                            className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest px-0"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </div>
                    
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground italic font-heading leading-none">
                        Establish <span className="text-primary">Identity</span>
                    </h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] italic">
                        Standard clearance protocol
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Legal Designation</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <UserIcon className="h-4 w-4" />
                            </div>
                            <input
                                name="fullName"
                                type="text"
                                autoFocus
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                placeholder="Enter public designation..."
                                className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Secure Endpoint (Email)</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <Mail className="h-4 w-4" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="email@address.com"
                                className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Secure Key</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 chars"
                                className="w-full h-16 px-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Verify Key</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full h-16 px-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all flex items-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6 relative z-10" /> : (
                                <>
                                    Establish Account <ArrowRight className="ml-4 h-5 w-5" />
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
                    onClick={handleGoogleAuth}
                    className="w-full h-16 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                    <Globe className="h-5 w-5" />
                    Google Fast Auth
                </Button>

            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
