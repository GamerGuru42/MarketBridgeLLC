'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { refreshUser } = useAuth();
    const supabase = createClient();
    
    const email = searchParams?.get('email') || '';
    const [cooldown, setCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0 || !email) return;

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (error) throw error;
            toast('Verification link resent to your email!', 'success');
            setCooldown(60);
        } catch (error: any) {
            toast(error.message || 'Failed to resend link', 'error');
        }
    };

    const handleCheckVerification = async () => {
        setVerifying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email_confirmed_at) {
                await refreshUser();
                // We don't have role stored safely locally, but they'll be redirected by middleware or we can just push to dashboard
                router.push('/dashboard');
            } else {
                toast('Your email has not been verified yet. Please check your inbox.', 'error');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-8 md:py-12 bg-background text-foreground relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] max-w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="w-full max-w-lg glass-card bg-card/80 border border-border shadow-2xl rounded-3xl p-8 md:p-12 relative z-10 text-center space-y-6">
                
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-6">
                    <MailCheck className="w-10 h-10 text-primary" />
                </div>
                
                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground italic font-heading leading-none">
                    Check Your <span className="text-primary">Email</span>
                </h2>
                
                <p className="text-muted-foreground font-bold text-sm leading-relaxed">
                    We've sent a verification link to <br/>
                    <span className="text-foreground font-black">{email}</span>
                </p>

                <p className="text-xs text-muted-foreground uppercase tracking-widest pb-4">
                    Click the link in the email to activate your account.
                </p>

                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={handleCheckVerification} 
                        disabled={verifying}
                        className="w-full h-14 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest rounded-xl"
                    >
                        {verifying ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            <>I've verified my email <ArrowRight className="ml-2 h-4 w-4" /></>
                        )}
                    </Button>
                    
                    <Button 
                        onClick={handleResend} 
                        disabled={cooldown > 0}
                        variant="outline"
                        className="w-full h-14 font-black uppercase tracking-widest rounded-xl border-border"
                    >
                        {cooldown > 0 ? `Resend Link (${cooldown}s)` : 'Resend Link'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
