'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];

// ─── Admin Session Cookie ────────────────────────────────────────────────────
// Sets a secondary cookie that the middleware checks for admin routes.
// This ensures that even if a public user has a valid Supabase session,
// they cannot access admin pages without going through this portal.
function setAdminSessionCookie(userId: string, role: string) {
    const payload = btoa(JSON.stringify({ uid: userId, role, ts: Date.now() }));
    // HttpOnly can't be set from JS — but we use SameSite=Strict + Secure
    // The middleware validates existence; the real auth is the Supabase JWT.
    document.cookie = `mb-admin-session=${payload}; path=/; max-age=${8 * 60 * 60}; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

function PortalLoginContent() {
    const supabase = createClient();
    const { refreshUser, user, sessionUser, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams?.get('redirect') || searchParams?.get('next');
    const reason = searchParams?.get('reason');

    type Step = 'role' | 'credentials';
    type AdminRole = 'admin' | 'ceo';
    type AuthMode = 'login' | 'signup';

    const [currentStep, setCurrentStep] = useState<Step>('role');
    const [selectedRole, setSelectedRole] = useState<AdminRole>('admin');
    const [expandedRole, setExpandedRole] = useState<AdminRole | null>(null);
    const [authMode, setAuthMode] = useState<AuthMode>('login');

    const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && sessionUser && user && ADMIN_ROLES.includes(user.role)) {
            // Already authenticated admin — set cookie and redirect
            setAdminSessionCookie(user.id, user.role);
            if (user.role === 'ceo') router.push('/admin/ceo');
            else router.push('/admin');
        }
    }, [user, sessionUser, loading, router, redirectUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    // ─── Audit Logging ───────────────────────────────────────────────────────
    const logAuditEvent = async (
        eventType: 'login_success' | 'login_failure' | 'access_denied',
        userId: string | null,
        details: string
    ) => {
        try {
            await supabase.from('admin_audit_log').insert({
                event_type: eventType,
                user_id: userId,
                ip_address: null, // Can't get IP from client; middleware logs set this server-side
                user_agent: navigator.userAgent,
                details,
                created_at: new Date().toISOString(),
            });
        } catch (err) {
            // Audit logging should never break the login flow
            console.warn('Audit log failed:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const emailToUse = normalizeIdentifier(formData.email);
            let authResponse: any;

            if (authMode === 'signup') {
                const signupPromise = supabase.auth.signUp({
                    email: emailToUse,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            role: selectedRole,
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
                await logAuditEvent('login_failure', null, `Failed ${authMode} for ${emailToUse}: ${authError.message}`);
                const msg = authError.message?.toLowerCase() ?? '';
                if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
                    setError('Incorrect email or password.');
                } else if (msg.includes('already registered')) {
                    setError('An account with this email already exists.');
                } else if (msg.includes('timed out')) {
                    setError('Connection timed out.');
                } else {
                    setError(authError.message || 'Authorization failed.');
                }
                return;
            }

            if (!data?.user) {
                await logAuditEvent('login_failure', null, `No user returned for ${emailToUse}`);
                setError('Authorization failed.');
                return;
            }

            if (authMode === 'signup' && !data.session) {
                setError('Registration successful. Please check your email inbox to verify your account.');
                setIsLoading(false);
                return;
            }

            // Verify admin role from database (not just JWT metadata)
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            const userRole = profile?.role || data.user.user_metadata?.role;

            if (!ADMIN_ROLES.includes(userRole)) {
                await logAuditEvent('access_denied', data.user.id, `Non-admin role "${userRole}" attempted portal access`);
                await supabase.auth.signOut();
                setError('Access denied. This portal is restricted to authorized team members.');
                return;
            }

            // ✅ Successful admin login
            await logAuditEvent('login_success', data.user.id, `Admin login successful (role: ${userRole})`);

            // Set the secondary admin session cookie
            setAdminSessionCookie(data.user.id, userRole);

            // Sync auth context
            refreshUser(data.user.id).catch(err => console.warn('Context sync error:', err));

            // Route to appropriate dashboard
            if (userRole === 'ceo') {
                router.replace('/admin/ceo');
            } else {
                router.replace('/admin');
            }

        } catch (err: any) {
            setError(err.message || 'Authorization failed.');
        } finally {
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

    const handleRoleSelect = (role: AdminRole, mode: AuthMode = 'login') => {
        setSelectedRole(role);
        setAuthMode(mode);
        setCurrentStep('credentials');
    };

    if (currentStep === 'role') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-background relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-2xl glass-card bg-card/80 border border-border shadow-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 relative z-10">
                    <div className="text-center mb-12 space-y-4">
                        <div className="flex justify-center mb-6">
                            <Logo showText={false} className="scale-125" />
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Restricted Access</span>
                        </div>
                        
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                            HQ <span className="text-primary">Portal</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                            Select Authentication Path
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:px-4">
                        {/* ─── Admin / Staff Card ─────────────────────────────────── */}
                        <div 
                            onClick={() => setExpandedRole(expandedRole === 'admin' ? null : 'admin')}
                            className={cn(
                                "bg-secondary border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm cursor-pointer transition-all duration-300",
                                expandedRole === 'admin' ? "border-primary/50 ring-1 ring-primary/20 scale-[1.02]" : "border-border hover:border-primary/30"
                            )}>
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4">
                                <UserIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Admin Access</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-2">Staff & Ops</p>
                            
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'admin' ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button
                                    onClick={(e) => { e.stopPropagation(); handleRoleSelect('admin', 'login'); }}
                                    className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)] transition-all"
                                >
                                    Log In <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleRoleSelect('admin', 'signup'); }}
                                    className="w-full h-12 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all border-border text-muted-foreground hover:text-foreground"
                                >
                                    Apply For Access
                                </Button>
                            </div>
                        </div>

                        {/* ─── CEO Card ────────────────────────────────────────── */}
                        <div 
                            onClick={() => setExpandedRole(expandedRole === 'ceo' ? null : 'ceo')}
                            className={cn(
                                "bg-secondary border rounded-3xl p-6 text-center flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer transition-all duration-300",
                                expandedRole === 'ceo' ? "border-primary/50 ring-1 ring-primary/20 scale-[1.02]" : "border-border hover:border-primary/30"
                            )}>
                            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,98,0,0.8)]" />
                            <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center mb-4">
                                <Lock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Vision Command</h3>
                            <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-2">CEO Only</p>
                            
                            <div className={cn("w-full space-y-2.5 overflow-hidden transition-all duration-500", expandedRole === 'ceo' ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0")}>
                                <Button
                                    onClick={(e) => { e.stopPropagation(); handleRoleSelect('ceo', 'login'); }}
                                    className="w-full h-12 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
                                >
                                    Access Terminal <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleRoleSelect('ceo', 'signup'); }}
                                    className="w-full h-12 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all border-border text-muted-foreground hover:text-foreground"
                                >
                                    Apply For Access
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 mt-8 border-t border-border">
                        <p className="text-muted-foreground/50 text-[9px] uppercase tracking-widest font-bold">
                            This portal is monitored. All access attempts are logged.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 py-12 bg-background relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg glass-card bg-card/80 border border-border shadow-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 lg:p-14 relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep('role')}
                            className="text-muted-foreground hover:text-foreground uppercase text-[10px] font-black tracking-widest px-0"
                        >
                            <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back
                        </Button>
                    </div>

                    <div className="flex justify-center mb-6">
                        <Logo showText={false} className="scale-125" />
                    </div>

                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground italic font-heading">
                        {selectedRole === 'ceo' ? 'Decision' : 'Staff'} <span className="text-primary">{authMode === 'signup' ? 'Signup' : 'Login'}</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] italic">
                        {authMode === 'signup' ? 'Create Team Account' : 'Enter Credentials'}
                    </p>
                </div>

                {reason === 'session_required' && !error && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <Shield className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                            Your admin session has expired. Please log in again.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-destructive text-[10px] font-bold uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {authMode === 'signup' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Full Name</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <input
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                    placeholder="John Doe"
                                    className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-2">Secure Email</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <UserIcon className="h-4 w-4" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoFocus
                                placeholder={selectedRole === 'ceo' ? "ceo@marketbridge.com" : "admin@marketbridge.com"}
                                className="w-full h-16 pl-14 pr-6 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground font-heading ml-1">Password</label>
                            <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all pr-1">
                                Reset?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full h-16 pl-14 pr-16 bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-all font-bold tracking-wider text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-16 bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] text-sm rounded-2xl border-none shadow-[0_10px_30px_rgba(255,98,0,0.3)] transition-all flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-6 w-6" />
                            ) : (
                                <>
                                    {authMode === 'signup' ? 'Create Account' : 'Authenticate'} <ArrowRight className="ml-4 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="text-center pt-8 mt-8 border-t border-border">
                    <p className="text-muted-foreground/50 text-[9px] uppercase tracking-widest font-bold">
                        This portal is monitored. All access attempts are logged.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PortalLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        }>
            <PortalLoginContent />
        </Suspense>
    );
}
