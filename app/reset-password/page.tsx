'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            toast('Passwords do not match', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setIsSuccess(true);
            toast('Security credentials updated', 'success');

            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            toast(err.message || 'Update failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 text-primary">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">Access <span className="text-primary">Restored</span></h2>
                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest max-w-[240px] mx-auto leading-relaxed">
                        Your Security Systems have been updated. Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-foreground">Reset <span className="text-primary">Security</span></h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Establish new encrypted credentials</p>
            </div>

            <form onSubmit={handleReset} className="space-y-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground ml-2">New Password</Label>
                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-16 pl-14 pr-14 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground ml-2">Confirm New Password</Label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-16 pl-14 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                                required
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || !password || password !== passwordConfirm}
                    className="w-full h-18 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-[1.5rem] shadow-[0_10px_30px_rgba(255,98,0,0.3)] border-none text-xs flex items-center justify-center gap-3 transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                            Secure Credentials
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0" />

            <Card className="w-full max-w-lg glass-card bg-card/80 border-border rounded-[3rem] p-8 sm:p-14 relative z-10 shadow-2xl">
                <div className="mb-12 flex justify-center">
                    <Logo showText={false} className="scale-110" />
                </div>
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" /></div>}>
                    <ResetPasswordContent />
                </Suspense>
            </Card>
        </div>
    );
}
