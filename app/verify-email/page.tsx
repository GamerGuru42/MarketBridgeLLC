'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, ShieldCheck, Mail, ArrowRight, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type VerificationMode = 'magic_link' | 'otp' | 'fallback_success';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const supabase = createClient();

    const email = searchParams?.get('email') || user?.email;

    const [mode, setMode] = useState<VerificationMode>('magic_link');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(1800); // 30 minutes
    const [failCount, setFailCount] = useState(0);
    const [isVerified, setIsVerified] = useState(false);

    // Countdown logic
    useEffect(() => {
        if (countdown > 0 && mode !== 'fallback_success') {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && mode !== 'fallback_success') {
            handleFallback();
        }
    }, [countdown, mode]);

    // Format time helper
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Auto-redirect if already verified natively or via magic link URL hash
    useEffect(() => {
        const checkHash = async () => {
            const hash = window.location.hash;
            if (hash.includes('access_token')) {
                toast('Magic link detected! Verifying...', 'success');
                setIsVerified(true);
                await refreshUser();
                setTimeout(() => router.replace('/seller-setup/bank'), 1500);
            }
        };
        checkHash();

        if (user?.email_verified) {
            router.replace('/seller-setup/bank');
        }
    }, [user, router, toast, refreshUser]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast('Please enter the 6-digit code', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: email!,
                token: otp,
                type: 'signup'
            });

            if (error) throw error;

            await supabase.from('users').update({ email_verified: true }).eq('id', user?.id || (await supabase.auth.getUser()).data.user?.id);

            setIsVerified(true);
            toast('Email verified successfully', 'success');
            await refreshUser();

            setTimeout(() => {
                router.push('/seller-setup/bank');
            }, 1000);

        } catch (err: any) {
            console.error('Verification error:', err);
            toast(err.message || 'Invalid code. Please check and try again.', 'error');
            
            // Advance fail count on bad OTP too, to eventually trigger fallback if they keep failing
            const newFails = failCount + 1;
            setFailCount(newFails);
            if (newFails >= 2) {
                handleFallback();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchToOtp = async () => {
        setMode('otp');
        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email!,
            });
            if (error) throw error;
            toast('6-digit OTP sent to your email', 'success');
        } catch (err: any) {
            toast(err.message || 'Failed to send OTP', 'error');
        } finally {
            setIsResending(false);
        }
    };

    const handleDidNotReceive = () => {
        const newCount = failCount + 1;
        setFailCount(newCount);
        if (newCount >= 2) {
            handleFallback();
        } else {
            handleSwitchToOtp();
        }
    };

    const handleFallback = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/verification/fallback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            if (!res.ok) throw new Error('Fallback failed');
            
            setMode('fallback_success');
            await refreshUser();
            
            setTimeout(() => {
                router.push('/seller/dashboard'); // Fallback goes to dashboard so they see the banner
            }, 3000);
        } catch (err) {
            console.error(err);
            toast('System error allocating temporary sequence.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerified) {
        return (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-[#FF6200]/10 flex items-center justify-center border-4 border-[#FF6200]/20">
                        <CheckCircle2 className="h-12 w-12 text-[#FF6200]" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Access <span className="text-[#FF6200]">Granted</span></h2>
                    <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Redirecting to Bank Setup...</p>
                </div>
            </div>
        );
    }

    if (mode === 'fallback_success') {
        return (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 py-8">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-yellow-500/10 flex items-center justify-center border-4 border-yellow-500/20">
                        <Clock className="h-12 w-12 text-yellow-500" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-yellow-500">Temporary Access Granted</h2>
                    <p className="text-white/70 font-medium text-sm leading-relaxed max-w-sm mx-auto">
                        We noticed you had trouble verifying your email. You have been granted temporary access for <strong className="text-white">48 hours</strong> to create listings and negotiate.
                    </p>
                    <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-4">Redirecting to Dashboard...</p>
                </div>
            </div>
        );
    }

    if (mode === 'magic_link') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-center py-4">
                <div className="mx-auto h-24 w-24 bg-[#FF6200]/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,98,0,0.15)]">
                    <Mail className="h-10 w-10 text-[#FF6200] animate-bounce shadow-primary" />
                </div>
                
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Verify Your Email</h2>
                
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl text-sm font-medium text-white/70 leading-relaxed shadow-inner">
                    Magic link sent to your personal email!<br/>
                    <strong className="text-white text-lg py-2 block">{email}</strong>
                    Click the link in your email to instantly verify your account and proceed to bank setup.
                    <br/><br/>
                    <span className="text-[#FF6200] font-black uppercase tracking-widest text-[11px]">This link expires in {formatTime(countdown)}</span>
                </div>

                <Button 
                    variant="ghost" 
                    onClick={handleDidNotReceive} 
                    disabled={isResending} 
                    className="w-full h-14 border border-white/10 text-white font-bold uppercase text-[11px] tracking-widest rounded-2xl hover:bg-white/5 mt-6 transition-colors shadow-sm"
                >
                    {isResending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Didn't receive the link or it expired? Request 6-digit OTP instead"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
                <div className="flex justify-center mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/5 flex items-center justify-center border border-white/5">
                        <Mail className="h-8 w-8 text-[#FF6200]" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Enter <span className="text-[#FF6200]">Verification Code</span></h2>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">We sent a 6-digit OTP to {email}</p>
                </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="space-y-4">
                    <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="w-full bg-black border-2 border-white/10 rounded-[1.5rem] h-20 text-center text-2xl font-black tracking-[0.2em] text-[#FF6200] placeholder:text-white/5 focus:border-[#FF6200] focus:ring-4 focus:ring-[#FF6200]/10 outline-none transition-all"
                        required
                    />
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[#FF6200] font-black uppercase tracking-widest text-[10px]">Expires in {formatTime(countdown)}</span>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full h-16 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-[1.5rem] shadow-[0_20px_40px_rgba(255,102,0,0.2)] border-none text-xs flex items-center justify-center gap-3 transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                            Verify Identity
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <Button 
                variant="ghost" 
                onClick={handleDidNotReceive} 
                className="w-full text-white/50 hover:text-white uppercase text-[10px] font-black tracking-widest mt-2"
            >
                I didn't receive anything
            </Button>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6200]/5 blur-[100px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg glass-card bg-black/50 border border-white/5 rounded-[3rem] p-8 sm:p-14 relative z-10 backdrop-blur-xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-[#FF6200]/30" />
                <div className="mb-12 flex justify-center">
                    <Logo showText={false} className="scale-110 saturate-150" />
                </div>
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" /></div>}>
                    <VerifyEmailContent />
                </Suspense>
            </Card>
        </div>
    );
}
