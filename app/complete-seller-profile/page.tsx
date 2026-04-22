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
    'eun.edu.ng': 'European University of Nigeria',
    'philomath.edu.ng': 'Philomath University',
    'cosmopolitan.edu.ng': 'Cosmopolitan University',
    'miva.university': 'Miva Open University',
    'primeuniversity.edu.ng': 'Prime University Abuja',
    'binghamuni.edu.ng': 'Bingham University',
};

const CAMPUS_BLOCKS: Record<string, string[]> = {
    'Nile University of Nigeria': ['Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Off-Campus'],
    'Baze University': ['Main Campus', 'Hostel A', 'Hostel B', 'Off-Campus'],
    'Veritas University': ['Main Campus', 'Hostel Block', 'Off-Campus'],
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
    const [avatarUrl, setAvatarUrl] = useState('');
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
            setAvatarUrl(sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '');

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
                avatar_url: avatarUrl,
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full border-2 border-[#2a2a2a] overflow-hidden bg-[#2a2a2a] flex items-center justify-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-gray-600" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Change</span>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2">Profile Photo (Google)</p>
                    </div>

                    {/* Pre-filled Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-500 ml-1">Full Name</label>
                            <div className="relative">
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                                    className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-500 ml-1">Email <span className="text-orange-500">(locked)</span></label>
                            <div className="relative">
                                <input type="email" value={email} readOnly
                                    className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-gray-400 font-bold tracking-wider text-sm cursor-not-allowed opacity-60" />
                            </div>
                        </div>
                    </div>

                    {/* University (Locked) */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-500 ml-1">University <span className="text-orange-500">(Auto-Detected)</span></label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><GraduationCap className="h-4 w-4" /></div>
                            <input type="text" value={university} readOnly
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-orange-500/80 font-black tracking-widest text-xs cursor-not-allowed opacity-80" />
                        </div>
                    </div>

                    {/* Manual Inputs Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 ml-1">Matriculation Number</label>
                            <input type="text" value={matricNumber} onChange={e => setMatricNumber(e.target.value)} required placeholder="NU/123/456"
                                className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 ml-1">Phone Number</label>
                            <div className="relative">
                                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="08012345678"
                                    className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Campus Block */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 ml-1">Hostel / Campus Block</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"><MapPin className="h-4 w-4" /></div>
                            <select value={campusBlock} onChange={e => setCampusBlock(e.target.value)} required
                                className="w-full h-14 pl-14 pr-6 bg-[#2a2a2a] border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm appearance-none cursor-pointer">
                                <option value="" disabled>Select your block</option>
                                {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button type="submit" disabled={isLoading}
                            className="w-full h-16 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] flex items-center justify-center">
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <>Complete Registration <ArrowRight className="ml-4 h-5 w-5" /></>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
