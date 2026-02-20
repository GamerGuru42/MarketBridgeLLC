'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, ShieldCheck, Mail, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function VerifyEmailContent() {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const supabase = createClient();

    const email = searchParams.get('email') || user?.email;

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async (e: React.FormEvent) => {
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

            // Update user status
            await supabase.from('users').update({ email_verified: true }).eq('id', user?.id);

            setIsVerified(true);
            toast('Email verified successfully', 'success');
            await refreshUser();

            setTimeout(() => {
                router.push('/seller/dashboard');
            }, 2000);

        } catch (err: any) {
            console.error('Verification error:', err);
            toast(err.message || 'Invalid code. Please check and try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email!,
            });

            if (error) throw error;

            toast('New code transmitted', 'success');
            setCountdown(60);
        } catch (err: any) {
            toast(err.message || 'Resend failed', 'error');
        } finally {
            setIsResending(false);
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
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Redirecting to Seller Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="space-y-4">
                <div className="flex justify-center mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-[#FF6200]/5 flex items-center justify-center border border-white/5">
                        <Mail className="h-8 w-8 text-[#FF6200]" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Enter <span className="text-[#FF6200]">Access Code</span></h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Encoded signal sent to {email}</p>
                </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
                <div className="space-y-4">
                    <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000 000"
                        className="w-full bg-black border-2 border-white/10 rounded-[1.5rem] h-20 text-center text-4xl font-black tracking-[0.5em] text-[#FF6200] placeholder:text-zinc-900 focus:border-[#FF6200] focus:ring-4 focus:ring-[#FF6200]/10 outline-none transition-all"
                        required
                    />
                    <div className="flex justify-between items-center px-2">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={countdown > 0 || isResending}
                            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group disabled:opacity-30"
                        >
                            {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />}
                            {countdown > 0 ? `Resend Signal in ${countdown}s` : 'Resend Signal'}
                        </button>
                        <ShieldCheck className="h-4 w-4 text-zinc-800" />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full h-18 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-[1.5rem] shadow-[0_20px_40px_rgba(255,102,0,0.2)] border-none text-xs flex items-center justify-center gap-3 transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                            Verify Identity
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <div className="text-center pt-4">
                <button
                    onClick={() => router.push('/login')}
                    className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                >
                    Return to Login Base
                </button>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6200]/5 blur-[100px] rounded-full pointer-events-none" />

            <Card className="w-full max-lg glass-card border-none rounded-[3rem] p-8 sm:p-14 relative z-10">
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
