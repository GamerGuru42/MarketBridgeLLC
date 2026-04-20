'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon, AlertTriangle, ArrowRight, Shield, Activity, Users, Zap, Target } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];

// ─── Admin Session Cookie ────────────────────────────────────────────────────
function setAdminSessionCookie(userId: string, role: string) {
    const payload = btoa(JSON.stringify({ uid: userId, role, ts: Date.now() }));
    const isProduction = window.location.origin.includes('marketbridge.com.ng');
    const domain = isProduction ? '; domain=.marketbridge.com.ng' : '';
    document.cookie = `mb-admin-session=${payload}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}${domain}`;
}

function PortalLoginContent() {
    const supabase = createClient();
    const { refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || searchParams?.get('next');
    const reason = searchParams?.get('reason');

    type Step = 'entry' | 'role_select' | 'credentials';
    type AdminRole = 'technical_admin_alpha' | 'technical_admin_beta' | 'operations_admin' | 'marketing_admin' | 'ceo';
    type AuthMode = 'login' | 'signup';

    const [currentStep, setCurrentStep] = useState<Step>('entry');
    const [selectedRole, setSelectedRole] = useState<AdminRole>('operations_admin');
    const [authMode, setAuthMode] = useState<AuthMode>('login');

    const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && sessionUser && user && ADMIN_ROLES.includes(user.role)) {
            setAdminSessionCookie(user.id, user.role);
            // Use window.location as fallback if router is already busy or stuck
            const target = user.role === 'ceo' ? '/admin/ceo' : '/admin';
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
                window.location.assign(target);
            }
        }
    }, [user, sessionUser, loading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const emailToUse = normalizeIdentifier(formData.email);
            // Standardize sub-roles if needed, but we now use specific roles for the 4 portals
            let dbRole: string = selectedRole;

            let authResponse: any;

            if (authMode === 'signup') {
                const signupPromise = supabase.auth.signUp({
                    email: emailToUse,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            role: dbRole,
                        }
                    }
                });
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timed out.')), 8000)
                );
                authResponse = await Promise.race([signupPromise, timeoutPromise as any]);
            } else {
                const loginPromise = supabase.auth.signInWithPassword({
                    email: emailToUse,
                    password: formData.password,
                });
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timed out.')), 8000)
                );
                authResponse = await Promise.race([loginPromise, timeoutPromise as any]);
            }

            const { data, error: authError } = authResponse;

            if (authError) {
                setError(authError.message || 'Authentication failed.');
                setIsLoading(false);
                return;
            }

            if (!data?.user) {
                setError('Authentication failed.');
                setIsLoading(false);
                return;
            }

            // PROACTIVE SYNC: Handled securely via Postgres Trigger on_auth_user_created

            if (authMode === 'signup' && !data.session) {
                setError('Account created. Please verify your email.');
                setIsLoading(false);
                return;
            }

            // Verify role
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            const userRole = profile?.role || data.user.user_metadata?.role;

            if (!ADMIN_ROLES.includes(userRole)) {
                await supabase.auth.signOut();
                setError('Access denied. No administrative privileges.');
                setIsLoading(false);
                return;
            }

            setAdminSessionCookie(data.user.id, userRole);
            await refreshUser(data.user.id);

            const target = userRole === 'ceo' ? '/admin/ceo' : '/admin';
            window.location.assign(target);

        } catch (err: any) {
            setError(err.message || 'Authentication failed.');
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            let dbRole: string = selectedRole;
            if (selectedRole.startsWith('technical_admin')) dbRole = 'technical_admin';
            
            const targetDestination = dbRole === 'ceo' ? '/admin/ceo' : '/admin';
            const callbackOrigin = window.location.origin;
            const isProduction = callbackOrigin.includes('marketbridge.com.ng');
            const domain = isProduction ? '; domain=.marketbridge.com.ng' : '';

            document.cookie = `mb_oauth_role=${dbRole}; path=/; max-age=600; SameSite=Lax${domain}`;
            document.cookie = `mb_oauth_next=${encodeURIComponent(targetDestination)}; path=/; max-age=600; SameSite=Lax${domain}`;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${callbackOrigin}/auth/callback?role=${dbRole}&next=${encodeURIComponent(targetDestination)}`,
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

    const startAuth = (role: AdminRole, mode: AuthMode = 'login') => {
        setSelectedRole(role);
        setAuthMode(mode);
        setCurrentStep('credentials');
    };

    if (currentStep === 'entry') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] max-w-[500px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

                <div className="w-full max-w-2xl glass-card bg-card/80 border border-border mt-8 mb-8 shadow-2xl rounded-[3rem] p-10 lg:p-14 relative z-10 text-center">
                    <div className="flex justify-center mb-8">
                        {/* Fixed Logo: Using Favicon as requested */}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                        <div 
                            onClick={() => setCurrentStep('role_select')}
                            className="group bg-secondary border border-border rounded-[2rem] p-8 text-center flex flex-col items-center cursor-pointer hover:border-primary/50 transition-all active:scale-95"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-2">Staff Login</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest italic opacity-60">Admin Accounts</p>
                        </div>

                        <div 
                            onClick={() => startAuth('ceo', 'login')}
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

    if (currentStep === 'role_select') {
        const roles: { role: AdminRole, label: string, icon: any, desc: string }[] = [
            { role: 'operations_admin', label: 'Operations Admin', icon: Activity, desc: 'Verification & Logistics' },
            { role: 'marketing_admin', label: 'Marketing Admin', icon: Target, desc: 'Acquisition & Growth' },
            { role: 'systems_admin', label: 'Systems Admin', icon: Zap, desc: 'Database & Security' },
            { role: 'it_support', label: 'IT Support', icon: Zap, desc: 'Maintenance & Reports' },
        ];

        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
                <div className="w-full max-w-4xl glass-card bg-card/80 border border-border shadow-2xl rounded-[3.5rem] p-10 lg:p-14 relative z-10">
                    <div className="flex justify-between items-center mb-10">
                         <Button variant="ghost" onClick={() => setCurrentStep('entry')} className="text-muted-foreground uppercase text-[10px] font-black tracking-widest"><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back</Button>
                         <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">Select <span className="text-primary">Department</span></h2>
                         <div className="w-20" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {roles.map((r, i) => (
                            <div key={i} className="bg-secondary border border-border rounded-[2.5rem] p-6 flex flex-col items-center text-center group hover:border-primary/50 transition-all">
                                <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                                    <r.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-[11px] font-black text-foreground uppercase tracking-tight mb-1">{r.label}</h3>
                                <p className="text-[8px] text-muted-foreground font-black uppercase mb-6 tracking-widest opacity-60 leading-tight">{r.desc}</p>
                                <div className="w-full space-y-2">
                                    <Button onClick={() => startAuth(r.role, 'login')} className="w-full h-11 bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-widest rounded-xl">Login</Button>
                                    <Button variant="outline" onClick={() => startAuth(r.role, 'signup')} className="w-full h-11 border-border font-black uppercase text-[9px] tracking-widest rounded-xl text-muted-foreground hover:text-foreground">Signup</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
            <div className="w-full max-w-lg glass-card bg-card/80 border border-border shadow-2xl rounded-[3rem] p-10 lg:p-14 relative z-10 m-auto">
                <div className="text-center mb-10 space-y-4">
                    <Button variant="ghost" onClick={() => setCurrentStep('role_select')} className="text-muted-foreground hover:text-foreground text-[10px] font-black px-0 mb-4"><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Change Role</Button>
                    <div className="flex justify-center mb-6">
                         <img src="/favicon.png" alt="MarketBridge" className="h-10 w-10 object-contain" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">
                        {selectedRole.replace(/_/g, ' ')} <span className="text-primary">{authMode}</span>
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {authMode === 'signup' && (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-muted-foreground ml-2">Full Name</label>
                            <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} required placeholder="Name" className="w-full h-16 pl-6 bg-secondary border border-border rounded-2xl text-foreground font-bold text-sm focus:border-primary/50 outline-none" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-muted-foreground ml-2">Admin Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Email" className="w-full h-16 pl-6 bg-secondary border border-border rounded-2xl text-foreground font-bold text-sm focus:border-primary/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-muted-foreground ml-2">Password</label>
                        <div className="relative">
                            <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required placeholder="••••••••" className="w-full h-16 pl-6 pr-16 bg-secondary border border-border rounded-2xl text-foreground font-bold text-sm focus:border-primary/50 outline-none" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-sm rounded-2xl shadow-xl shadow-primary/20">{isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : authMode === 'signup' ? 'Create Account' : 'Login'}</Button>
                    
                    <div className="relative py-2">
                         <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                         <div className="relative flex justify-center text-[10px] uppercase font-black text-muted-foreground"><span className="bg-card px-4">Social Access</span></div>
                    </div>

                    <Button type="button" onClick={handleGoogleLogin} disabled={isLoading} variant="outline" className="w-full h-16 bg-background rounded-2xl border-border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                         <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                         Google Authentication
                    </Button>
                </form>
            </div>
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
