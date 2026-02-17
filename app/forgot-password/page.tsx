'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (resetError) throw resetError;

            setSuccess(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF6600]/5 blur-[120px] rounded-full" />

                <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white shadow-2xl relative z-10">
                    <CardContent className="text-center space-y-8 p-0">
                        <div className="h-24 w-24 rounded-3xl bg-[#00FF85]/10 border border-[#00FF85]/20 flex items-center justify-center mx-auto relative">
                            <CheckCircle className="h-12 w-12 text-[#00FF85]" />
                            <div className="absolute inset-0 rounded-3xl border border-[#00FF85]/30 animate-pulse" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                                Signal <span className="text-[#00FF85]">Transmitted</span>
                            </h2>
                            <p className="text-zinc-500 font-medium leading-relaxed">
                                We have dispatched a secure password reset link to <span className="text-white font-bold">{email}</span>.
                                Click the link to establish new credentials.
                            </p>
                        </div>

                        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Protocol Notes</p>
                            <ul className="text-[11px] text-zinc-400 space-y-2 text-left font-medium">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#FF6600] mt-0.5">•</span>
                                    <span>Link expires in 60 minutes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#FF6600] mt-0.5">•</span>
                                    <span>Check spam if not received within 5 minutes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#FF6600] mt-0.5">•</span>
                                    <span>You can close this window</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <Link href="/login">
                                <Button variant="ghost" className="text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px]">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF6600]/5 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md glass-card border-none rounded-[3rem] p-10 text-white shadow-2xl relative z-10">
                <CardHeader className="p-0 text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>
                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter mb-2">
                        Reset <span className="text-[#FF6600]">Password</span>
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium italic">
                        Enter your email to receive a secure reset link
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-8">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-500/20 flex items-center justify-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleResetRequest} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="operator@marketbridge.com.ng"
                                    className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-[#FF6600]/50 outline-none font-medium text-sm transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-[#FF6600] hover:bg-[#FF6600]/90 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(255,102,0,0.3)] border-none transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-white/5 text-center space-y-4">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            Remember your password?
                        </p>
                        <Link href="/login">
                            <Button variant="ghost" className="text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px]">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
