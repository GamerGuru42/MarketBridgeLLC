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
type Role = 'student_buyer' | 'student_seller';

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
    const [googleLoadingRole, setGoogleLoadingRole] = useState<Role | null>(null);
    const [expandedRole, setExpandedRole] = useState<Role | null>(null);

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
        } else {
            setCurrentStep('details');
        }
    };

    const handleGoogleAuth = async (selectedRole: Role) => {
        setGoogleLoadingRole(selectedRole);
        try {
            const next = selectedRole === 'student_seller' ? '/seller-onboard' : '/marketplace';
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${selectedRole}&next=${next}`);
        } catch (error: any) {
            toast(error.message || 'Google Auth failed', 'error');
            setGoogleLoadingRole(null);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Passwords do not match.', 'error');
            return;
        }
        if (formData.password.length < 8) {
            toast('Password must be at least 8 characters.', 'error');
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
                toast('Account already exists. Please log in.', 'error');
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
                    toast('Account created! Welcome to MarketBridge.', 'success');
                    await refreshUser();
                    router.push('/marketplace');
                } else {
                    toast('Account created! Check your email to verify.', 'success');
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
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-background text-foreground relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
                <div className="w-full max-w-2xl relative z-10 glass-card bg-card/80 border border-border rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 shadow-2xl">
                    <div className="text-center mb-10 space-y-4">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                            Create <span className="text-primary">Account</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                            Select your account type
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:px-4">
                        {/* ─── Buyer Card ─────────────────────────────────────────── */}
                        <div 
                            onClick={() => setExpandedRole(expandedRole === 'student_buyer' ? null : 'student_buyer')}
                            className={cn(
                                "bg-secondary border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm cursor-pointer transition-all duration-300",
                                expandedRole === 'student_buyer' ? "border-primary/50 ring-1 ring-primary/20 scale-[1.02]" : "border-border hover:border-primary/30"
                            )}>
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4">
                                <UserIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-2">Shop & Browse</p>
                            
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'student_buyer' ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button
                                    onClick={(e) => { e.stopPropagation(); handleRoleSelect('student_buyer'); }}
                                    className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)] transition-all"
                                >
                                    Sign Up with Email <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleGoogleAuth('student_buyer'); }}
                                    disabled={googleLoadingRole === 'student_buyer'}
                                    className="w-full h-12 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {googleLoadingRole === 'student_buyer' ? (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    ) : (
                                        <>
                                            <Globe className="h-4 w-4" />
                                            Google Sign-In
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* ─── Seller Card ────────────────────────────────────────── */}
                        <div 
                            onClick={() => setExpandedRole(expandedRole === 'student_seller' ? null : 'student_seller')}
                            className={cn(
                                "bg-secondary border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer transition-all duration-300",
                                expandedRole === 'student_seller' ? "border-primary/50 ring-1 ring-primary/20 scale-[1.02]" : "border-border hover:border-primary/30"
                            )}>
                            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4">
                                <Briefcase className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-2">Sell on Campus</p>
                            
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'student_seller' ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button
                                    onClick={(e) => { e.stopPropagation(); handleRoleSelect('student_seller'); }}
                                    className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)] transition-all"
                                >
                                    Sign Up with Email <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleGoogleAuth('student_seller'); }}
                                    disabled={googleLoadingRole === 'student_seller'}
                                    className="w-full h-12 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {googleLoadingRole === 'student_seller' ? (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    ) : (
                                        <>
                                            <Globe className="h-4 w-4" />
                                            School Google Sign-In
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 mt-6 border-t border-border">
                        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary font-black ml-2 hover:opacity-80">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-background text-foreground relative transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="w-full max-w-lg glass-card bg-card/80 border border-border shadow-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 relative z-10 m-auto mt-8 mb-8">
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
                    
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading leading-none">
                        Sign <span className="text-primary">Up</span>
                    </h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] italic">
                        Enter your details
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Full Name</label>
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
                                placeholder="Full Name"
                                className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Email Address</label>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Password</label>
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
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Confirm Password</label>
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
                                    Create Account <ArrowRight className="ml-4 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="relative py-8 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-border" />
                    <span className="relative bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Or</span>
                </div>

                <Button
                    type="button"
                    onClick={() => handleGoogleAuth('student_buyer')}
                    disabled={googleLoadingRole !== null}
                    className="w-full h-16 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                    {googleLoadingRole ? <Loader2 className="animate-spin h-5 w-5" /> : (
                        <>
                            <Globe className="h-5 w-5" />
                            Google Sign-In
                        </>
                    )}
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
