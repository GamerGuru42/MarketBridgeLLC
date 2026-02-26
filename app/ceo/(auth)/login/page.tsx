'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, Crown, Lock, Mail, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CEOLoginPage() {
    const supabase = createClient();
    const router = useRouter();
    const { refreshUser } = useAuth();

    // State
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
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: formData.password,
            });

            if (signInError) throw signInError;
            if (!authData.user) throw new Error('Authentication failed');

            // 2. Authoritative Verification & Deep Repair
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            let role = profile?.role || authData.user.user_metadata?.role;

            // DEEP REPAIR: If this is the specific CEO email and role is missing/incorrect, FORCE REPAIR
            if (identifier === 'ceo@marketbridge.io' && role !== 'ceo') {
                console.log('Deep Repair: Elevating to CEO role...');
                await supabase.from('users').upsert({
                    id: authData.user.id,
                    email: identifier,
                    role: 'ceo',
                    is_verified: true,
                    display_name: authData.user.user_metadata?.display_name || 'Founding Partner'
                });

                // Force update auth metadata
                await supabase.auth.updateUser({
                    data: { role: 'ceo', is_executive: true }
                });

                role = 'ceo';
            }

            if (role !== 'ceo' && role !== 'cofounder') {
                if (['admin', 'technical_admin', 'operations_admin', 'marketing_admin'].includes(role || '')) {
                    router.push('/admin/login');
                    return;
                }
                await supabase.auth.signOut();
                throw new Error('Access denied. Executive clearance required.');
            }

            // 3. Update local context
            await refreshUser(authData.user.id);

            // 4. Hard redirect to ensure middleware picks up the session
            window.location.href = '/ceo';

        } catch (err: unknown) {
            console.error('Login Error:', err);
            const message = err instanceof Error ? err.message : 'Verification failed. Please check credentials.';
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05),transparent)] pointer-events-none"></div>

            <Card className="w-full max-w-lg bg-zinc-950 border-none shadow-[0_30px_100px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent"></div>

                <CardHeader className="space-y-6 pt-16 pb-10 text-center">
                    <div className="mx-auto h-24 w-24 rounded-full border border-[#d4af37]/30 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                        <Crown className="h-12 w-12 text-[#d4af37]" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-[0.3em] text-white uppercase italic">
                            Vision Command
                        </CardTitle>
                        <CardDescription className="text-white/40 font-serif italic text-sm mt-2">
                            MarketBridge.io | Executive Authentication Portal
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-12">
                    {error && (
                        <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-lg p-4 mb-8 text-center">
                            <p className="text-[10px] text-[#FF6200] font-bold uppercase tracking-widest leading-relaxed">
                                Security Alert: {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Master ID</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/20 group-focus-within:text-[#d4af37] transition-colors" />
                                <Input
                                    name="email"
                                    type="email"
                                    className="bg-transparent border-b border-zinc-900 border-x-0 border-t-0 rounded-none h-12 text-sm focus:ring-0 focus:border-[#d4af37] transition-all px-10 placeholder:text-white/10 text-white"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Executive Email"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 pt-2">
                            <Label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Signature Key</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/20 group-focus-within:text-[#d4af37] transition-colors" />
                                <Input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="bg-transparent border-b border-zinc-900 border-x-0 border-t-0 rounded-none h-12 text-sm focus:ring-0 focus:border-[#d4af37] transition-all px-10 placeholder:text-white/10 text-white"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-[#d4af37] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#d4af37] hover:bg-[#e5c150] text-black font-black uppercase tracking-[0.2em] h-14 transition-all relative overflow-hidden group shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    Initiate Session
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col items-center gap-6 py-12 relative z-10">
                    <div className="flex items-center gap-8">
                        <Link href="/ceo/signup" className="text-[9px] font-bold text-white/30 hover:text-[#d4af37] uppercase tracking-widest transition-colors">Apply for Access</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
