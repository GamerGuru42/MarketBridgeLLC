'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, GraduationCap, Phone, MapPin, User as UserIcon, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const DOMAIN_TO_UNI: Record<string, string> = {
    'nileuniversity.edu.ng': 'Nile University of Nigeria',
    'bazeuniversity.edu.ng': 'Baze University',
    'veritas.edu.ng': 'Veritas University',
    'aust.edu.ng': 'African University of Science & Technology',
    'eun.edu.ng': 'Evangel University',
    'philomath.edu.ng': 'Philomath University',
    'cosmopolitan.edu.ng': 'Cosmopolitan University',
    'miva.university': 'MIVA University',
    'primeuniversity.edu.ng': 'Prime University',
    'binghamuni.edu.ng': 'Bingham University',
};

const CAMPUS_BLOCKS: Record<string, string[]> = {
    'Nile University of Nigeria': ['Block A', 'Block B', 'Block C', 'Block D', 'Off-Campus'],
    'Baze University': ['Main Campus', 'Annex Block', 'Off-Campus'],
    'default': ['Main Campus', 'Hostel Block A', 'Hostel Block B', 'Off-Campus'],
};

export default function CompleteSellerProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const { user, sessionUser, loading, refreshUser } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [university, setUniversity] = useState('');
    const [matricNumber, setMatricNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [campusBlock, setCampusBlock] = useState('');

    useEffect(() => {
        if (!loading && !sessionUser) {
            router.replace('/signup');
            return;
        }
        if (sessionUser) {
            const userEmail = sessionUser.email || '';
            setEmail(userEmail);
            setFullName(sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || userEmail.split('@')[0]);

            // Auto-detect university from email domain
            const domain = userEmail.split('@')[1] || '';
            const detectedUni = DOMAIN_TO_UNI[domain] || '';
            setUniversity(detectedUni);
        }
    }, [sessionUser, loading, router]);

    const blocks = CAMPUS_BLOCKS[university] || CAMPUS_BLOCKS['default'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!matricNumber.trim()) { toast('Matriculation number is required.', 'error'); return; }
        if (!phoneNumber.trim() || !/^(\+234|0)[789]\d{9}$/.test(phoneNumber.replace(/\s/g, ''))) {
            toast('Enter a valid Nigerian phone number.', 'error'); return;
        }
        if (!campusBlock) { toast('Select your campus block.', 'error'); return; }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('users').upsert({
                id: sessionUser!.id,
                email: email,
                display_name: fullName.trim(),
                role: 'student_seller',
                university: university,
                matric_number: matricNumber.trim(),
                phone_number: phoneNumber.replace(/\s/g, ''),
                campus_block: campusBlock,
                is_verified: true,
                email_verified: true,
            }, { onConflict: 'id' });

            if (error) throw error;

            await refreshUser(sessionUser!.id);
            toast('Welcome! Your seller account is active. You can start listing now.', 'success');
            router.replace('/seller-dashboard');
        } catch (err: any) {
            toast(err.message || 'Profile creation failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-8 md:py-12 bg-[#0a0a0a] text-white relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="w-full max-w-xl relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-5 md:p-10 lg:p-14 shadow-2xl">
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic leading-none">
                        Complete <span className="text-orange-500">Profile</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">
                        Finish setting up your seller account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name (editable) */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><UserIcon className="h-4 w-4" /></div>
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                        </div>
                    </div>

                    {/* Email (locked) */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Email <span className="text-orange-500">(verified)</span></label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><Mail className="h-4 w-4" /></div>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2"><Lock className="h-3.5 w-3.5 text-gray-600" /></div>
                            <input type="email" value={email} readOnly
                                className="w-full h-14 pl-14 pr-12 bg-[#2a2a2a] border-0 rounded-xl text-gray-400 font-bold tracking-wider text-sm cursor-not-allowed opacity-70" />
                        </div>
                    </div>

                    {/* University (auto-detected, locked) */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">University <span className="text-orange-500">(auto-detected)</span></label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><GraduationCap className="h-4 w-4" /></div>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2"><Lock className="h-3.5 w-3.5 text-gray-600" /></div>
                            <input type="text" value={university} readOnly
                                className="w-full h-14 pl-14 pr-12 bg-[#2a2a2a] border-0 rounded-xl text-gray-400 font-bold tracking-wider text-sm cursor-not-allowed opacity-70" />
                        </div>
                    </div>

                    {/* Matriculation Number */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Matriculation Number</label>
                        <input type="text" value={matricNumber} onChange={e => setMatricNumber(e.target.value)} required placeholder="e.g. NU/1234/56"
                            className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Phone Number</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><Phone className="h-4 w-4" /></div>
                            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="+234 801 234 5678"
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                        </div>
                    </div>

                    {/* Campus Block */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Hostel / Campus Block</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><MapPin className="h-4 w-4" /></div>
                            <select value={campusBlock} onChange={e => setCampusBlock(e.target.value)} required
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm appearance-none">
                                <option value="" disabled>Select your block</option>
                                {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={isLoading}
                            className="w-full h-16 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] flex items-center justify-center">
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <>Complete Setup <ArrowRight className="ml-4 h-5 w-5" /></>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
