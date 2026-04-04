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
    const { user, loading, refreshUser } = useAuth();
    const router = useRouter();
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
            toast('Secure authorization detected! Authenticating...', 'success');
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
            toast('Please fill out all required fields to initiate transfer.', 'error');
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
                    toast(`Database Error: ${error.message}`, 'error');
                    throw error;
                }
                throw error;
            }
            toast('Secure access code transmitted. Monitor your inbox.', 'success');
            setCountdown(1800);
            setStep(2);
        } catch (error: any) {
            if (error.message?.includes('rate limit')) {
                toast('Transmission rate limited. Stand by.', 'error');
            } else if (error.message?.includes('invalid')) {
                toast('Invalid endpoint format.', 'error');
            } else if (error.message?.includes('Database error')) {
                toast('Central server synchronization error.', 'error');
            } else {
                toast('Transmission failed. Retry.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-black text-white relative selection:bg-[#FF6200] selection:text-black overflow-hidden">
            {/* Background Grid & Ambient Glow */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF6200]/10 rounded-full blur-[150px] pointer-events-none z-0" />
            
            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse shadow-[0_0_15px_rgba(255,98,0,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 font-heading">Secure Onboarding Portal</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Enter The <span className="text-[#FF6200]">Network</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2 italic shadow-sm">
                        Establishing merchant identity credentials
                    </p>
                </div>

                <div className="glass-card bg-zinc-950/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Briefcase className="h-40 w-40 text-white" />
                    </div>

                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 relative z-10">
                            
                            <div className="grid grid-cols-1 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] font-heading">Full Identity</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-focus-within/input:bg-[#FF6200]/20 transition-colors">
                                            <User className="h-4 w-4 text-white/40 group-focus-within/input:text-[#FF6200] transition-colors" />
                                        </div>
                                        <input 
                                            value={formData.fullName} 
                                            onChange={e => setFormData(p => ({...p, fullName: e.target.value}))} 
                                            className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm" 
                                            placeholder="Enter registered name..." 
                                        />
                                    </div>
                                </div>

                                {/* School Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] font-heading">Institutional Endpoint (Email)</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-focus-within/input:bg-[#FF6200]/20 transition-colors">
                                            <Mail className="h-4 w-4 text-white/40 group-focus-within/input:text-[#FF6200] transition-colors" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={formData.email} 
                                            onChange={e => setFormData(p => ({...p, email: e.target.value}))} 
                                            className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm" 
                                            placeholder="student@university.edu.ng" 
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] font-heading">Secure Comms Line (WhatsApp)</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-focus-within/input:bg-[#FF6200]/20 transition-colors">
                                            <Phone className="h-4 w-4 text-white/40 group-focus-within/input:text-[#FF6200] transition-colors" />
                                        </div>
                                        <input 
                                            value={formData.phoneNumber} 
                                            onChange={e => setFormData(p => ({...p, phoneNumber: e.target.value}))} 
                                            className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold tracking-wider text-sm" 
                                            placeholder="e.g. 0801234..." 
                                        />
                                    </div>
                                </div>

                                {/* Private University Dropdown */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] font-heading">Base of Operations (Campus)</label>
                                    <div className="relative group/input">
                                        <select 
                                            value={formData.university} 
                                            onChange={e => setFormData(p => ({...p, university: e.target.value}))} 
                                            className={cn(
                                                "w-full h-16 pl-6 pr-12 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-[#FF6200]/50 focus:bg-[#FF6200]/5 transition-all font-bold text-sm tracking-wider appearance-none cursor-pointer",
                                                !formData.university && "text-white/20"
                                            )}
                                        >
                                            <option value="" disabled className="text-black">Select active campus...</option>
                                            {PRIVATE_UNIVERSITIES.map(u => <option key={u} value={u} className="text-black font-bold">{u}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none group-hover/input:text-white transition-colors" />
                                    </div>
                                </div>

                                {formData.university === 'Other Abuja Private University' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] uppercase font-black text-[#FF6200] tracking-[0.2em] font-heading">Specify Classified Node</label>
                                        <input 
                                            value={formData.universityOther} 
                                            onChange={e => setFormData(p => ({...p, universityOther: e.target.value}))} 
                                            className="w-full h-16 px-6 bg-[#FF6200]/5 border border-[#FF6200]/20 rounded-2xl text-[#FF6200] placeholder:text-[#FF6200]/30 focus:outline-none focus:border-[#FF6200]/70 focus:bg-[#FF6200]/10 transition-all font-bold tracking-wider text-sm" 
                                            placeholder="Enter campus designation..." 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-6">
                                <Link href="/signup" className="group hidden sm:flex text-white/40 hover:text-white uppercase text-[10px] items-center font-black tracking-[0.3em] transition-colors shrink-0">
                                    <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Abort
                                </Link>
                                
                                <Button 
                                    onClick={handleSendMagicLink} 
                                    disabled={isSubmitting} 
                                    className="w-full h-20 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_15px_45px_rgba(255,98,0,0.3)] hover:shadow-[0_20px_50px_rgba(255,98,0,0.4)] transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500 rounded-2xl" />
                                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6 relative z-10" /> : (
                                        <div className="flex items-center relative z-10">
                                            Initiate Handshake <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 text-center py-10 relative z-10">
                            
                            <div className="mx-auto h-32 w-32 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-[#FF6200]/20 rounded-full animate-ping [animation-duration:3s]" />
                                <div className="relative z-10 h-24 w-24 bg-gradient-to-br from-[#FF6200] to-[#FF4500] rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,98,0,0.6)]">
                                    <Mail className="h-10 w-10 text-black" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic font-heading">Transmission <span className="text-[#FF6200]">Sent</span></h2>
                                <p className="text-[10px] uppercase font-black text-white/50 tracking-[0.3em]">Access protocols deployed</p>
                            </div>
                            
                            <div className="bg-black border border-white/10 p-8 rounded-[2rem] text-sm font-medium text-white/60 leading-relaxed max-w-sm mx-auto space-y-4">
                                <p>We transmitted a 256-bit cryptographic access link to:</p>
                                <div className="bg-white/5 py-4 px-6 rounded-2xl border border-white/5 text-white/90 text-lg font-black tracking-wider break-all shadow-inner">
                                    {formData.email}
                                </div>
                                <p className="italic">Click the embedded authorization terminal in that email to proceed instantly.</p>
                                
                                <div className="pt-6 border-t border-white/10">
                                    <span className="text-[#FF6200] font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Signature validity: {formatTime(countdown)}</span>
                                </div>
                            </div>

                            <div className="pt-6 max-w-sm mx-auto space-y-4">
                                <Button 
                                    variant="outline" 
                                    onClick={handleSendMagicLink} 
                                    disabled={isSubmitting} 
                                    className="w-full h-16 border border-white/10 bg-transparent text-white/60 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/5 transition-all shadow-sm"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Packet Dropped? Resend"}
                                </Button>
                                
                                <Button 
                                    variant="link" 
                                    onClick={() => setStep(1)} 
                                    className="w-full uppercase text-[10px] font-black tracking-widest text-white/30 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="mr-3 h-3.5 w-3.5" /> Modify Contact Vector
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
