'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck, Lock, Mail, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
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
                .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

            if (profileFetchError) {
                console.warn('Profile fetch warning:', profileFetchError);
            }

            // Robust Role Resolution: Check both sources
            const dbRole = profile?.role;
            const metaRole = data.user.user_metadata?.role;
            let role = dbRole || metaRole;

            console.log("Admin Login Role Resolution:", { dbRole, metaRole, resolved: role });

            // SELF-HEALING: If DB profile is missing but Auth Metadata exists, restore the DB record
            if (metaRole && !dbRole) {
                console.log('Self-Healing: Restoring missing profile from Auth Metadata...');
                const { error: healError } = await supabase.from('users').upsert({
                    id: data.user.id,
                    email: identifier,
                    role: metaRole,
                    is_verified: true,
                    display_name: data.user.user_metadata?.display_name || 'Admin User'
                });
                if (healError) console.error('Self-Healing Failed:', healError);
                // We proceed anyway since we have role from metadata
            }

            // DEEP REPAIR: Protect CEO and high-level accounts from landing loops
            if (identifier === 'ceo@marketbridge.io' && role !== 'ceo') {
                console.log('Deep Repair: Restoring CEO administrative status...');
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: identifier,
                    role: 'ceo',
                    is_verified: true,
                    display_name: data.user.user_metadata?.display_name || 'Visionary Leader'
                });
                await supabase.auth.updateUser({ data: { role: 'ceo', is_executive: true } });
                role = 'ceo';
            }

            const adminRoles = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'];

            if (!adminRoles.includes(role || '')) {
                console.error(`Access Denied. Role '${role}' is not in adminRoles list.`);
                await supabase.auth.signOut();
                throw new Error('Access Denied: Administrative privileges required.');
            }

            // 3. Sync and Redirect
            await refreshUser(data.user.id);
            router.refresh(); // Critical: Ensure Next.js sees the new session state

            // Department-aware redirection
            let targetPath = '/admin';
            if (role === 'technical_admin') targetPath = '/admin/technical';
            else if (role === 'operations_admin') targetPath = '/admin/operations';
            else if (role === 'marketing_admin') targetPath = '/admin/marketing';
            // CEO route is deprecated, redirecting to main admin
            else if (role === 'ceo' || role === 'cofounder') targetPath = '/admin';

            // Use router.push for client-side nav, fallback to window.location if needed (but push is smoother)
            // Actually, for auth changes, window.location is often safer to ensure middleware re-runs reliably
            console.log(`Redirecting to ${targetPath}`);
            window.location.href = targetPath;

        } catch (err: unknown) {
            console.error('Admin Login Error:', err);
            const message = err instanceof Error ? err.message : 'Verification failed.';
            setError(message);
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black overflow-hidden relative">
            {/* Background Accents */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,184,0,0.05),transparent)] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg glass-card border-none shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFB800]/40 to-transparent"></div>

                <CardHeader className="space-y-6 pt-16 pb-10 text-center">
                    <div className="mx-auto h-24 w-24 rounded-full border border-[#FFB800]/30 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="h-12 w-12 text-[#FFB800]" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black tracking-[0.3em] text-white uppercase italic">
                            Mission Control
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic text-sm mt-2 lowercase">
                            secure gateway | administrative terminal node
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-12">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 text-center">
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-relaxed">
                                Security Alert: {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Administrator ID</Label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-700 group-focus-within/input:text-[#FFB800] transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full h-16 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@marketbridge.io"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Signature Key</Label>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-700 group-focus-within/input:text-[#FFB800] transition-colors" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full h-16 pl-14 pr-14 bg-black border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-800 hover:text-[#FFB800] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gold-gradient hover:opacity-90 text-black font-black uppercase tracking-[0.2em] h-16 rounded-2xl transition-all relative overflow-hidden group shadow-[0_0_20px_rgba(255,184,0,0.2)] border-none"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    Verify Credentials
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col items-center gap-6 py-12 relative z-10">
                    <div className="flex items-center gap-8">
                        <Link href="/login" className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Standard Gateway</Link>
                        <Link href="/admin/signup" className="text-[9px] font-bold text-zinc-600 hover:text-[#FFB800] uppercase tracking-widest transition-colors underline">Request Access</Link>
                        <Link href="/" className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Public Portal</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
