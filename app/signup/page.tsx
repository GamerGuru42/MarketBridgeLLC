'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowLeft, ArrowRight, User as UserIcon, Globe, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'role' | 'details';
type Role = 'student_buyer' | 'student_seller';

const UNIVERSITIES = [
    "Baze University",
    "Nile University of Nigeria",
    "Veritas University",
    "Cosmopolitan University",
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
        fullName: '',
        email: '',
        password: '',
        passwordConfirm: '',
        phoneNumber: '',
        university: '',
        universityOther: '',
        matricNumber: '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        setCurrentStep('details');
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            const nextParam = role === 'student_seller' ? '/seller-setup/bank' : '/marketplace';
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${role}&next=${nextParam}`);
        } catch (error: any) {
            toast(error.message || 'Google Auth failed', 'error');
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (role === 'student_seller') {
            if (!formData.university) {
                toast('University is required for sellers', 'error');
                return;
            }
            if (!formData.phoneNumber) {
                toast('Phone number is required for sellers', 'error');
                return;
            }
        }

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

            const [firstName, ...lastNames] = formData.fullName.split(' ');
            const lastName = lastNames.join(' ');
            const uni = formData.university === 'Other Abuja Private University' ? formData.universityOther : formData.university;

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone_number: formData.phoneNumber,
                        university: uni,
                        role: role,
                    },
                    emailRedirectTo: role === 'student_seller' ? `${window.location.origin}/auth/callback?next=/seller-setup/bank` : `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            if (data.user) {
                const { error: profileError } = await supabase.from('users').upsert({
                    id: data.user.id,
                    email: normalizedEmail,
                    display_name: formData.fullName.trim(),
                    phone_number: formData.phoneNumber,
                    university: uni,
                    role: role,
                    email_verified: false,
                });

                if (profileError) throw profileError;

                if (role === 'student_seller') {
                    toast('Account created! Please verify your email.', 'success');
                    router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
                } else {
                    if (data.session) {
                        toast('Account created! Welcome to MarketBridge.', 'success');
                        await refreshUser();
                        router.push('/marketplace');
                    } else {
                        toast('Account registered! Redirecting to login...', 'success');
                        router.push('/login');
                    }
                }
            }
        } catch (error: any) {
            toast(error.message || 'Signup failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
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

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                        <button
                            onClick={() => handleRoleSelect('student_buyer')}
                            className="group bg-card border border-border rounded-[2rem] p-6 text-center cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <UserIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">I want to Buy</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest mt-1">Open Access</p>
                        </button>

                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-card border border-border rounded-[2rem] p-6 text-center cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <Briefcase className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">I want to Sell</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest mt-1">Strict Verification</p>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        <Link
                            href="/admin-access?target=admin"
                            className="group bg-card border border-border rounded-[2rem] p-6 text-center cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <Globe className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Admin</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest mt-1">System</p>
                        </Link>

                        <Link
                            href="/admin-access?target=ceo"
                            className="group bg-primary/5 border border-primary/20 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                <Logo showText={false} className="scale-75" />
                            </div>
                            <h3 className="text-sm font-black text-primary uppercase tracking-tight mb-1">CEO</h3>
                            <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest mt-1">Growth</p>
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
                        Signing up as: <span className="text-primary">{role === 'student_seller' ? 'Seller' : 'Buyer'}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Full Name</label>
                            <input
                                name="fullName"
                                type="text"
                                autoFocus
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                                className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">
                                {role === 'student_seller' ? 'Personal Email' : 'Email Address'}
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="name@email.com"
                                className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">
                                Phone Number {role === 'student_buyer' && <span className="opacity-50 ml-1">(Optional)</span>}
                            </label>
                            <input
                                name="phoneNumber"
                                type="text"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                required={role === 'student_seller'}
                                placeholder="080..."
                                className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Min 8 chars"
                                    className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Confirm Pass</label>
                                <input
                                    name="passwordConfirm"
                                    type="password"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border mt-6">
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3 text-center">
                                Student details {role === 'student_buyer' && '(Optional)'}
                            </p>
                            
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">University</label>
                                    <select
                                        name="university"
                                        value={formData.university}
                                        onChange={handleChange}
                                        required={role === 'student_seller'}
                                        className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none text-sm"
                                    >
                                        <option value="">Select your campus</option>
                                        {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>

                                {formData.university === 'Other Abuja Private University' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Specify University</label>
                                        <input
                                            name="universityOther"
                                            type="text"
                                            value={formData.universityOther}
                                            onChange={handleChange}
                                            required={role === 'student_seller'}
                                            placeholder="University Name"
                                            className="w-full h-12 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 mt-4 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 group border-none shadow-xl shadow-primary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    {role === 'student_seller' ? 'Register & Verify' : 'Create Buyer Account'}
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="relative py-4 flex items-center justify-center">
                        <div className="absolute inset-x-0 h-px bg-border" />
                        <span className="relative bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Or</span>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogleAuth}
                        className="w-full h-14 bg-transparent border-input text-foreground font-bold rounded-2xl hover:bg-secondary transition-all"
                    >
                        <Globe className="mr-3 h-5 w-5 text-primary" />
                        Sign up with Google
                    </Button>

                    <p className="text-center text-muted-foreground/50 text-xs font-medium mt-6">
                        By signing up, you agree to our{' '}
                        <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                        {' '}&{' '}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy</Link>.
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
