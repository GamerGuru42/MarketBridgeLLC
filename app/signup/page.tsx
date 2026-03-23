'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import {
    Loader2, ArrowLeft, ArrowRight, User as UserIcon,
    Globe, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Only buyers and sellers can self-register.
// Admin/CEO accounts are provisioned internally by the MarketBridge team.
type Step = 'role' | 'details' | 'otp';
type Role = 'student_buyer' | 'student_seller';

const UNIVERSITIES = [
    "Baze University",
    "Nile University of Nigeria",
    "Veritas University",
    "Other Abuja Private University"
];

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('student_buyer');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
        university: '',
        universityOther: '',
        matricNumber: '',
        otp: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const roleParam = searchParams?.get('role');
        if (roleParam === 'student_seller' || roleParam === 'seller') {
            setRole('student_seller');
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

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${role}`);
        } catch (error: any) {
            toast(error.message || 'Google Auth failed', 'error');
            setIsLoading(false);
        }
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
            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', normalizedEmail)
                .maybeSingle();

            if (existingUser) {
                toast('An account with this email already exists', 'error');
                router.push(`/login?email=${encodeURIComponent(normalizedEmail)}`);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            if (data.user) {
                const { error: profileError } = await supabase.from('users').upsert({
                    id: data.user.id,
                    email: normalizedEmail,
                    display_name: `${formData.firstName} ${formData.lastName}`.trim(),
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    role,
                    email_verified: false,
                });

                if (profileError) throw profileError;

                if (data.session) {
                    toast('Account created successfully!', 'success');
                    await refreshUser();
                    router.push(role === 'student_seller' ? '/seller-onboard' : '/marketplace');
                } else {
                    toast('Verification code sent! Please check your email.', 'success');
                    setCurrentStep('otp');
                }
            }
        } catch (error: any) {
            toast(error.message || 'Signup failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.otp.length !== 6) {
            toast('Please enter a valid 6-digit code', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: normalizeIdentifier(formData.email),
                token: formData.otp,
                type: 'signup'
            });

            if (error) throw error;

            if (data.user) {
                const finalUni = formData.university === 'Other Abuja Private University' ? formData.universityOther : formData.university;
                
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email_verified: true,
                    university: finalUni,
                    matric_number: formData.matricNumber
                }, { onConflict: 'id' });

                await refreshUser();
                toast('Account fully verified!', 'success');
                router.push(role === 'student_seller' ? '/seller-onboard' : '/marketplace');
            }
        } catch (error: any) {
            toast(error.message || 'Invalid verification code.', 'error');
        } finally {
            setIsLoading(false);
        }
    };


    // ─── STEP 1: Role Selector ───
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
                {/* Background glow - subtle in both modes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-lg relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <div className="flex justify-center mb-6">
                            <Logo showText={false} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-4 italic">
                            Join Market<span className="text-primary">Bridge</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
                            Select how you want to use the platform
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        {/* Buyer */}
                        <button
                            onClick={() => handleRoleSelect('student_buyer')}
                            className="group bg-card border border-border rounded-[2rem] p-6 text-center cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <UserIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest">Shop</p>
                        </button>

                        {/* Seller */}
                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-card border border-border rounded-[2rem] p-6 text-center cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <Briefcase className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest">Sell</p>
                        </button>

                        {/* Admin */}
                        <Link
                            href="/admin-access?target=admin"
                            className="group bg-card border border-border rounded-[2rem] p-6 text-center cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <Globe className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Admin</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest">System</p>
                        </Link>

                        {/* CEO */}
                        <Link
                            href="/admin-access?target=ceo"
                            className="group bg-primary/5 border border-primary/20 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                <Logo showText={false} className="scale-75" />
                            </div>
                            <h3 className="text-sm font-black text-primary uppercase tracking-tight mb-1">CEO</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest">Growth</p>
                        </Link>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-muted-foreground font-medium text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 2: Signup Form ───
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <Card className="w-full max-w-md bg-card border-border shadow-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10">
                <CardHeader className="p-0 mb-8 text-center">
                    <div className="flex justify-between items-center mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep('role')}
                            className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Role
                        </Button>
                        <Link href="/" className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest transition-colors">
                            Home
                        </Link>
                    </div>
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-foreground">Create Your Account</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2">
                        Signing up as:{' '}
                        <span className="text-primary">
                            {role === 'student_seller' ? 'Seller' : 'Buyer'}
                        </span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">First Name</label>
                                <input
                                    name="firstName"
                                    type="text"
                                    autoFocus
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="John"
                                    title="First Name"
                                    className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Last Name</label>
                                <input
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Doe"
                                    title="Last Name"
                                    className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="name@email.com"
                                title="Email Address"
                                className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">University</label>
                            <select
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                required
                                className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
                            >
                                <option value="" disabled>Select your campus</option>
                                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        {formData.university === 'Other Abuja Private University' && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Specify University</label>
                                <input
                                    name="universityOther"
                                    type="text"
                                    value={formData.universityOther}
                                    onChange={handleChange}
                                    required
                                    placeholder="University Name"
                                    className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Matriculation Number</label>
                            <input
                                name="matricNumber"
                                type="text"
                                value={formData.matricNumber}
                                onChange={handleChange}
                                required
                                placeholder="E.g. BU/19/000"
                                className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Confirm Password</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                title="Confirm Password"
                                className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group border-none"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    Create Account
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {role === 'student_buyer' && (
                        <>
                            <div className="relative py-4 flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-border" />
                                <span className="relative bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Or continue with</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleGoogleAuth}
                                className="w-full h-14 bg-transparent border-input text-foreground/70 font-bold rounded-2xl hover:bg-secondary transition-all"
                            >
                                <Globe className="mr-3 h-5 w-5 text-primary" />
                                Google Sign Up
                            </Button>
                        </>
                    )}

                    <p className="text-center text-muted-foreground/30 text-xs font-semibold mt-6">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                        {' '}&{' '}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </p>

                    <p className="text-center text-muted-foreground/30 text-xs font-semibold">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-bold hover:underline">Log In</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
