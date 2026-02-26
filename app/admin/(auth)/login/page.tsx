'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck, Lock, Mail, ChevronRight, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const { refreshUser, user, loading } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [view, setView] = useState<'login' | 'failed'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const identifier = normalizeIdentifier(formData.email);

            // 1. Authenticate
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: formData.password,
            });

            if (signInError) throw signInError;
            if (!data.user) throw new Error('Authentication failed');

            // 2. Authoritative Verification & Deep Repair
            const { data: profile, error: profileFetchError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (profileFetchError) {
                console.warn('Profile fetch warning:', profileFetchError);
            }

            // Robust Role Resolution
            const dbRole = profile?.role;
            const metaRole = data.user.user_metadata?.role;
            let role = dbRole || metaRole;

            console.log("Admin Login Role Resolution:", { dbRole, metaRole, resolved: role });

            // Self-Healing
            if (metaRole && !dbRole) {
                console.log('Self-Healing: Restoring missing profile from Auth Metadata...');
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: identifier,
                    role: metaRole,
                    is_verified: true,
                    display_name: data.user.user_metadata?.display_name || 'Admin User'
                });
            }

            // DEEP REPAIR: Protect CEO
            if (identifier === 'ceo@marketbridge.io' && role !== 'ceo') {
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: identifier,
                    role: 'ceo',
                    is_verified: true,
                    display_name: 'Visionary Leader'
                });
                await supabase.auth.updateUser({ data: { role: 'ceo', is_executive: true } });
                role = 'ceo';
            }

            const adminRoles = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'];
            if (!adminRoles.includes(role || '')) {
                console.error(`Access Denied. Role '${role}' is not in adminRoles list.`);
                await supabase.auth.signOut();
                throw new Error('Access Denied: You do not hold administrative privileges.');
            }

            // 3. Sync and Redirect
            await refreshUser(data.user.id);

            // OPTIMIZATION: Small delay to ensure DB propagation for middleware
            await new Promise(resolve => setTimeout(resolve, 800));

            let targetPath = '/admin';
            if (role === 'technical_admin') targetPath = '/admin/technical';
            else if (role === 'operations_admin') targetPath = '/admin/operations';
            else if (role === 'marketing_admin') targetPath = '/admin/marketing';
            else if (role === 'ceo' || role === 'cofounder') targetPath = '/admin/ceo';

            console.log(`Redirecting to ${targetPath}`);
            router.refresh();
            router.push(targetPath);
        } catch (err: unknown) {
            console.error('Admin Login Error:', err);
            const message = err instanceof Error ? err.message : 'Verification failed.';
            setError(message);
            setIsLoading(false);
            setView('failed');
        }
    };

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (!loading && user) {
            const role = user.role;
            const adminRoles = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'];
            if (adminRoles.includes(role || '')) {
                let targetPath = '/admin';
                if (role === 'technical_admin') targetPath = '/admin/technical';
                else if (role === 'operations_admin') targetPath = '/admin/operations';
                else if (role === 'marketing_admin') targetPath = '/admin/marketing';
                else if (role === 'ceo' || role === 'cofounder') targetPath = '/admin/ceo';

                console.log('Already authenticated as Admin. Redirecting...');
                router.replace(targetPath);
            }
        }
    }, [user, loading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Fail Screen Component
    if (view === 'failed') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
                <div className="absolute inset-0 bg-[#3a0000] pointer-events-none opacity-20 animate-pulse"></div>
                <Card className="w-full max-w-lg glass-card border border-[#FF6200]/30 shadow-[0_0_80px_rgba(220,38,38,0.2)] bg-black relative overflow-hidden">
                    <CardHeader className="text-center pt-12 pb-8">
                        <div className="mx-auto h-24 w-24 rounded-full border-2 border-[#FF6200] bg-red-950/30 flex items-center justify-center mb-6 animate-in fade-in zoom-in duration-300">
                            <ShieldAlert className="h-12 w-12 text-[#FF6200]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#FF6200] tracking-[0.2em] uppercase">Access Denied</h2>
                        <p className="text-white/40 text-xs font-mono mt-4 uppercase tracking-widest">
                            Security System Override Failed
                        </p>
                    </CardHeader>
                    <CardContent className="px-10 text-center space-y-8">
                        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl">
                            <p className="text-[#FF6200] text-sm font-medium">
                                "{error}"
                            </p>
                        </div>
                        <Button
                            onClick={() => setView('login')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] h-14 rounded-xl transition-all"
                        >
                            Retry Handshake
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center pb-8">
                        <Link href="/" className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest transition-colors">
                            Return to Public Portal
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
            {/* Background Accents */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,184,0,0.05),transparent)] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg glass-card border-none shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/40 to-transparent"></div>
                <CardHeader className="space-y-6 pt-16 pb-10 text-center">
                    <div className="mx-auto h-24 w-24 rounded-full border border-[#FF6200]/30 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="h-12 w-12 text-[#FF6200]" />
                    </div>
                    <div>
                        <div className="flex flex-col items-center justify-center">
                            <CardTitle className="text-3xl font-black tracking-[0.3em] uppercase italic flex flex-wrap justify-center text-center leading-tight">
                                <span><span className="text-white">MARKET</span><span className="text-[#FF6200]">BRIDGE</span></span>
                            </CardTitle>
                            <CardTitle className="text-3xl font-black tracking-[0.3em] uppercase italic text-white mt-1">
                                Admin Portal
                            </CardTitle>
                        </div>
                        <CardDescription className="text-white/40 font-medium italic text-sm mt-2 lowercase">
                            Sign in with your team account
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Email Address</Label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within/input:text-[#FF6200] transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full h-16 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@marketbridge.io"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Password</Label>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within/input:text-[#FF6200] transition-colors" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full h-16 pl-14 pr-14 bg-black border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-[#FF6200] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#FF6200] hover:opacity-90 text-black font-black uppercase tracking-[0.2em] h-16 rounded-2xl transition-all relative overflow-hidden group shadow-[0_0_20px_rgba(255,98,0,0.2)] border-none"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    Sign In
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="py-6 relative z-10" />
            </Card>
        </div>
    );
}