'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, AlertCircle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerifyEmailPage() {
    const { user, sessionUser, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!authLoading && !sessionUser) {
            router.push('/login');
            return;
        }

        if (user && user.email_verified) {
            router.push('/seller/dashboard');
        }
    }, [user, sessionUser, authLoading, router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otpCode];
        newOtp[index] = value.slice(-1);
        setOtpCode(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otpCode];
        pastedData.forEach((char, i) => {
            if (/^\d$/.test(char)) {
                newOtp[i] = char;
            }
        });
        setOtpCode(newOtp);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    };

    const sendOtp = async () => {
        if (!sessionUser?.email || cooldown > 0) return;

        setIsSending(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: sessionUser.email,
                options: { shouldCreateUser: false }
            });

            if (error) throw error;

            // Track last_otp_sent in users table
            await supabase.from('users')
                .update({ last_otp_sent: new Date().toISOString() })
                .eq('id', sessionUser.id);

            setCooldown(60);
        } catch (err: any) {
            console.error('Error sending OTP:', err);
            setError(err.message || 'Failed to send verification code.');
        } finally {
            setIsSending(false);
        }
    };

    const verifyOtp = async () => {
        const code = otpCode.join('');
        if (code.length !== 6 || !sessionUser?.email) return;

        setIsVerifying(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: sessionUser.email,
                token: code,
                type: 'email'
            });

            if (error) throw error;

            // Success! Update our users table
            const { error: updateError } = await supabase.from('users')
                .update({ email_verified: true })
                .eq('id', sessionUser.id);

            if (updateError) throw updateError;

            setSuccess(true);
            await refreshUser();

            // Redirect after a brief moment
            setTimeout(() => {
                router.push('/seller/dashboard');
            }, 2000);

        } catch (err: any) {
            console.error('Error verifying OTP:', err);
            setError(err.message || 'Invalid or expired code.');
            // Clear code on error
            setOtpCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6600]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />

            <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white shadow-2xl relative z-10">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6600] to-transparent" />

                <CardHeader className="p-0 text-center mb-8">
                    <div className="mx-auto h-20 w-20 rounded-full bg-[#FF6600]/10 flex items-center justify-center mb-6 relative">
                        {success ? (
                            <CheckCircle className="h-10 w-10 text-[#00FF85] animate-in zoom-in duration-300" />
                        ) : (
                            <Mail className="h-10 w-10 text-[#FF6600] animate-pulse" />
                        )}
                        {!success && <div className="absolute inset-0 rounded-full border border-[#FF6600]/30 animate-ping opacity-25" />}
                    </div>
                    <CardTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2">
                        {success ? "Identity Verified" : "Verify Your Email"}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium leading-relaxed">
                        {success
                            ? "Terminal access granted. Redirecting to your dashboard..."
                            : "This is a Beta step – verifying your email helps keep the platform safe and trusted."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-8">
                    {!success && (
                        <>
                            <div className="text-center space-y-4">
                                <p className="text-sm text-zinc-400">
                                    We sent a 6-digit code to <br />
                                    <span className="text-white font-bold">{sessionUser?.email}</span>
                                </p>

                                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                                    {otpCode.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el; }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleKeyDown(i, e)}
                                            className="w-12 h-14 bg-zinc-900 border border-white/5 rounded-xl text-center text-xl font-black text-white focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none transition-all"
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <Button
                                    onClick={verifyOtp}
                                    disabled={isVerifying || otpCode.join('').length !== 6}
                                    className="w-full h-14 bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FF8533] disabled:opacity-50 disabled:grayscale transition-all shadow-[0_10px_30px_rgba(255,102,0,0.2)]"
                                >
                                    {isVerifying ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify and Secure"}
                                </Button>

                                <div className="text-center">
                                    <Button
                                        variant="ghost"
                                        disabled={isSending || cooldown > 0}
                                        onClick={sendOtp}
                                        className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
                                    >
                                        {cooldown > 0 ? `Resend Code (${cooldown}s)` : (isSending ? "Sending..." : "Didn't receive a code? Resend")}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {success && (
                        <div className="py-8 text-center animate-pulse">
                            <p className="text-[#00FF85] font-black uppercase tracking-[0.2em] text-xs">Access Protocol Syncing...</p>
                        </div>
                    )}
                </CardContent>

                <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                        <ArrowLeft className="h-3 w-3" /> Return to Base
                    </Button>
                </div>
            </Card>
        </div>
    );
}
