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
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            let role = profile?.role || data.user.user_metadata?.role;

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
                await supabase.auth.signOut();
                throw new Error('Access Denied: Administrative privileges required.');
            }

            // 3. Sync and Redirect
            await refreshUser(data.user.id);

            // Department-aware redirection
            let targetPath = '/admin';
            if (role === 'technical_admin') targetPath = '/admin/technical';
            else if (role === 'operations_admin') targetPath = '/admin/operations';
            else if (role === 'marketing_admin') targetPath = '/admin/marketing';
            else if (role === 'ceo' || role === 'cofounder') targetPath = '/ceo';

            window.location.href = targetPath;

        } catch (err: any) {
            console.error('Admin Login Error:', err);
            setError(err.message || 'Verification failed.');
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>

            <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                <CardHeader className="space-y-4 pt-10 pb-6 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-widest text-white uppercase italic">
                            Mission Control
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-mono text-[10px] mt-1">
                            SECURE GATEWAY | ADMINISTRATIVE TERMINAL
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 px-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-3">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400 font-mono italic">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Administrator ID</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                                <Input
                                    name="email"
                                    type="email"
                                    className="bg-slate-950 border-slate-800 pl-10 h-12 text-sm focus:ring-1 focus:ring-primary ring-offset-slate-900"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="email@marketbridge.io"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Access Key</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                                <Input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="bg-slate-950 border-slate-800 pl-10 pr-12 h-12 text-sm focus:ring-1 focus:ring-primary ring-offset-slate-900"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black italic tracking-widest h-12 transition-all group mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    VERIFY CREDENTIALS
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="bg-slate-950/50 p-6 flex flex-col gap-4 border-t border-slate-800/50">
                    <div className="flex justify-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        <Link href="/login" className="hover:text-white transition-colors">Standard Login</Link>
                        <Link href="/admin/signup" className="hover:text-primary transition-colors underline">Req Access</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
