'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, Check, ArrowLeft, ArrowRight, Mail, Globe, Eye, EyeOff, ShieldCheck, User as UserIcon, Briefcase, Zap, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';
import { NIGERIAN_STATES, NIGERIAN_UNIVERSITIES, UNIVERSITIES_BY_STATE } from '@/lib/constants';
import { ImageUpload } from '@/components/ImageUpload';
import { School, Search } from 'lucide-react';



function SignupContent() {
    const router = useRouter();
    const { refreshUser, signInWithGoogle } = useAuth();

    const searchParams = useSearchParams();
    const initialRole = searchParams.get('role') as 'customer' | 'dealer' | 'admin' | 'student_buyer' | 'student_seller' | null;

    // Steps
    const [step, setStep] = useState<'role' | 'details' | 'auth-method' | 'admin-code' | 'admin-dept'>(() => {
        if (initialRole === 'dealer' || initialRole === 'customer') return 'auth-method';
        if (initialRole === 'admin') return 'admin-code';
        return 'role';
    });

    const [role, setRole] = useState<'student_buyer' | 'student_seller' | 'admin' | 'customer' | 'dealer'>(() => {
        if (initialRole === 'dealer' || initialRole === 'student_seller') return 'student_seller';
        if (initialRole === 'admin') return 'admin';
        return 'student_buyer';
    });

    // Admin Flow
    const [adminCode, setAdminCode] = useState('');
    const [adminDept, setAdminDept] = useState<'technical' | 'operations' | 'marketing' | null>(null);

    // Form
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: 'FCT - Abuja',
        businessName: '',
        matricNumber: '',
        department: '',
        university: '',
        phoneNumber: '',
        studentIdUrl: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const [isDetectingSchool, setIsDetectingSchool] = useState(false);
    const [missingUni, setMissingUni] = useState(false);
    const [missingUniName, setMissingUniName] = useState('');

    // AI-Simulated University Detection
    const detectUniversity = async (matric: string) => {
        if (!matric || matric.length < 3) return;

        setIsDetectingSchool(true);
        // Simulate API/AI delay
        await new Promise(r => setTimeout(r, 1200));

        const upper = matric.toUpperCase();
        let detected = '';

        if (upper.includes('LASU')) detected = 'Lagos State University (LASU)';
        else if (upper.includes('UOL') || upper.includes('UNILAG')) detected = 'University of Lagos (UNILAG)';
        else if (upper.includes('ABU')) detected = 'Ahmadu Bello University (ABU)';
        else if (upper.includes('OAU')) detected = 'Obafemi Awolowo University (OAU)';
        else if (upper.includes('UNIABUJA')) detected = 'University of Abuja (UNIABUJA)';
        else if (upper.includes('BAZE')) detected = 'Baze University';
        else if (upper.includes('NILE')) detected = 'Nile University';
        else if (upper.includes('VERITAS')) detected = 'Veritas University';
        // Generic patterns
        else if (upper.startsWith('19/') || upper.startsWith('20/') || upper.startsWith('21/') || upper.startsWith('22/')) {
            // Very weak heuristic for modern private unis in Abuja, acting as a "guess"
            // Don't auto-fill if unsure to avoid annoyance
        }

        if (detected) {
            setFormData(prev => ({ ...prev, university: detected }));
        }
        setIsDetectingSchool(false);
    };


    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (selectedRole: 'student_buyer' | 'student_seller' | 'admin') => {
        setRole(selectedRole);
        if (['student_seller', 'dealer', 'student_buyer', 'customer'].includes(selectedRole)) setStep('auth-method');
        else if (selectedRole === 'admin') setStep('admin-code');
    };

    const [uniSearch, setUniSearch] = useState('');

    const filteredUniversities = (formData.location && UNIVERSITIES_BY_STATE[formData.location]
        ? UNIVERSITIES_BY_STATE[formData.location]
        : NIGERIAN_UNIVERSITIES
    ).filter(uni => uni.toLowerCase().includes(uniSearch.toLowerCase()));

    const StepProgress = ({ currentStep, role }: { currentStep: string, role: string }) => {
        const steps = ['student_seller', 'dealer'].includes(role)
            ? ['Access', 'Identity', 'Verification']
            : (role === 'admin' ? ['Access', 'Sector', 'Identity'] : ['Access', 'Identity']);

        // Simplified mapping for the UI
        let activeIdx = 0;
        if (currentStep === 'role' || currentStep === 'admin-code' || currentStep === 'auth-method') activeIdx = 0;
        else if (currentStep === 'details') activeIdx = 1;
        else activeIdx = steps.length - 1;

        return (
            <div className="flex items-center justify-center gap-4 mb-12">
                {steps.map((s, i) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`h-2 w-12 rounded-full transition-all duration-500 ${i <= activeIdx ? 'bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.5)]' : 'bg-zinc-800'}`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${i <= activeIdx ? 'text-[#FFB800]' : 'text-zinc-600'}`}>{s}</span>
                        </div>
                        {i < steps.length - 1 && <div className="h-[1px] w-4 bg-zinc-900 mb-4" />}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const handleAdminCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminCode === '1029384756') {
            setStep('admin-dept');
            setError('');
        } else {
            setError('INVALID ACCESS CREDENTIALS');
        }
    };

    const handleDeptSelect = (dept: 'technical' | 'operations' | 'marketing') => {
        setAdminDept(dept);
        router.push(`/admin/signup?dept=${dept}`);
    };

    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords mismatch.");
            setIsLoading(false);
            return;
        }

        if (!agreedToTerms) {
            setError("You must agree to the Terms and Privacy Policy (NDPA Compliant).");
            setIsLoading(false);
            return;
        }

        const isMerchant = ['student_seller', 'dealer'].includes(role);

        if (isMerchant && (!formData.university && !missingUniName)) {
            setError("Please specify your university.");
            setIsLoading(false);
            return;
        }

        if (isMerchant && !formData.matricNumber) {
            setError("Matriculation number is required for student verification.");
            setIsLoading(false);
            return;
        }

        if (isMerchant && !formData.studentIdUrl) {
            setError("Please upload your student ID card for verification.");
            setIsLoading(false);
            return;
        }

        await createAccount();
    };

    const createAccount = async () => {
        try {
            const emailToUse = normalizeIdentifier(formData.email);
            const finalUniversity = missingUni ? missingUniName : formData.university;

            // 1. Auth Sign Up
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: emailToUse,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        role: role,
                        location: formData.location,
                        university: finalUniversity,
                        matric_number: formData.matricNumber
                    },
                },
            });

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error("Account creation protocol failed.");

            const isMerchant = ['student_seller', 'dealer'].includes(role);
            // 2. Profile Upsert
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: emailToUse,
                    display_name: formData.displayName,
                    role: role,
                    location: formData.location,
                    phone_number: formData.phoneNumber,
                    business_name: isMerchant ? formData.businessName : null,
                    university: finalUniversity,
                    matric_number: isMerchant ? formData.matricNumber : null,
                    subscription_status: isMerchant ? 'pending_verification' : 'active',
                    is_verified: false,
                    // Store extra student data in metadata for safety if columns don't exist
                    metadata: {
                        department: formData.department,
                        student_id_url: formData.studentIdUrl,
                        is_manual_override: missingUni
                    }
                });

            if (profileError) console.error("Profile establishing error:", profileError);

            await refreshUser(authData.user.id);

            if (['student_seller', 'dealer'].includes(role)) {
                // Future-proof: Redirect to a "verification pending" screen if needed
                router.push('/dealer/dashboard');
            } else {
                router.push('/listings');
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Protocol establishing failed.";
            setError(message);
            setIsLoading(false);
        }
    };

    // UI Renders
    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden relative">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFB800]/5 blur-[120px] rounded-full" />

                <div className="w-full max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-colors py-3">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
                        </Link>
                        <div className="flex justify-center mb-6">
                            <Logo showText={false} className="scale-125" />
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic mb-4">Join MarketBridge</h1>
                        <p className="text-zinc-500 font-medium lowercase italic">select your status to begin identity establishment</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-4xl mx-auto">
                        {[
                            { id: 'student_buyer', title: 'Student Buyer', icon: UserIcon, desc: 'Browse & Buy Assets', color: 'text-blue-400' },
                            { id: 'student_seller', title: 'Student Merchant', icon: Briefcase, desc: 'Start your Campus Business', color: 'text-[#FFB800]' },
                            { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Operations Gateway', color: 'text-red-400' }
                        ].map(item => (
                            <Card
                                key={item.id}
                                className="glass-card border-white/5 rounded-[2rem] p-8 text-center group cursor-pointer hover:bg-white/[0.08] hover:translate-y-[-8px] transition-all duration-500"
                                onClick={() => handleRoleSelect(item.id as any)}
                            >
                                <div className="h-16 w-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">{item.title}</h3>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }





    if (step === 'admin-code') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/50 shadow-[0_0_20px_red]" />
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-600 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="mx-auto h-16 w-16 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-red-500">Restricted</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">enter administrative access key</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        {error && <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-500/20">{error}</div>}
                        <form onSubmit={handleAdminCodeSubmit} className="space-y-6">
                            <input
                                type="password"
                                className="w-full h-16 bg-black border border-white/5 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-red-500"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                                required
                            />
                            <Button type="submit" className="w-full h-16 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                                Authorize
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'admin-dept') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-2xl glass-card border-none rounded-[3rem] p-12 text-white">
                    <CardHeader className="p-0 text-center mb-12">
                        <CardTitle className="text-4xl font-black uppercase italic tracking-tighter mb-2">Select Sector</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">Define your administrative jurisdiction</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { id: 'marketing', title: 'Marketing', icon: Zap, color: 'text-orange-400' },
                            { id: 'operations', title: 'Operations', icon: Briefcase, desc: 'Ops & Escrow', color: 'text-red-400' },
                            { id: 'technical', title: 'Technical', icon: Loader2, desc: 'System Core', color: 'text-blue-400' }
                        ].map(dept => (
                            <button
                                key={dept.id}
                                onClick={() => handleDeptSelect(dept.id as any)}
                                className="glass-card p-8 rounded-3xl border-white/5 hover:bg-white/5 transition-all group flex flex-col items-center gap-4 text-center"
                            >
                                <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <dept.icon className={`h-7 w-7 ${dept.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase italic tracking-tight">{dept.title}</h4>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Management</p>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }



    if (step === 'auth-method') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black">
                <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-[#FFB800]/5 blur-[40px] rounded-full" />
                    <CardHeader className="p-0 text-center mb-10">
                        <Button variant="ghost" onClick={() => setStep('role')} className="text-zinc-600 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2">Verification Channel</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic lowercase">choose your identity entry point</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6 pb-8">
                        <Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest group transition-all" onClick={signInWithGoogle}>
                            <Globe className="mr-3 h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" /> Google Identity Hub
                        </Button>
                        <div className="relative flex items-center justify-center py-4">
                            <div className="absolute inset-x-0 h-px bg-white/5"></div>
                            <span className="relative bg-black px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-800">Protocol Selection</span>
                        </div>
                        <Button className="w-full h-16 rounded-[1.5rem] bg-white border border-white/10 text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all" onClick={() => setStep('details')}>
                            <Mail className="mr-3 h-5 w-5" /> Direct Email Path
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-black relative">
            <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-[#FFB800]/5 blur-[120px] rounded-full" />

            <Card className="w-full max-w-xl glass-card border-none rounded-[3rem] p-12 text-white relative z-10 shadow-2xl">
                <CardHeader className="p-0 mb-8 text-left">
                    <div className="flex justify-between items-start mb-6">
                        <Button variant="ghost" onClick={() => setStep('auth-method')} className="text-zinc-600 hover:text-white p-0 h-auto text-[10px] font-black uppercase tracking-widest"><ArrowLeft className="mr-2 h-3 w-3" /> Back</Button>
                        <Logo showText={false} className="opacity-50" />
                    </div>

                    <StepProgress currentStep={step} role={role} />

                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter mb-2">Establish Identity</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium italic lowercase">
                        {role === 'dealer' ? `Establishing verified student node` : "Please define your global attributes"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl border border-red-500/20 text-center mb-6 animate-pulse">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Full Name</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                    <input name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="SAMUEL ADE" className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Email Identity</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="FOUNDER@MARKET.IO" className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Secure Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                    <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required className="w-full h-14 pl-14 pr-14 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-800 hover:text-[#FFB800]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Confirm Key</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                    <input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Operational Region</label>
                            <div className="relative group">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors z-10" />
                                <select
                                    name="location"
                                    className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase relative"
                                    value={formData.location}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                        setFormData({ ...formData, location: e.target.value, university: '' });
                                        setUniSearch('');
                                    }}
                                    required
                                >
                                    <option value="" className="bg-zinc-900">Select Node State</option>
                                    {NIGERIAN_STATES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {role === 'dealer' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Business / Brand Name</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                        <input
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase transition-all"
                                            placeholder="CAMPUS KICKS"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Matriculation Number (Required)</label>
                                        <div className="relative group">
                                            <School className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                            <input
                                                name="matricNumber"
                                                value={formData.matricNumber}
                                                onChange={handleChange}
                                                required
                                                onBlur={(e) => detectUniversity(e.target.value)}
                                                className="w-full h-14 pl-14 pr-12 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase transition-all"
                                                placeholder="U/2024/..."
                                            />
                                            {isDetectingSchool && (
                                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FFB800]" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Department (Optional)</label>
                                        <div className="relative group">
                                            <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                            <input
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                placeholder="COMPUTER SCIENCE"
                                                className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center ml-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600">University / Campus Node</label>
                                        <button
                                            type="button"
                                            onClick={() => setMissingUni(!missingUni)}
                                            className="text-[8px] font-black text-[#FFB800] uppercase tracking-widest hover:underline"
                                        >
                                            {missingUni ? "Back to List" : "Uni not listed?"}
                                        </button>
                                    </div>

                                    {!missingUni ? (
                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="SEARCH YOUR INSTITUTION..."
                                                    value={uniSearch}
                                                    onChange={(e) => setUniSearch(e.target.value)}
                                                    className="w-full h-14 pl-14 pr-10 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase text-xs"
                                                />
                                            </div>

                                            <div className="relative group">
                                                <select
                                                    name="university"
                                                    value={formData.university}
                                                    onChange={(e) => setFormData(p => ({ ...p, university: e.target.value }))}
                                                    className="w-full h-14 pl-6 pr-10 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase appearance-none transition-all"
                                                    required
                                                >
                                                    <option value="" className="bg-zinc-900 font-medium">
                                                        {formData.location ? `Select Official Node in ${formData.location}...` : "Select Region Above First..."}
                                                    </option>
                                                    {filteredUniversities.length > 0 ? (
                                                        filteredUniversities.map(uni => (
                                                            <option key={uni} value={uni} className="bg-zinc-900 font-medium">{uni}</option>
                                                        ))
                                                    ) : (
                                                        <option disabled className="bg-zinc-900 text-zinc-700 italic">No matching institutions found in this region</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 p-6 bg-white/5 border border-white/5 rounded-3xl animate-in zoom-in-95 duration-300">
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">Request New Institution Node</p>
                                            <input
                                                value={missingUniName}
                                                onChange={(e) => setMissingUniName(e.target.value)}
                                                placeholder="ENTER FULL UNIVERSITY NAME"
                                                className="w-full h-14 bg-black border border-white/10 rounded-2xl px-6 text-white font-bold uppercase outline-none focus:border-[#FFB800]"
                                            />
                                            <p className="text-[8px] text-zinc-600 italic">Admin will review and enable this node within 24 hours.</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-4">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2 block">Upload Student ID Card</label>
                                        <div className="glass-card rounded-3xl border border-white/10 p-2 group hover:border-[#FFB800]/30 transition-colors">
                                            {formData.studentIdUrl ? (
                                                <div className="relative group overflow-hidden rounded-2xl">
                                                    <img src={formData.studentIdUrl} alt="ID Card" className="h-40 w-full object-cover rounded-2xl" />
                                                    <button type="button" onClick={() => setFormData({ ...formData, studentIdUrl: '' })} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-black uppercase text-[10px]">Remove</button>
                                                </div>
                                            ) : (
                                                <div className="h-32">
                                                    <ImageUpload
                                                        onImagesSelected={(urls: string[]) => {
                                                            if (urls && urls.length > 0) setFormData({ ...formData, studentIdUrl: urls[0] });
                                                        }}
                                                        maxImages={1}
                                                        bucketName="identity"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {role !== 'dealer' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Mobile Comms</label>
                                <div className="relative group">
                                    <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FFB800] transition-colors" />
                                    <input
                                        name="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="080..."
                                        className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FFB800]/50 outline-none font-bold uppercase text-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {role === 'dealer' && (
                            <div className="space-y-6 pt-6 border-t border-white/5 animate-in fade-in duration-700 delay-100">
                                <div className="glass-card p-8 rounded-[2rem] border border-white/5 text-center bg-gradient-to-b from-[#FFB800]/5 to-transparent relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFB800]/20 to-transparent" />
                                    <Sparkles className="h-6 w-6 text-[#FFB800] mx-auto mb-4" />
                                    <p className="text-[10px] uppercase font-black text-[#FFB800] mb-2 tracking-[0.2em]">Verification Protocol</p>
                                    <p className="text-zinc-500 text-[9px] font-bold uppercase leading-relaxed">
                                        Your account will enter a <span className="text-white">PENDING</span> status for admin security oversight.
                                        Once your Student ID is verified, your dealership node will be activated.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start md:items-center gap-4 pt-6 border-t border-white/5">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 md:mt-0 h-5 w-5 rounded-lg border-white/10 bg-zinc-950 checked:bg-[#FFB800] checked:text-black focus:ring-[#FFB800]/50 transition-all"
                            />
                            <label htmlFor="terms" className="text-[11px] text-zinc-600 font-bold leading-tight">
                                I verify compliance with the <Link href="/legal/terms" className="text-zinc-400 hover:text-white underline decoration-[#FFB800]/40 decoration-1 underline-offset-4 transition-colors">Terms of Engagement</Link> & <Link href="/legal/privacy" className="text-zinc-400 hover:text-white underline decoration-[#FFB800]/40 decoration-1 underline-offset-4 transition-colors">Global Privacy Protocol</Link> (NDPA 2023 Compliant).
                            </label>
                        </div>

                        <Button type="submit" className="w-full h-18 bg-gold-gradient text-black font-black uppercase tracking-widest rounded-[1.5rem] glow-on-hover border-none mt-4 text-xs group" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                <span className="flex items-center gap-3">
                                    {role === 'dealer' ? 'Initialize Verification' : 'Establish Identity Node'}
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#FFB800]" /></div>}><SignupContent /></Suspense>;
}
