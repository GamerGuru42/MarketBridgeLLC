'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

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

export default function SellerOnboardingPage() {
    const supabase = createClient();
    const router = useRouter();
    const { user, sessionUser, loading, refreshUser } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [university, setUniversity] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // Bank Details
    const [banks, setBanks] = useState<{name: string, code: string}[]>([]);
    const [selectedBank, setSelectedBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

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
            
            if (user) {
                setPhoneNumber(user.phone_number || '');
            }

            const domain = userEmail.split('@')[1] || '';
            const detectedUni = DOMAIN_TO_UNI[domain] || '';
            setUniversity(detectedUni);
        }

        // Load Banks
        fetch('/api/paystack/banks')
            .then(res => res.json())
            .then(data => {
                if (data.status && Array.isArray(data.data)) {
                    setBanks(data.data);
                } else if (Array.isArray(data)) {
                    setBanks(data);
                }
            })
            .catch(err => console.error('Failed to load banks:', err));
    }, [sessionUser, loading, router]);

    // Auto-resolve bank account
    useEffect(() => {
        if (accountNumber.length === 10 && selectedBank) {
            resolveAccount();
        } else {
            setAccountName('');
        }
    }, [accountNumber, selectedBank]);

    const resolveAccount = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch(`/api/paystack/resolve?accountNumber=${accountNumber}&bankCode=${selectedBank}`);
            const data = await res.json();
            const resolvedName = data.data?.account_name || data.account_name;
            
            if (resolvedName) {
                setAccountName(resolvedName);
            } else {
                setAccountName('Invalid account details');
            }
        } catch (err) {
            setAccountName('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBank) { toast('Please select your bank.', 'error'); return; }
        if (accountNumber.length !== 10) { toast('Enter a valid 10-digit account number.', 'error'); return; }
        if (!accountName || accountName.includes('Invalid') || accountName.includes('failed')) { 
            toast('Please verify your bank details first.', 'error'); return; 
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('users').update({
                bank_name: banks.find(b => b.code === selectedBank)?.name,
                bank_code: selectedBank,
                account_number: accountNumber,
                account_name: accountName,
                is_verified: true,
                email_verified: true,
                university: university,
                display_name: fullName.trim(),
                phone_number: phoneNumber ? phoneNumber.trim() : null,
                onboarding_complete: true,
                payout_setup: true
            }).eq('id', sessionUser!.id);

            if (error) throw error;

            await refreshUser(sessionUser!.id);
            toast('Seller account activated!', 'success');
            router.replace('/seller-dashboard');
        } catch (err: any) {
            toast(err.message || 'Onboarding failed.', 'error');
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
                        Seller <span className="text-orange-500">Onboarding</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">
                        Set up your payout details to start selling
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Simplified Profile Section */}
                    <div className="flex items-center gap-4 p-4 bg-[#2a2a2a]/30 rounded-2xl border border-[#2a2a2a]">
                        <div className="w-12 h-12 rounded-full border border-[#3a3a3a] overflow-hidden">
                            {avatarUrl ? <img src={avatarUrl} alt="P" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-gray-500" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight">{fullName}</h3>
                            <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest">{university || 'MarketBridge Seller'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-500 ml-1">Phone Number (WhatsApp) - Optional</label>
                            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="08012345678"
                                className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-500 ml-1">Payout Bank</label>
                            <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} required
                                className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm appearance-none cursor-pointer">
                                <option value="">Select your bank</option>
                                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-500 ml-1">Account Number</label>
                            <div className="relative">
                                <input type="text" maxLength={10} value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))} required placeholder="0123456789"
                                    className="w-full h-14 px-6 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-wider text-sm" />
                                {isVerifying && <div className="absolute right-6 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin h-4 w-4 text-orange-500" /></div>}
                            </div>
                        </div>

                        {accountName && (
                            <div className={cn("p-4 rounded-xl border flex items-center gap-3 transition-all", 
                                accountName.includes('Invalid') || accountName.includes('failed') 
                                ? "bg-red-500/5 border-red-500/20 text-red-400" 
                                : "bg-green-500/5 border-green-500/20 text-green-400")}>
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                                    accountName.includes('Invalid') || accountName.includes('failed') ? "bg-red-500" : "bg-green-500")} />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{accountName}</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-6">
                        <Button type="submit" disabled={isLoading || isVerifying}
                            className="w-full h-16 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] flex items-center justify-center">
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <>Complete Onboarding <ArrowRight className="ml-4 h-5 w-5" /></>}
                        </Button>
                        <p className="text-center text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-4 leading-relaxed">
                            By proceeding, you agree that this bank account will be used for all payouts and withdrawals.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
