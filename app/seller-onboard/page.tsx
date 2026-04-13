'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight, Mail, User, Phone, Briefcase, ChevronDown } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const PRIVATE_UNIVERSITIES = [
    "African University of Science and Technology (AUST)",
    "Al-Muhibbah Open University",
    "Amaj University",
    "Baze University",
    "British Canadian University",
    "Cosmopolitan University",
    "Eranova University",
    "European University of Nigeria (EUN)",
    "Leadership University",
    "Miva Open University",
    "Nile University of Nigeria",
    "Philomath University",
    "Prime University",
    "Veritas University",
    "Other Abuja Private University"
];

export default function SellerOnboardPage() {
    const { toast } = useToast();
    const { user, loading, refreshUser, signInWithGoogle } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [countdown, setCountdown] = useState(1800);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        university: '',
        universityOther: '',
        phoneNumber: ''
    });

    // Show error from auth callback redirect (e.g. non-.edu.ng email)
    const searchParams = useSearchParams();
    useEffect(() => {
        const errorMsg = searchParams.get('error');
        if (errorMsg) {
            toast(errorMsg, 'error');
            // Clean up the URL without reloading
            window.history.replaceState({}, '', '/seller-onboard');
        }
    }, [searchParams, toast]);

    useEffect(() => {
        if (!loading && user) {
            router.push('/seller-setup/bank');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            toast('Signed in successfully! Setting up your account...', 'success');
            setTimeout(() => {
                refreshUser();
            }, 1000);
        }
    }, [refreshUser, toast]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 2 && countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=student_seller&next=/seller-setup/bank`);
        } catch (error: any) {
            toast(error.message || 'Google Sign-In failed. Please try again.', 'error');
            setIsGoogleLoading(false);
        }
    };

    const handleSendMagicLink = async () => {
        const uni = formData.university === 'Other Abuja Private University' ? formData.universityOther : formData.university;
        if (!formData.fullName || !uni || !formData.email || !formData.phoneNumber) {
            toast('Please fill in all the fields to continue.', 'error');
            return;
        }

        // Validate school email
        const email = formData.email.toLowerCase().trim();
        if (!email.endsWith('.edu.ng')) {
            toast('Please use your school email address (ending in .edu.ng) to register as a seller.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/seller-setup/bank`,
                    data: {
                        display_name: formData.fullName,
                        full_name: formData.fullName,
                        university: uni,
                        phone_number: formData.phoneNumber,
                        role: 'student_seller'
                    }
                }
            });

            if (error) {
                if (error.message?.toLowerCase().includes('database') || error.message?.toLowerCase().includes('trigger')) {
                    toast(`Something went wrong on our end. Please try again later.`, 'error');
                    throw error;
                }
                throw error;
            }
            toast('Login link sent! Check your email inbox.', 'success');
            setCountdown(1800);
            setStep(2);
        } catch (error: any) {
            if (error.message?.includes('rate limit')) {
                toast('Too many attempts. Please wait a moment and try again.', 'error');
            } else if (error.message?.includes('invalid')) {
                toast('That email address doesn\'t look right. Please check and try again.', 'error');
            } else if (error.message?.includes('Database error')) {
                toast('Something went wrong on our end. Please try again later.', 'error');
            } else {
                toast('Couldn\'t send the login link. Please try again.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-background text-foreground relative selection:bg-primary selection:text-black overflow-hidden transition-colors duration-300">
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
            
            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(255,98,0,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground font-heading">Seller Registration</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading text-foreground">
                        Start <span className="text-primary">Selling</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 italic shadow-sm">
                        Create your seller account to reach students on campus
                    </p>
                </div>

                <div className="glass-card bg-card border border-border rounded-3xl md:rounded-[3rem] p-6 md:p-12 shadow-2xl relative">
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Briefcase className="h-40 w-40 text-foreground" />
                    </div>

                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 relative z-10">
                            
                            <div className="space-y-4">
                                {/* Google Sign-In Info */}
                                <div className="text-center mb-2">
                                    <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                                        Use your school Google account (<span className="text-primary font-bold">.edu.ng</span>) to sign up instantly
                                    </p>
                                </div>

                                <Button 
                                    onClick={handleGoogleLogin} 
                                    disabled={isSubmitting || isGoogleLoading} 
                                    className="w-full h-16 bg-card border border-border text-foreground hover:bg-secondary font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    {isGoogleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                        <>
                                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </Button>
                                    
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-border"></div>
                                    <span className="flex-shrink-0 mx-4 text-[10px] text-muted-foreground uppercase font-black tracking-widest">Or Register with Email</span>
                                    <div className="flex-grow border-t border-border"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] font-heading ml-2">Full Name</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background flex items-center justify-center group-focus-within/input:bg-primary/20 transition-colors">
                                            <User className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                        </div>
                                        <input 
                                            value={formData.fullName} 
                                            onChange={e => setFormData(p => ({...p, fullName: e.target.value}))} 
                                            className="w-full h-16 pl-16 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" 
                                            placeholder="Your full name" 
                                        />
                                    </div>
                                </div>

                                {/* School Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] font-heading ml-2">School Email</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background flex items-center justify-center group-focus-within/input:bg-primary/20 transition-colors">
                                            <Mail className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={formData.email} 
                                            onChange={e => setFormData(p => ({...p, email: e.target.value}))} 
                                            className="w-full h-16 pl-16 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" 
                                            placeholder="student@university.edu.ng" 
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground ml-2 tracking-wide">Must end in <span className="text-primary font-bold">.edu.ng</span> — only school emails are accepted for sellers</p>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] font-heading ml-2">WhatsApp Number</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background flex items-center justify-center group-focus-within/input:bg-primary/20 transition-colors">
                                            <Phone className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                        </div>
                                        <input 
                                            value={formData.phoneNumber} 
                                            onChange={e => setFormData(p => ({...p, phoneNumber: e.target.value}))} 
                                            className="w-full h-16 pl-16 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm" 
                                            placeholder="e.g. 08012345678" 
                                        />
                                    </div>
                                </div>

                                {/* University Dropdown */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] font-heading ml-2">University</label>
                                    <div className="relative group/input">
                                        <select 
                                            value={formData.university} 
                                            onChange={e => setFormData(p => ({...p, university: e.target.value}))} 
                                            className={cn(
                                                "w-full h-16 pl-6 pr-12 bg-secondary border border-border rounded-2xl focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold text-sm tracking-wider appearance-none cursor-pointer",
                                                !formData.university ? "text-muted-foreground" : "text-foreground"
                                            )}
                                        >
                                            <option value="" disabled>Select your university...</option>
                                            {PRIVATE_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none transition-colors" />
                                    </div>
                                </div>

                                {formData.university === 'Other Abuja Private University' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] uppercase font-black text-primary tracking-[0.2em] font-heading ml-2">University Name</label>
                                        <input 
                                            value={formData.universityOther} 
                                            onChange={e => setFormData(p => ({...p, universityOther: e.target.value}))} 
                                            className="w-full h-16 px-6 bg-primary/5 border border-primary/20 rounded-2xl text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary/70 focus:bg-primary/10 transition-all font-bold tracking-wider text-sm" 
                                            placeholder="Enter your university name..." 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-6">
                                <Link href="/signup" className="group hidden sm:flex text-muted-foreground hover:text-foreground uppercase text-[10px] items-center font-black tracking-[0.3em] transition-colors shrink-0">
                                    <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
                                </Link>
                                
                                <Button 
                                    onClick={handleSendMagicLink} 
                                    disabled={isSubmitting || isGoogleLoading} 
                                    className="flex-1 w-full h-20 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_15px_45px_rgba(255,98,0,0.3)] hover:shadow-[0_20px_50px_rgba(255,98,0,0.4)] transition-all flex items-center justify-center"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6 relative z-10" /> : (
                                        <>
                                            Create Account <ArrowRight className="ml-4 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 text-center py-10 relative z-10">
                            
                            <div className="mx-auto h-32 w-32 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:3s]" />
                                <div className="relative z-10 h-24 w-24 bg-gradient-to-br from-primary to-[#FF4500] rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,98,0,0.6)]">
                                    <Mail className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">Check Your <span className="text-primary">Email</span></h2>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">We sent you a login link</p>
                            </div>
                            
                            <div className="bg-background border border-border p-8 rounded-[2rem] text-sm font-medium text-muted-foreground leading-relaxed max-w-sm mx-auto space-y-4">
                                <p>We sent a login link to:</p>
                                <div className="bg-secondary py-4 px-6 rounded-2xl border border-border text-foreground text-lg font-black tracking-wider break-all shadow-inner">
                                    {formData.email}
                                </div>
                                <p className="italic">Click the link in that email to continue setting up your seller account.</p>
                                
                                <div className="pt-6 border-t border-border">
                                    <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Link expires in: {formatTime(countdown)}</span>
                                </div>
                            </div>

                            <div className="pt-6 max-w-sm mx-auto space-y-4">
                                <Button 
                                    variant="outline" 
                                    onClick={handleSendMagicLink} 
                                    disabled={isSubmitting} 
                                    className="w-full h-16 border-border bg-transparent text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-secondary transition-all shadow-sm"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Didn't get it? Resend"}
                                </Button>
                                
                                <Button 
                                    variant="link" 
                                    onClick={() => setStep(1)} 
                                    className="w-full uppercase text-[10px] font-black tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="mr-3 h-3.5 w-3.5" /> Change Email
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
