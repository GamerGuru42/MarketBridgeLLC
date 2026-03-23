'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, ArrowRight, ShieldCheck, CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Bank {
    name: string;
    code: string;
}

export default function BankSetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const supabase = createClient();

    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedBankCode, setSelectedBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // Fetch banks on mount
    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch('/api/paystack/banks');
                const data = await res.json();
                if (data && data.data) {
                    // Paystack returns { status: true, message: "...", data: [...] }
                    setBanks(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch banks:', error);
                toast('Failed to load bank list. Please refresh.', 'error');
            } finally {
                setIsLoadingBanks(false);
            }
        };
        fetchBanks();
    }, [toast]);

    const handleVerifyParams = async () => {
        if (!selectedBankCode || accountNumber.length !== 10) return;
        
        setIsVerifying(true);
        setAccountName('');
        setIsVerified(false);
        try {
            const res = await fetch(`/api/paystack/resolve?accountNumber=${accountNumber}&bankCode=${selectedBankCode}`);
            const data = await res.json();
            
            if (res.ok && data.status && data.data?.account_name) {
                setAccountName(data.data.account_name);
                setIsVerified(true);
                toast('Bank account verified successfully', 'success');
            } else {
                toast(data.message || 'Could not verify account. Please check the details.', 'error');
            }
        } catch (error: any) {
            toast('Error verifying account. Please try again.', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSave = async () => {
        if (!isVerified || !user) return;
        setIsSaving(true);
        try {
            const selectedBank = banks.find(b => b.code === selectedBankCode);
            
            // Save to supabase
            const { error } = await supabase.from('users').update({
                bank_name: selectedBank?.name || '',
                bank_code: selectedBankCode,
                account_number: accountNumber,
                account_name: accountName,
                is_verified_seller: true, // Mark them fully active as seller
            }).eq('id', user.id);

            if (error) throw error;
            
            await refreshUser();
            toast('Account setup complete! Welcome to MarketBridge Seller.', 'success');
            router.push('/seller/dashboard');
            
        } catch (error: any) {
            toast(error.message || 'Failed to save account details', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-background relative selection:bg-primary selection:text-black transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-lg relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic">
                        Set Up Your <span className="text-primary">Payout</span> Account
                    </h1>
                    <p className="text-muted-foreground font-medium mt-3 text-sm">
                        Almost there! Add your bank account to receive payments instantly.
                    </p>
                </div>

                <div className="bg-card border border-border shadow-xl rounded-[2.5rem] p-8 backdrop-blur-sm space-y-6">
                    <div className="text-center bg-muted/50 rounded-2xl p-5 border border-border">
                        <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
                        <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Add your bank account to receive payments</h2>
                        <p className="text-muted-foreground text-xs font-medium mt-2 leading-relaxed">
                            This is your MarketBridge Wallet details. Money from sales will land here first, then you can withdraw anytime.
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Bank Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <select 
                                    className="w-full h-14 pl-12 pr-4 bg-muted border border-input rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none font-medium text-sm transition-all"
                                    value={selectedBankCode}
                                    onChange={(e) => {
                                        setSelectedBankCode(e.target.value);
                                        setIsVerified(false);
                                        setAccountName('');
                                    }}
                                    disabled={isLoadingBanks || isVerified || isVerifying}
                                >
                                    <option value="" disabled>Select your bank</option>
                                    {banks.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Account Number</label>
                            <input 
                                type="text"
                                maxLength={10}
                                placeholder="0123456789"
                                className="w-full h-14 px-5 bg-muted border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono font-bold tracking-[0.2em] text-center text-lg disabled:opacity-50"
                                value={accountNumber}
                                onChange={(e) => {
                                    setAccountNumber(e.target.value.replace(/\D/g, ''));
                                    setIsVerified(false);
                                    setAccountName('');
                                }}
                                disabled={isVerified || isVerifying}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">Account Name</label>
                            <input 
                                type="text"
                                placeholder="..."
                                className="w-full h-14 px-5 bg-secondary border border-border rounded-2xl text-foreground/70 font-bold uppercase focus:outline-none cursor-not-allowed opacity-80"
                                value={accountName}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>

                    {!isVerified ? (
                        <>
                            <div className="bg-primary/5 rounded-xl p-4 flex gap-3 border border-primary/10">
                                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed leading-4">
                                    We use Paystack to instantly verify your account. This keeps everything safe and your money protected. <br/><span className="text-primary font-black">No charges for verification.</span>
                                </p>
                            </div>
                            <Button 
                                onClick={handleVerifyParams}
                                disabled={isVerifying || !selectedBankCode || accountNumber.length !== 10}
                                className="w-full h-14 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 group border-none shadow-xl shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-1" />
                                        Verifying with Paystack...
                                    </>
                                ) : (
                                    'Verify Account'
                                )}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-black uppercase tracking-widest text-xs">Account Verified</span>
                            </div>

                            <Button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-14 bg-foreground text-background font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 group transition-all hover:opacity-90 border-none shadow-xl disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                    <>
                                        Save & Continue to Dashboard
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        setIsVerified(false);
                                        setAccountName('');
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Change Bank Details
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
