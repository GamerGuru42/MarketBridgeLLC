'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowRight, ArrowLeft, User as UserIcon, Globe, Mail, BookOpen, GraduationCap, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type Step = 'role' | 'buyer-form' | 'seller-google';
type Role = 'student_buyer' | 'student_seller';

const UNIVERSITIES = [
    'Baze University', 'Nile University of Nigeria', 'Veritas University',
    'University of Abuja', 'NOUN', 'Nigerian Defence Academy', 'Other'
];

const APPROVED_UNIVERSITIES = [
    { name: 'Nile University', domain: 'nileuniversity.edu.ng' },
    { name: 'Baze University', domain: 'bazeuniversity.edu.ng' },
    { name: 'Veritas University', domain: 'veritas.edu.ng' },
    { name: 'AUST', domain: 'aust.edu.ng' },
    { name: 'Evangel University', domain: 'eun.edu.ng' },
    { name: 'Philomath University', domain: 'philomath.edu.ng' },
    { name: 'Cosmopolitan University', domain: 'cosmopolitan.edu.ng' },
    { name: 'MIVA University', domain: 'miva.university' },
    { name: 'Prime University', domain: 'primeuniversity.edu.ng' },
    { name: 'Bingham University', domain: 'binghamuni.edu.ng' },
];

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [role, setRole] = useState<Role>('student_buyer');
    const [expandedRole, setExpandedRole] = useState<Role | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sellerError, setSellerError] = useState('');
    const [sellerErrorEmail, setSellerErrorEmail] = useState('');

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', passwordConfirm: '',
        university: '', otherUniversity: '', matricNumber: '',
        terms: false
    });

    // Handle errors from callback redirect
    useEffect(() => {
        const err = searchParams?.get('seller_error') || searchParams?.get('error');
        const msg = searchParams?.get('message');
        const email = searchParams?.get('email');
        
        if (err === 'invalid_domain') {
            setSellerError(`Only verified Abuja private university emails are accepted. Your email ${email || ''} does not qualify.`);
            setSellerErrorEmail(email || '');
            setCurrentStep('seller-google');
            setRole('student_seller');
        } else if (err || msg) {
            setSellerError(msg || err || 'Authentication failed. Please try again.');
        }
    }, [searchParams]);

    const clearError = () => {
        setSellerError('');
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        url.searchParams.delete('message');
        url.searchParams.delete('seller_error');
        window.history.replaceState({}, '', url.toString());
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        setSellerError('');
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${role}`);
        } catch (error: any) {
            toast(error.message || 'Google Auth failed', 'error');
            setGoogleLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.passwordConfirm) { toast('Passwords do not match.', 'error'); return; }
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(formData.password)) { toast('Password must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.', 'error'); return; }
        if (!formData.terms) { toast('You must accept the terms and conditions.', 'error'); return; }
        const normalizedEmail = normalizeIdentifier(formData.email);
        const finalUniversity = formData.university === 'Other' ? formData.otherUniversity : formData.university;
        if (!finalUniversity) { toast('Please specify your university.', 'error'); return; }

        setIsLoading(true);
        try {
            const { data: existingUser } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
            if (existingUser) { toast('Account already exists. Please log in.', 'error'); router.push(`/login?email=${encodeURIComponent(normalizedEmail)}`); return; }

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail, password: formData.password,
                options: { data: { full_name: formData.fullName, role: 'student_buyer' }, emailRedirectTo: `${window.location.origin}/auth/callback` }
            });
            if (error) throw error;
            if (data.user) {
                // Map to DB role
                const dbRole = 'buyer'; // For this specific form

                await supabase.from('users').upsert({
                    id: data.user.id, 
                    email: normalizedEmail, 
                    display_name: formData.fullName.trim(),
                    role: dbRole, 
                    university: finalUniversity, 
                    matric_number: formData.matricNumber, 
                    email_verified: false,
                    is_verified: false,
                    created_at: new Date().toISOString()
                });
                router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
            }
        } catch (error: any) { toast(error.message || 'Registration failed', 'error'); }
        finally { setIsLoading(false); }
    };

    // ─── STEP 1: Role Selection ───────────────────────────────────────────────
    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
                <div className="w-full max-w-2xl relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-6 md:p-10 lg:p-14 shadow-2xl">
                    {sellerError && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex flex-col items-center gap-3 text-center">
                            <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px]">
                                <AlertTriangle className="h-4 w-4" /> Authentication Failed
                            </div>
                            <p className="text-gray-300 text-[11px] font-bold leading-relaxed">{sellerError}</p>
                            <button onClick={clearError} className="mt-1 text-orange-500 hover:text-orange-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors">
                                Try Again <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    <div className="text-center mb-10 space-y-4">
                        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                            Create <span className="text-orange-500">Account</span>
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] italic">
                            Join MarketBridge Today
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:px-4">
                        {/* Buyer Card */}
                        <div
                            onClick={() => setExpandedRole(expandedRole === 'student_buyer' ? null : 'student_buyer')}
                            className={cn(
                                "bg-[#2a2a2a] border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm cursor-pointer transition-all duration-300",
                                expandedRole === 'student_buyer' ? "border-orange-500/50 ring-1 ring-orange-500/20 scale-[1.02]" : "border-[#3a3a3a] hover:border-orange-500/30"
                            )}>
                            <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Buyer</h3>
                            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-2">Shop & Browse</p>
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'student_buyer' ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button onClick={(e) => { e.stopPropagation(); setRole('student_buyer'); setCurrentStep('buyer-form'); }}
                                    className="w-full h-12 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)]">
                                    Sign Up with Email <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button type="button" onClick={(e) => { e.stopPropagation(); setRole('student_buyer'); handleGoogleAuth(); }} disabled={googleLoading}
                                    className="w-full h-12 bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2">
                                    {googleLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Globe className="h-4 w-4" /> Google Sign-Up</>}
                                </Button>
                            </div>
                        </div>

                        {/* Seller Card */}
                        <div
                            className={cn(
                                "bg-[#2a2a2a] border rounded-3xl p-6 text-center flex flex-col items-center shadow-lg relative overflow-hidden transition-all duration-300",
                                "border-orange-500/50 ring-1 ring-orange-500/20"
                            )}>
                            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                                <BookOpen className="h-6 w-6 text-orange-500" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Seller</h3>
                            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-4">Sell on Campus</p>
                            
                            <div className="w-full space-y-3">
                                <Button 
                                    type="button" 
                                    onClick={() => { setRole('student_seller'); handleGoogleAuth(); }} 
                                    disabled={googleLoading}
                                    className="w-full py-6 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-wider text-[11px] rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2">
                                    {googleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><ShieldCheck className="h-4 w-4" /> Sign Up with Google</>}
                                </Button>
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                                    School email <span className="text-orange-500 font-black">(.edu.ng)</span> required
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 mt-6 border-t border-[#2a2a2a]">
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                            Already have an account?{' '}
                            <Link href="/login" className="text-orange-500 font-black ml-2 hover:opacity-80">Log In</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2b (Repurposed for errors)
    if (sellerError) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
                <div className="w-full max-w-lg relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-6 md:p-10 lg:p-14 shadow-2xl">
                    <div className="text-center mb-10 space-y-4">
                        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                            Verification <span className="text-red-500">Failed</span>
                        </h1>
                        <p className="text-gray-400 font-bold text-[10px] leading-relaxed max-w-sm mx-auto uppercase tracking-widest">
                            We couldn't identify your university from <span className="text-white">{sellerErrorEmail}</span>.
                        </p>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-8 text-center">
                        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            {sellerError}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button variant="outline" onClick={() => { setSellerError(''); setSellerErrorEmail(''); setCurrentStep('role'); }}
                            className="w-full h-14 border-[#2a2a2a] bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] font-black uppercase tracking-widest text-[10px] rounded-xl">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
                        </Button>
                        <div className="text-center p-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl">
                            <p className="text-[9px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
                                Contact support if you believe this is an error:{' '}
                                <a href="mailto:support@marketbridge.com.ng" className="text-orange-500 hover:underline">support@marketbridge.com.ng</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP 2a: Buyer Registration Form ────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-8 md:py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="w-full max-w-xl relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-5 md:p-10 lg:p-14 shadow-2xl m-auto mt-8 mb-8">
                <div className="text-center mb-10 space-y-4">
                    <Button variant="ghost" onClick={() => setCurrentStep('role')}
                        className="text-gray-400 hover:text-white uppercase text-[10px] font-black tracking-widest px-0 mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                    </Button>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                        Create <span className="text-orange-500">Account</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">
                        Join MarketBridge Today
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><UserIcon className="h-4 w-4" /></div>
                            <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} required placeholder="John Doe"
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><Mail className="h-4 w-4" /></div>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@address.com"
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">University</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><GraduationCap className="h-4 w-4" /></div>
                            <select name="university" value={formData.university} onChange={handleChange} required
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm appearance-none">
                                <option value="" disabled>Select your university</option>
                                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    {formData.university === 'Other' && (
                        <input name="otherUniversity" type="text" value={formData.otherUniversity} onChange={handleChange} required placeholder="Specify your university"
                            className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm" />
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Matriculation Number</label>
                        <input name="matricNumber" type="text" value={formData.matricNumber} onChange={handleChange} required placeholder="e.g. BU/1234/56"
                            className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Min 8 chars"
                                className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Confirm Password</label>
                            <input name="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={handleChange} required placeholder="••••••••"
                                className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold tracking-wider text-sm" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="terms" name="terms" checked={formData.terms} onCheckedChange={(checked) => setFormData(p => ({ ...p, terms: checked as boolean }))} />
                        <label htmlFor="terms" className="text-xs text-gray-400">
                            I agree to the <Link href="/terms" className="text-orange-500 hover:underline">Terms</Link> and <Link href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>
                    <div className="pt-4">
                        <Button type="submit" disabled={isLoading}
                            className="w-full h-14 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)]">
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Create Account"}
                        </Button>
                    </div>
                </form>

                <div className="relative py-6 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-[#2a2a2a]" />
                    <span className="relative bg-[#1a1a1a] px-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Or</span>
                </div>

                <Button type="button" onClick={handleGoogleAuth} disabled={googleLoading}
                    className="w-full h-14 bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3">
                    {googleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Globe className="h-5 w-5" />Sign up with Google</>}
                </Button>

                <div className="text-center pt-8 mt-6 border-t border-[#2a2a2a]">
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                        Already have an account? <Link href="/login" className="text-orange-500 font-black ml-1 hover:opacity-80">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
