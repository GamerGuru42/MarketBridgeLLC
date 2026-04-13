'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, ShieldCheck, GraduationCap, ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SellerOnboardPage() {
    const { toast } = useToast();
    const { user, loading, refreshUser, signInWithGoogle } = useAuth();
    const router = useRouter();

    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Show error from auth callback redirect (e.g. non-.edu.ng email)
    const searchParams = useSearchParams();
    useEffect(() => {
        const errorMsg = searchParams.get('error');
        if (errorMsg) {
            toast(errorMsg, 'error');
            window.history.replaceState({}, '', '/seller-onboard');
        }
    }, [searchParams, toast]);

    useEffect(() => {
        if (!loading && user) {
            router.push('/seller-setup/bank');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            toast('Signed in successfully! Setting up your account...', 'success');
            setTimeout(() => {
                refreshUser();
            }, 1000);
        }
    }, [refreshUser, toast]);

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle(`${window.location.origin}/auth/callback?role=student_seller&next=/seller-setup/bank`);
        } catch (error: any) {
            toast(error.message || 'Google Sign-In failed. Please try again.', 'error');
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-background text-foreground relative selection:bg-primary selection:text-black overflow-hidden transition-colors duration-300">
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
            
            <div className="w-full max-w-lg relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(255,98,0,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground font-heading">Seller Registration</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading text-foreground">
                        Start <span className="text-primary">Selling</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm mt-2">
                        Join MarketBridge and sell to students across Abuja campuses.
                    </p>
                </div>

                <div className="glass-card bg-card border border-border rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative">
                    
                    {/* Decorative Element */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Briefcase className="h-40 w-40 text-foreground" />
                    </div>

                    <div className="space-y-8 relative z-10">
                        
                        {/* How it works */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">How It Works</span>
                            </div>
                            
                            <div className="space-y-3">
                                {[
                                    { step: '1', text: 'Sign in with your school Google account (.edu.ng)' },
                                    { step: '2', text: 'Add your bank details for receiving payments' },
                                    { step: '3', text: 'Start listing your products and services' },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px] font-black text-primary">{item.step}</span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <Button 
                            onClick={handleGoogleLogin} 
                            disabled={isGoogleLoading} 
                            className="w-full h-16 bg-card border border-border text-foreground hover:bg-secondary font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            {isGoogleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </Button>

                        {/* Info Box */}
                        <div className="bg-secondary/50 border border-border rounded-2xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                                <p className="text-xs font-bold text-foreground">Students Only</p>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Only Nigerian university students with a <span className="text-primary font-bold">.edu.ng</span> email can sell on MarketBridge. Your school Google account verifies your student status instantly. Personal emails (Gmail, Yahoo, etc.) are not accepted.
                            </p>
                        </div>

                        {/* Back link */}
                        <div className="pt-2 text-center">
                            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground font-bold transition-colors">
                                <ArrowLeft className="inline h-3 w-3 mr-1" /> Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
