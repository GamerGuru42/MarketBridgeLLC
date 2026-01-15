'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ShieldCheck, Lock, Mail, User, Briefcase } from 'lucide-react';

export default function AdminSignupPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [role, setRole] = useState<'admin' | 'technical_admin' | 'operations_admin' | 'marketing_admin'>('admin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const identifier = normalizeIdentifier(formData.email);
            console.log('INITIATING ADMIN PROVISIONING FOR:', identifier);

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: identifier,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        full_name: formData.displayName,
                        role: role,
                    },
                },
            });

            let activeUser = authData?.user;

            if (signUpError) {
                if (signUpError.message?.includes('User already registered') || signUpError.status === 400) {
                    console.log("Admin account exists, attempting recovery...");
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });
                    if (signInData.user) {
                        activeUser = signInData.user;
                    } else {
                        throw new Error("This email is already registered. Please use the login page.");
                    }
                } else if (signUpError.message?.includes('Database error saving new user')) {
                    console.warn("Database trigger failed, attempting recovery...");
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });
                    if (signInData.user) {
                        activeUser = signInData.user;
                    } else {
                        throw new Error("Database sync issue. Please contact technical support.");
                    }
                } else {
                    throw signUpError;
                }
            }

            if (activeUser) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    const { error: profileError } = await supabase
                        .from('users')
                        .upsert({
                            id: activeUser.id,
                            email: identifier,
                            display_name: formData.displayName,
                            role: role,
                            is_verified: true,
                        }, {
                            onConflict: 'id'
                        });

                    if (profileError) {
                        console.error('Profile creation failed:', profileError);
                    }
                } catch (upsertErr) {
                    console.error('Unexpected error during profile creation:', upsertErr);
                }

                // IMPORTANT: Refresh user profile so the app knows we are logged in
                await refreshUser();

                // Critical: Wait for AuthContext to fully update before navigation
                await new Promise(resolve => setTimeout(resolve, 500));

                // Department-aware redirection
                let targetPath = '/admin';
                if (role === 'technical_admin') targetPath = '/admin/technical';
                else if (role === 'operations_admin') targetPath = '/admin/operations';
                else if (role === 'marketing_admin') targetPath = '/admin/marketing';

                router.push(targetPath);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create administrator account');
        } finally {
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
                            Admin Onboarding
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-medium italic text-sm mt-2 lowercase">
                            secure registration | administrative terminal node
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 text-center text-xs text-red-400 font-mono">
                            [ERROR]: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName" className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Full Name</Label>
                                <div className="relative group/input">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within/input:text-[#FFB800] transition-colors" />
                                    <input
                                        id="displayName"
                                        name="displayName"
                                        type="text"
                                        className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-xs"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Admin Name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Leadership Post</Label>
                                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                    <SelectTrigger className="w-full h-12 bg-black border border-white/10 rounded-xl text-[#FFB800] font-black italic text-xs focus:ring-2 focus:ring-[#FFB800]/50">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                        <SelectItem value="technical_admin">Head of Technical</SelectItem>
                                        <SelectItem value="operations_admin">Head of Operations</SelectItem>
                                        <SelectItem value="marketing_admin">Head of Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Admin Email</Label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within/input:text-[#FFB800] transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-xs"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@marketbridge.io"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" title="Password" className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Passphrase</Label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-xs"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" title="Confirm Password" className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">Confirm</Label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-xs"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-gold-gradient text-black font-black uppercase tracking-widest h-14 rounded-xl shadow-[0_0_20px_rgba(255,184,0,0.2)] border-none transition-all hover:opacity-90" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    PROVISIONING...
                                </>
                            ) : (
                                'REGISTER AS ADMINISTRATOR'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col items-center gap-4 py-10 relative z-10 border-t border-white/5">
                    <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                        Authorized personnel only. All access attempts are logged.
                    </p>
                    <div className="flex justify-center gap-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                        <Link href="/admin/login" className="hover:text-[#FFB800] transition-colors underline">Existing Login</Link>
                        <Link href="/" className="hover:text-white transition-colors">Return to Terminal</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
