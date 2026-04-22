'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setIsSent(true);
            toast('Recovery Code Sent', 'success');
        } catch (err: any) {
            toast(err.message || 'Request failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0" />

            <Card className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 sm:p-14 relative z-10 shadow-2xl">
                <div className="mb-12 flex justify-center">
                    <Logo showText={false} className="scale-110" />
                </div>

                <CardContent className="p-0">
                    {isSent ? (
                        <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="flex justify-center">
                                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                                    <CheckCircle2 className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">Email <span className="text-primary">Sent</span></h2>
                                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest max-w-[240px] mx-auto leading-relaxed">
                                    A reset link has been sent to your email inbox.
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsSent(false)}
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px]"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Resend
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Recover <span className="text-orange-500">Access</span></h2>
                                <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Send reset link to your email</p>
                            </div>

                            <form onSubmit={handleReset} className="space-y-8">
                                <div className="space-y-2">
                                    <Label className="text-[9px] uppercase font-black tracking-widest text-gray-400 ml-2">Verification Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="w-full h-16 pl-14 bg-[#2a2a2a] border-0 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-widest rounded-xl shadow-[0_10px_30px_rgba(255,98,0,0.3)] border-none text-xs flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                        <>
                                            Send Reset Link
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:underline transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="h-3 w-3" /> Return to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
