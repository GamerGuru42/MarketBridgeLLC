'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowLeft, ArrowRight, User as UserIcon, Globe, Briefcase, Mail } from 'lucide-react';
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
        // If they select seller, route them immediately to the hyper-premium seller onboard!
        if (selectedRole === 'student_seller') {
            router.push('/seller-onboard');
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
            <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white relative overflow-hidden transition-colors duration-300 selection:bg-[#FF6200] selection:text-black">
                <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6200]/10 rounded-full blur-[150px] pointer-events-none z-0" />

                <div className="w-full max-w-lg relative z-10 glass-card bg-zinc-950/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 md:p-14 shadow-2xl">
                    <div className="text-center mb-12 space-y-4">
                        <Link href="/" className="inline-flex items-center text-white/40 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Abort To Main
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic font-heading">
                            Network <span className="text-[#FF6200]">Access</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] italic shadow-sm">
                            Select clearance authorization level
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <button
                            onClick={() => handleRoleSelect('student_buyer')}
                            className="group bg-white/5 border border-white/5 rounded-[2rem] p-8 text-center cursor-pointer hover:bg-[#FF6200]/5 hover:border-[#FF6200]/30 transition-all duration-500 flex flex-col items-center shadow-sm"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#FF6200]/20 transition-colors">
                                <UserIcon className="h-8 w-8 text-white/40 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Student Buyer</h3>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-relaxed">Standard Access. Browse & Purchase.</p>
                        </button>

                        <button
                            onClick={() => handleRoleSelect('student_seller')}
                            className="group bg-white/5 border border-white/5 rounded-[2rem] p-8 text-center cursor-pointer hover:bg-[#FF6200]/5 hover:border-[#FF6200]/30 transition-all duration-500 flex flex-col items-center shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#FF6200] animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#FF6200]/20 transition-colors">
                                <Briefcase className="h-8 w-8 text-white/40 group-hover:text-[#FF6200] transition-colors" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Seller Hub</h3>
                            <p className="text-[#FF6200]/70 group-hover:text-[#FF6200] text-[9px] font-black uppercase tracking-widest leading-relaxed">Strict Verification. Merchant Protocol.</p>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-6 mb-8">
                        <Link href="/admin-access?target=admin" className="text-white/20 hover:text-white uppercase text-[8px] font-black tracking-widest transition-colors flex flex-col items-center gap-1 group">
                             System Admin
                        </Link>
                        <span className="text-white/10 text-[8px]">|</span>
                        <Link href="/admin-access?target=ceo" className="text-white/20 hover:text-[#FF6200] uppercase text-[8px] font-black tracking-widest transition-colors flex flex-col items-center gap-1 group">
                             Executive
                        </Link>
                    </div>

                    <div className="text-center pt-6 border-t border-white/5">
                        <p className="text-white/40 font-bold text-xs">
                            System credentials active?{' '}
                            <Link href="/login" className="text-[#FF6200] font-black uppercase tracking-widest ml-2 hover:text-[#FF7A29]">
                                Execute Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black text-white relative transition-colors duration-300 selection:bg-[#FF6200] selection:text-black">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF6200]/10 rounded-full blur-[150px] pointer-events-none z-0" />

            <div className="w-full max-w-lg glass-card bg-zinc-950/80 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[3rem] p-10 md:p-14 relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep('role')}
                            className="text-white/40 hover:text-white uppercase text-[10px] font-black tracking-widest px-0"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </div>
                    
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic font-heading leading-none">
                        Establish <span className="text-[#FF6200]">Identity</span>
                    </h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] italic">
                        Standard clearance protocol
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 font-heading">Legal Designation</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-white/40">
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
                                className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 font-heading">Secure Endpoint (Email)</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-white/40">
                                <Mail className="h-4 w-4" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="email@address.com"
                                className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 p-1">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 font-heading">Cryptographic Key</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 chars"
                                className="w-full h-16 px-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                        <div className="space-y-2 p-1">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 font-heading">Verify Key</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full h-16 px-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500 rounded-2xl" />
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6 relative z-10" /> : (
                                <div className="flex items-center relative z-10">
                                    Establish Account <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="relative py-8 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-white/10" />
                    <span className="relative bg-[#09090b] px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Or Bypass</span>
                </div>

                <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full h-16 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                    <Globe className="h-5 w-5 text-black" />
                    Google Fast Auth
                </Button>

            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#FF6200]" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
