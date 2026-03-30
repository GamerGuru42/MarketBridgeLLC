'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight, Mail, User, Phone } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
    const { user, loading, refreshUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(1800);


    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        university: '',
        universityOther: '',
        phoneNumber: ''
    });

    useEffect(() => {
        if (!loading && user) {
            router.push('/seller-setup/bank');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            toast('Magic link detected! Verifying...', 'success');
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

    const handleSendMagicLink = async () => {
        const uni = formData.university === 'Other Abuja Private University' ? formData.universityOther : formData.university;
        if (!formData.fullName || !uni || !formData.email || !formData.phoneNumber) {
            toast('Please fill out all required fields.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('Initiating seller onboarding Auth for:', formData.email);
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/seller-setup/bank`,
                    data: {
                        display_name: formData.fullName,
                        full_name: formData.fullName, // Keep both for safety
                        university: uni,
                        phone_number: formData.phoneNumber,
                        role: 'student_seller'
                    }
                }
            });

            if (error) {
                console.error('Auth Error Details:', error);
                
                // Expose the raw database error so we can definitively debug missing columns or constraints
                if (error.message?.toLowerCase().includes('database') || error.message?.toLowerCase().includes('trigger')) {
                    console.error('CRITICAL DB TRIGGER FAILURE:', error.message);
                    toast(`Database Error: ${error.message}`, 'error');
                    throw error;
                }
                throw error;
            }
            toast('Magic link sent! Check your school email inbox.', 'success');
            setCountdown(1800);
            setStep(2);
        } catch (error: any) {
            console.error('OTP send failure:', error);
            // Show user-friendly messages instead of raw Supabase errors
            if (error.message?.includes('rate limit')) {
                toast('Too many attempts. Please wait a few minutes.', 'error');
            } else if (error.message?.includes('invalid')) {
                toast('Please check your email address format.', 'error');
            } else if (error.message?.includes('Database error')) {
                toast('Database sync error. Our team is investigating. Please try again shortly.', 'error');
            } else {
                toast('Failed to send code. Please check your connection and try again.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-background relative selection:bg-primary selection:text-black">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-8">
                    <Link href="/signup" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 uppercase text-[10px] font-black tracking-widest transition-colors">
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Signup
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic">
                        Become a <span className="text-primary">Seller</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2 text-sm">Verify your identity to start selling on campus.</p>
                </div>

                <div className="bg-card border border-border rounded-[2.5rem] p-8 backdrop-blur-sm shadow-xl relative overflow-hidden">
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <input value={formData.fullName} onChange={e => setFormData(p => ({...p, fullName: e.target.value}))} className="w-full h-14 pl-12 pr-4 bg-muted border border-input rounded-2xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="John Doe" />
                                </div>
                            </div>

                            {/* School Email */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">School Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} className="w-full h-14 pl-12 pr-4 bg-muted border border-input rounded-2xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="student@university.edu.ng" />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <input value={formData.phoneNumber} onChange={e => setFormData(p => ({...p, phoneNumber: e.target.value}))} className="w-full h-14 pl-12 pr-4 bg-muted border border-input rounded-2xl focus:ring-1 focus:ring-primary/40 font-medium text-sm" placeholder="080..." />
                                </div>
                            </div>

                            {/* Private University Dropdown */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Private University</label>
                                <select value={formData.university} onChange={e => setFormData(p => ({...p, university: e.target.value}))} className="w-full h-14 px-4 bg-muted border border-input rounded-2xl outline-none font-medium text-sm appearance-none">
                                    <option value="" disabled>Select your university</option>
                                    {PRIVATE_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            {formData.university === 'Other Private University' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground ml-2 tracking-widest">Specify University</label>
                                    <input value={formData.universityOther} onChange={e => setFormData(p => ({...p, universityOther: e.target.value}))} className="w-full h-14 px-4 bg-muted border border-input rounded-2xl font-medium text-sm" placeholder="University name" />
                                </div>
                            )}

                            <Button onClick={handleSendMagicLink} disabled={isSubmitting} className="w-full h-14 mt-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 border-none shadow-xl shadow-primary/20">
                                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center">Send Magic Link <ArrowRight className="ml-2 h-4 w-4" /></div>}
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-8">
                            <div className="mx-auto h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,98,0,0.15)]">
                                <Mail className="h-10 w-10 text-primary animate-bounce shadow-primary" />
                            </div>
                            
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">Check Your Inbox</h2>
                            
                            <div className="bg-muted border border-border p-6 rounded-2xl text-sm font-medium text-muted-foreground leading-relaxed shadow-inner">
                                We just sent a secure magic link to<br/>
                                <strong className="text-foreground text-lg py-2 block">{formData.email}</strong>
                                Click the link in that email to instantly verify your account and proceed to setup.
                                <br/><br/>
                                <span className="text-primary font-black uppercase tracking-widest text-[10px]">Link expires in {formatTime(countdown)}</span>
                            </div>

                            <Button variant="ghost" onClick={handleSendMagicLink} disabled={isSubmitting} className="w-full h-14 border border-border text-foreground font-bold uppercase text-[11px] tracking-widest rounded-2xl hover:bg-secondary mt-6 transition-colors shadow-sm">
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Didn't receive it? Resend Link"}
                            </Button>
                            
                            <Button variant="link" onClick={() => setStep(1)} className="uppercase text-[10px] font-black tracking-widest text-muted-foreground hover:text-foreground mt-4"><ArrowLeft className="mr-2 h-3.5 w-3.5" /> Use a different email</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
