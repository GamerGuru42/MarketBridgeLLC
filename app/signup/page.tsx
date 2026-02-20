'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, Check, ArrowLeft, ArrowRight, Mail, Globe, Eye, EyeOff, ShieldCheck, User as UserIcon, Briefcase, Zap, Lock, Sparkles, CheckCircle, School, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { ImageUpload } from '@/components/ImageUpload';

const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
];

const UNIVERSITIES: Record<string, string[]> = {
    'FCT - Abuja': [
        'University of Abuja (UNIABUJA)',
        'Baze University',
        'Nile University of Nigeria',
        'Veritas University',
        'African University of Science and Technology',
        'Bingham University (New Karu)'
    ],
    'Lagos': [
        'University of Lagos (UNILAG)',
        'Lagos State University (LASU)',
        'Pan-Atlantic University',
        'Caleb University',
        'Anchor University'
    ],
    'Oyo': [
        'University of Ibadan (UI)',
        'Ladoke Akintola University (LAUTECH)',
        'Lead City University',
        'Ajayi Crowther University',
        'Dominion University'
    ],
    'Enugu': [
        'University of Nigeria, Nsukka (UNN)',
        'Enugu State University of Science and Technology (ESUT)',
        'Godfrey Okoye University',
        'Caritas University'
    ],
    'Kaduna': [
        'Ahmadu Bello University (ABU)',
        'Kaduna State University (KASU)',
        'Air Force Institute of Technology',
        'Greenfield University'
    ]
};

const StepProgress = ({ currentStep, role }: { currentStep: string, role: string }) => {
    const steps = role === 'student_seller' || role === 'dealer'
        ? ['Profile', 'Business', 'ID Check', 'Terms']
        : ['Profile', 'Terms'];

    let activeIdx = 0;
    if (currentStep === 'profile') activeIdx = 0;
    else if (currentStep === 'business') activeIdx = 1;
    else if (currentStep === 'id_check') activeIdx = 2;
    else if (currentStep === 'terms') activeIdx = steps.length - 1;

    return (
        <div className="flex items-center justify-center gap-4 mb-12">
            {steps.map((s, i) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`h-2 w-12 rounded-full transition-all duration-500 ${i <= activeIdx ? 'bg-[#FF6200] shadow-[0_0_10px_rgba(255,98,0,0.5)]' : 'bg-zinc-800'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${i <= activeIdx ? 'text-[#FF6200]' : 'text-zinc-600'}`}>{s}</span>
                    </div>
                    {i < steps.length - 1 && <div className="h-[1px] w-4 bg-zinc-900 mb-4" />}
                </React.Fragment>
            ))}
        </div>
    );
};

function SignupContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();
    const role = searchParams.get('role') || 'buyer';
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState('profile');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
        businessName: '',
        phoneNumber: '',
        location: 'FCT - Abuja',
        university: '',
        matricNumber: '',
        department: '',
        studentIdUrl: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [uniSearch, setUniSearch] = useState('');
    const [isDetectingSchool, setIsDetectingSchool] = useState(false);
    const [missingUni, setMissingUni] = useState(false);
    const [missingUniName, setMissingUniName] = useState('');

    const universitiesInSelectedState = UNIVERSITIES[formData.location] || [];
    const filteredUniversities = universitiesInSelectedState.filter(u =>
        u.toLowerCase().includes(uniSearch.toLowerCase())
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const detectUniversity = (matric: string) => {
        if (!matric || matric.length < 3) return;
        setIsDetectingSchool(true);
        setTimeout(() => {
            const m = matric.toUpperCase();
            if (m.includes('UNIABUJA') || m.includes('U/'))
                setFormData(p => ({ ...p, university: 'University of Abuja (UNIABUJA)', location: 'FCT - Abuja' }));
            else if (m.includes('UNILAG'))
                setFormData(p => ({ ...p, university: 'University of Lagos (UNILAG)', location: 'Lagos' }));
            setIsDetectingSchool(false);
        }, 600);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast('Passwords do not match', 'error');
            return;
        }

        if (!agreedToTerms) {
            toast('You must agree to the terms', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const normalizedEmail = normalizeIdentifier(formData.email);
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role: role
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed - no user returned');

            // 2. Create profile in users table
            const { error: profileError } = await supabase.from('users').insert({
                id: authData.user.id,
                email: normalizedEmail,
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: role,
                business_name: formData.businessName,
                phone_number: formData.phoneNumber,
                university: missingUni ? missingUniName : formData.university,
                matric_number: formData.matricNumber,
                department: formData.department,
                photo_url: formData.studentIdUrl,
                location: formData.location,
                status: (role === 'student_seller' || role === 'dealer') ? 'pending' : 'active',
                email_verified: false
            });

            if (profileError) throw profileError;

            toast('Account initialized successfully', 'success');
            await refreshUser();
            router.push('/verify-email');
        } catch (err: any) {
            console.error('Signup error:', err);
            toast(err.message || 'Initialization failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 'profile') {
            if (!formData.email || !formData.password || !formData.firstName) {
                toast('Please complete profile fundamentals', 'error');
                return;
            }
            if (role === 'buyer' || role === 'ceo') setCurrentStep('terms');
            else setCurrentStep('business');
        } else if (currentStep === 'business') {
            setCurrentStep('id_check');
        } else if (currentStep === 'id_check') {
            if (!formData.studentIdUrl) {
                toast('ID Card upload required for secondary verification', 'error');
                return;
            }
            setCurrentStep('terms');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-10 sm:py-20 px-4 bg-black relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-2xl glass-card border-none rounded-[3rem] p-6 sm:p-12 text-white shadow-2xl relative z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/50 to-transparent" />

                <CardHeader className="p-0 text-center mb-10">
                    <div className="flex justify-center mb-8">
                        <Logo showText={false} className="scale-125 saturate-150 drop-shadow-[0_0_20px_rgba(255,102,0,0.3)]" />
                    </div>
                    <CardTitle className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
                        Establish <span className="text-[#FF6200]">Identity</span>
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium italic text-xs uppercase tracking-widest bg-white/5 py-2 px-6 rounded-full inline-block">
                        {role === 'student_seller' ? 'Seller Terminal Authorization' : role === 'buyer' ? 'Client Access Protocol' : role === 'dealer' ? 'Verified Dealer Onboarding' : 'Command Center Access'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <StepProgress currentStep={currentStep} role={role} />

                    <form onSubmit={handleSignup} className="space-y-8">
                        {currentStep === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Official First Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                                placeholder="Emeka"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Official Last Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                                placeholder="Okonkwo"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Access Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                            placeholder="operator@marketbridge.com.ng"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Security Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-14 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800 hover:text-white transition-colors">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Confirm Protocol</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="passwordConfirm"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.passwordConfirm}
                                                onChange={handleChange}
                                                required
                                                className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="button" onClick={nextStep} className="h-14 px-8 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all flex items-center gap-3">
                                        Next Protocol <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 'business' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Regional Node (State)</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <select
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold appearance-none transition-all cursor-pointer"
                                                required
                                            >
                                                <option value="" className="bg-zinc-900">Select Node State</option>
                                                {NIGERIAN_STATES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-focus-within:text-[#FF6200]">
                                                <ArrowRight className="h-4 w-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Jurisdiction</label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center text-lg">🇳🇬</div>
                                            <select className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer">
                                                <option>Nigeria</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                                <ArrowRight className="h-3 w-3 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Mobile Comms</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-3 border-r border-white/10">
                                            <Zap className="h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <span className="text-zinc-500 font-black text-[10px] tracking-widest">+234</span>
                                        </div>
                                        <input
                                            name="phoneNumber"
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            required
                                            placeholder="803 000 0000"
                                            className="w-full h-14 pl-24 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold text-xs transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Business / Brand Name</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                        <input
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            required
                                            className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                            placeholder="Campus Kicks"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">ID / Matriculation Number</label>
                                        <div className="relative group">
                                            <School className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="matricNumber"
                                                value={formData.matricNumber}
                                                onChange={handleChange}
                                                required
                                                onBlur={(e) => detectUniversity(e.target.value)}
                                                className="w-full h-14 pl-14 pr-12 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold transition-all"
                                                placeholder="U/2024/..."
                                            />
                                            {isDetectingSchool && (
                                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FF6200]" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Department (Optional)</label>
                                        <div className="relative group">
                                            <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                            <input
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                placeholder="Computer Science"
                                                className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold"
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
                                            className="text-[8px] font-black text-[#FF6200] uppercase tracking-widest hover:underline"
                                        >
                                            {missingUni ? "Back to List" : "Uni not listed?"}
                                        </button>
                                    </div>

                                    {!missingUni ? (
                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-800 group-focus-within:text-[#FF6200] transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search your institution..."
                                                    value={uniSearch}
                                                    onChange={(e) => setUniSearch(e.target.value)}
                                                    className="w-full h-14 pl-14 pr-10 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-900 focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold text-xs"
                                                />
                                            </div>

                                            <div className="relative group">
                                                <select
                                                    name="university"
                                                    value={formData.university}
                                                    onChange={(e) => setFormData(p => ({ ...p, university: e.target.value }))}
                                                    className="w-full h-14 pl-6 pr-10 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FF6200]/50 outline-none font-bold appearance-none transition-all"
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
                                                        <option disabled className="bg-zinc-900 text-zinc-700 italic">No matching institutions found</option>
                                                    )}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                                    <ArrowRight className="h-3 w-3 rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 p-6 bg-white/5 border border-white/5 rounded-3xl animate-in zoom-in-95 duration-300">
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">Request New Institution Node</p>
                                            <input
                                                value={missingUniName}
                                                onChange={(e) => setMissingUniName(e.target.value)}
                                                placeholder="Enter full university name"
                                                className="w-full h-14 bg-black border border-white/10 rounded-2xl px-6 text-white font-bold outline-none focus:border-[#FF6200]"
                                            />
                                            <p className="text-[8px] text-zinc-600 italic">Admin will review and enable this node within 24 hours.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button type="button" onClick={() => setCurrentStep('profile')} variant="ghost" className="text-zinc-600 hover:text-white font-black uppercase tracking-widest text-[10px]">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="h-14 px-8 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all flex items-center gap-3">
                                        Identity Verification <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 'id_check' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between ml-2">
                                            <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600 block">Upload Institution ID Card</label>
                                            {formData.studentIdUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, studentIdUrl: '' })}
                                                    className="text-[8px] font-black text-white uppercase tracking-widest hover:underline"
                                                >
                                                    Reset Upload
                                                </button>
                                            )}
                                        </div>

                                        <div className="glass-card rounded-[2rem] border border-white/10 p-4 group hover:border-[#FF6200]/30 transition-colors bg-zinc-950/50 mt-2">
                                            <ImageUpload
                                                onImagesSelected={(urls: string[]) => {
                                                    if (urls && urls.length > 0) setFormData({ ...formData, studentIdUrl: urls[0] });
                                                    else setFormData({ ...formData, studentIdUrl: '' });
                                                }}
                                                defaultImages={formData.studentIdUrl ? [formData.studentIdUrl] : []}
                                                maxImages={1}
                                                bucketName="identity"
                                                isIDCard={true}
                                            />
                                        </div>
                                        <p className="mt-4 text-[9px] text-zinc-500 font-bold uppercase leading-relaxed text-center px-6">
                                            Please upload a clear, horizontal photo of your current university ID card. Digital or expired IDs are not accepted.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button type="button" onClick={() => setCurrentStep('business')} variant="ghost" className="text-zinc-600 hover:text-white font-black uppercase tracking-widest text-[10px]">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="h-14 px-8 bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest rounded-2xl border-none transition-all flex items-center gap-3">
                                        Confirm Terms <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 'terms' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/5 text-center bg-gradient-to-b from-[#FF6200]/5 to-transparent relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/20 to-transparent" />
                                        <Sparkles className="h-6 w-6 text-[#FF6200] mx-auto mb-4" />
                                        <p className="text-[10px] uppercase font-black text-[#FF6200] mb-2 tracking-[0.2em]">Verification Protocol</p>
                                        <p className="text-zinc-500 text-[9px] font-bold uppercase leading-relaxed">
                                            {(role === 'student_seller' || role === 'dealer')
                                                ? "Your account will enter a PENDING status for admin security oversight. Once verified, your node will be activated."
                                                : "By initializing this account, you agree to our fair-trade policies and campus safety protocols."}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-4 p-6 bg-zinc-950/50 rounded-3xl border border-white/5">
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="h-5 w-5 rounded-lg border-white/10 bg-black checked:bg-[#FF6200] checked:text-black focus:ring-[#FF6200]/50 transition-all cursor-pointer accent-[#FF6200]"
                                            />
                                        </div>
                                        <label htmlFor="terms" className="text-[11px] text-zinc-500 font-bold leading-tight cursor-pointer">
                                            I verify compliance with the <Link href="/terms" target="_blank" className="text-zinc-300 hover:text-white underline decoration-[#FF6200]/40 decoration-1 underline-offset-4 transition-colors">Terms of Engagement</Link> & <Link href="/privacy" target="_blank" className="text-zinc-300 hover:text-white underline decoration-[#FF6200]/40 decoration-1 underline-offset-4 transition-colors">Privacy Protocol</Link>.
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <Button type="submit" disabled={isLoading || !agreedToTerms} className="w-full h-18 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-[1.5rem] shadow-[0_20px_40px_rgba(255,102,0,0.2)] border-none text-xs group transition-all">
                                        {isLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : (
                                            <span className="flex items-center justify-center gap-3">
                                                {['student_seller', 'dealer'].includes(role) ? 'Initialize Beta Node' : role === 'ceo' ? 'Establish Command' : 'Enter MarketBridge'}
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                    <Button type="button" onClick={() => setCurrentStep(role === 'buyer' || role === 'ceo' ? 'profile' : 'id_check')} variant="ghost" className="w-full text-zinc-600 hover:text-white font-black uppercase tracking-widest text-[10px]">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Review Information
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-[9px] sm:text-[10px] text-zinc-700 font-medium leading-relaxed uppercase tracking-wider">
                            Beta platform – technical problems? Email <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:underline">support@marketbridge.com.ng</a><br />
                            Refunds or seller questions? Email <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:underline">ops-support@marketbridge.com.ng</a>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-center opacity-30 select-none pointer-events-none">
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-800">Secure Protocol v2.4.1 // MarketBridge Alpha</p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
