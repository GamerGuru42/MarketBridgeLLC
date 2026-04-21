'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, AlertTriangle, ArrowRight, Shield, Activity, Users, Zap, Target, Wrench } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_ROLES = ['ceo', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support', 'technical_admin', 'admin'];

// ─── Admin Session Cookie ────────────────────────────────────────────────────
function setAdminSessionCookie(userId: string, role: string) {
    const payload = btoa(JSON.stringify({ uid: userId, role, ts: Date.now() }));
    // Cookies are now strictly scoped to the HQ subdomain in production
    document.cookie = `mb-admin-session=${payload}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

// Role to department hub mapping
function getHubRoute(role: string): string {
    if (role === 'ceo') return '/admin/ceo';
    if (role === 'operations_admin') return '/admin/operations';
    if (role === 'marketing_admin') return '/admin/marketing';
    if (role === 'systems_admin' || role === 'technical_admin') return '/admin/systems';
    if (role === 'it_support') return '/admin/it-support';
    return '/admin';
}

// Department to allowed roles mapping (for strict validation)
function getAllowedRolesForDepartment(dept: string): string[] {
    switch (dept) {
        case 'operations_admin': return ['operations_admin'];
        case 'marketing_admin': return ['marketing_admin'];
        case 'systems_admin': return ['systems_admin', 'technical_admin'];
        case 'it_support': return ['it_support'];
        case 'ceo': return ['ceo'];
        default: return [];
    }
}

function PortalLoginContent() {
    const supabase = createClient();
    const { refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorFromUrl = searchParams?.get('error');

    type Step = 'entry' | 'role_select' | 'google_auth';
    type DepartmentKey = 'operations_admin' | 'marketing_admin' | 'systems_admin' | 'it_support' | 'ceo';

    const [currentStep, setCurrentStep] = useState<Step>('entry');
    const [selectedDept, setSelectedDept] = useState<DepartmentKey>('operations_admin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(errorFromUrl || '');

    // Auto-redirect if already authenticated with admin role
    useEffect(() => {
        if (!loading && sessionUser && user && ADMIN_ROLES.includes(user.role)) {
            setAdminSessionCookie(user.id, user.role);
            const target = getHubRoute(user.role);
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
                window.location.assign(target);
            }
        }
    }, [user, sessionUser, loading, router]);

    const handleGoogleLogin = async (dept: DepartmentKey) => {
        setIsLoading(true);
        setError('');
        try {
            const dbRole: string = dept;
            const targetDestination = getHubRoute(dbRole);
            const callbackOrigin = window.location.origin;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Added type=portal to isolate the callback logic
                    redirectTo: `${callbackOrigin}/auth/callback?type=portal&role=${dbRole}&next=${encodeURIComponent(targetDestination)}`,
                    queryParams: {
                        prompt: 'select_account',
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google authentication failed.');
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // ─── Entry Screen ────────────────────────────────────────────────────────
    if (currentStep === 'entry') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] max-w-[500px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

                <div className="w-full max-w-2xl glass-card bg-card/80 border border-border mt-8 mb-8 shadow-2xl rounded-[3rem] p-10 lg:p-14 relative z-10 text-center">
                    <div className="flex justify-center mb-8">
                        <img src="/favicon.png" alt="MarketBridge" className="h-12 w-12 object-contain" />
                    </div>
                    
                    <div className="space-y-4 mb-12">
                        <div className="flex items-center justify-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Secure Authentication</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                            Team <span className="text-primary">Portal</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">Access Management Console</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500 font-bold text-left">{decodeURIComponent(error)}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                        <div 
                            onClick={() => setCurrentStep('role_select')}
                            className="group bg-secondary border border-border rounded-[2rem] p-8 text-center flex flex-col items-center cursor-pointer hover:border-primary/50 transition-all active:scale-95"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-2">Staff Login</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest italic opacity-60">Select Department</p>
                        </div>

                        <div 
                            onClick={() => handleGoogleLogin('ceo')}
                            className="group bg-secondary border border-border rounded-[2rem] p-8 text-center flex flex-col items-center cursor-pointer hover:border-primary/50 transition-all active:scale-95"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Lock className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-2">Executive</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest italic opacity-60">CEO Access</p>
                        </div>
                    </div>
                    
                    <div className="mt-12 pt-8 border-t border-border">
                        <p className="text-muted-foreground/30 text-[9px] uppercase tracking-widest font-black">Secure Administration Management Hub</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Department Selection Screen ─────────────────────────────────────────
    if (currentStep === 'role_select') {
        const departments: { dept: DepartmentKey, label: string, icon: any, desc: string }[] = [
            { dept: 'operations_admin', label: 'Operations Admin', icon: Activity, desc: 'Verification & Logistics' },
            { dept: 'marketing_admin', label: 'Marketing Admin', icon: Target, desc: 'Acquisition & Growth' },
            { dept: 'systems_admin', label: 'Systems Admin', icon: Zap, desc: 'Database & Security' },
            { dept: 'it_support', label: 'IT Support', icon: Wrench, desc: 'Maintenance & Reports' },
        ];

        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
                <div className="w-full max-w-4xl glass-card bg-card/80 border border-border shadow-2xl rounded-[3.5rem] p-10 lg:p-14 relative z-10">
                    <div className="flex justify-between items-center mb-10">
                         <Button variant="ghost" onClick={() => setCurrentStep('entry')} className="text-muted-foreground uppercase text-[10px] font-black tracking-widest"><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back</Button>
                         <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">Select <span className="text-primary">Department</span></h2>
                         <div className="w-20" />
                    </div>

                    {error && (
                        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500 font-bold text-left">{decodeURIComponent(error)}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {departments.map((d, i) => (
                            <div key={i} className="bg-secondary border border-border rounded-[2.5rem] p-6 flex flex-col items-center text-center group hover:border-primary/50 transition-all">
                                <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                                    <d.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-[11px] font-black text-foreground uppercase tracking-tight mb-1">{d.label}</h3>
                                <p className="text-[8px] text-muted-foreground font-black uppercase mb-6 tracking-widest opacity-60 leading-tight">{d.desc}</p>
                                <Button 
                                    onClick={() => handleGoogleLogin(d.dept)} 
                                    disabled={isLoading}
                                    className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[8px] sm:text-[9px] tracking-widest rounded-2xl flex items-center justify-center relative overflow-hidden group/btn hover:bg-primary/90 transition-all border-none px-2"
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                        <div className="flex items-center justify-center gap-2 w-full">
                                            <div className="h-6 w-6 sm:h-7 sm:w-7 bg-white rounded-md sm:rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                                <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                                </svg>
                                            </div>
                                            <span className="leading-none mt-0.5 whitespace-nowrap">Sign In with Google</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-muted-foreground/30 text-[8px] uppercase tracking-widest font-black">Admin accounts are assigned by the CEO or Systems Administrator. No self-registration.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback (should not reach here)
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
}

export default function PortalLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
            <PortalLoginContent />
        </Suspense>
    );
}
