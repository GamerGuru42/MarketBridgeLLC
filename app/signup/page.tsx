'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ArrowRight, User as UserIcon, Globe, Mail, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';

const UNIVERSITIES = [
    'Baze University',
    'Nile University of Nigeria',
    'Veritas University',
    'University of Abuja',
    'NOUN',
    'Nigerian Defence Academy',
    'Other'
];

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const { signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        passwordConfirm: '',
        university: '',
        otherUniversity: '',
        matricNumber: '',
        role: 'student_buyer',
        terms: false
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleRoleChange = (role: 'student_buyer' | 'student_seller') => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=${formData.role}`);
        } catch (error: any) {
            toast(error.message || 'Google Auth failed', 'error');
            setGoogleLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Passwords do not match.', 'error');
            return;
        }
        
        // Password strength validation
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(formData.password)) {
            toast('Password must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.', 'error');
            return;
        }

        if (!formData.terms) {
            toast('You must accept the terms and conditions.', 'error');
            return;
        }

        const normalizedEmail = normalizeIdentifier(formData.email);

        if (formData.role === 'student_seller' && !normalizedEmail.endsWith('.edu.ng')) {
            toast('Sellers must use a school email ending in .edu.ng.', 'error');
            return;
        }

        const finalUniversity = formData.university === 'Other' ? formData.otherUniversity : formData.university;
        if (!finalUniversity) {
            toast('Please specify your university.', 'error');
            return;
        }

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
                        role: formData.role,
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
                    role: formData.role,
                    university: finalUniversity,
                    matric_number: formData.matricNumber,
                    email_verified: false,
                });

                if (profileError) throw profileError;

                router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
            }
        } catch (error: any) {
            toast(error.message || 'Registration failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-8 md:py-12 bg-background text-foreground relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0" />
            <div className="w-full max-w-xl glass-card bg-card/80 border border-border shadow-2xl rounded-3xl md:rounded-[3rem] p-5 md:p-10 lg:p-14 relative z-10 m-auto mt-8 mb-8">
                <div className="text-center mb-10 space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading leading-none">
                        Create <span className="text-primary">Account</span>
                    </h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] italic">
                        Join MarketBridge Today
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    
                    {/* Role Selection (Radio) */}
                    <div className="flex gap-4 mb-6">
                        <label className={`flex-1 flex flex-col items-center justify-center border-2 rounded-2xl p-4 cursor-pointer transition-all ${formData.role === 'student_buyer' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/50'}`}>
                            <input type="radio" name="role" value="student_buyer" className="hidden" checked={formData.role === 'student_buyer'} onChange={() => handleRoleChange('student_buyer')} />
                            <UserIcon className="h-6 w-6 mb-2" />
                            <span className="font-black uppercase tracking-widest text-xs">Buyer</span>
                        </label>
                        <label className={`flex-1 flex flex-col items-center justify-center border-2 rounded-2xl p-4 cursor-pointer transition-all ${formData.role === 'student_seller' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/50'}`}>
                            <input type="radio" name="role" value="student_seller" className="hidden" checked={formData.role === 'student_seller'} onChange={() => handleRoleChange('student_seller')} />
                            <BookOpen className="h-6 w-6 mb-2" />
                            <span className="font-black uppercase tracking-widest text-xs">Seller</span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground"><UserIcon className="h-4 w-4" /></div>
                            <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" className="w-full h-14 pl-14 pr-6 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground"><Mail className="h-4 w-4" /></div>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@address.com" className="w-full h-14 pl-14 pr-6 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">University</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground"><GraduationCap className="h-4 w-4" /></div>
                            <select name="university" value={formData.university} onChange={handleChange} required className="w-full h-14 pl-14 pr-6 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm appearance-none">
                                <option value="" disabled>Select your university</option>
                                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {formData.university === 'Other' && (
                        <div className="space-y-2">
                            <input name="otherUniversity" type="text" value={formData.otherUniversity} onChange={handleChange} required placeholder="Specify your university" className="w-full h-14 px-6 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Matriculation Number</label>
                        <input name="matricNumber" type="text" value={formData.matricNumber} onChange={handleChange} required placeholder="e.g. BU/1234/56" className="w-full h-14 px-6 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Min 8 chars" className="w-full h-14 px-6 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading">Confirm Password</label>
                            <input name="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={handleChange} required placeholder="••••••••" className="w-full h-14 px-6 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="terms" name="terms" checked={formData.terms} onCheckedChange={(checked) => setFormData(p => ({ ...p, terms: checked as boolean }))} />
                        <label htmlFor="terms" className="text-xs text-muted-foreground">
                            I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all">
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Create Account"}
                        </Button>
                    </div>
                </form>

                <div className="relative py-6 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-border" />
                    <span className="relative bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Or</span>
                </div>

                <Button type="button" onClick={handleGoogleAuth} disabled={googleLoading} className="w-full h-14 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all">
                    {googleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Globe className="h-5 w-5" />Sign up with Google</>}
                </Button>

                <div className="text-center pt-8 mt-6 border-t border-border">
                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                        Already have an account? <Link href="/login" className="text-primary font-black ml-1 hover:opacity-80">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
