'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PasswordInput } from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useAuth } from '@/contexts/AuthContext';
import { normalizeIdentifier } from '@/lib/auth/utils';
import { Loader2, ShieldCheck, Lock, Mail, User, Briefcase } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'marketbridge2026';

function AdminSignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dept = searchParams?.get('dept');
    const intent = searchParams?.get('intent');
    const prefillEmail = searchParams?.get('email');
    const token = searchParams?.get('token');
    const { refreshUser } = useAuth();

    const [formData, setFormData] = useState({
        displayName: '',
        email: prefillEmail || '',
        password: '',
        confirmPassword: '',
        secretKey: '',
    });

    // Auto-set role based on dept parameter
    const initialRole = dept ? `${dept}_admin` as any : 'admin';
    const [role, setRole] = useState<'admin' | 'technical_admin' | 'operations_admin' | 'marketing_admin'>(initialRole);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const identifier = normalizeIdentifier(formData.email);
        const isSellerInvite = intent === 'sell' && token && prefillEmail;

        if (!isSellerInvite) {
            // Enforce Secret Key Protection
            if (formData.secretKey !== 'marketbridge2026') {
                setError('Access Denied: Invalid Security Signature');
                setIsLoading(false);
                return;
            }

            // Enforce Allowed Admin Emails
            const allowedAdminEmails = [
                'operations@marketbridge.com.ng',
                'technical@marketbridge.com.ng',
                'marketing@marketbridge.com.ng',
                'ceo@marketbridge.io'
            ];

            if (!allowedAdminEmails.includes(identifier.toLowerCase()) && !identifier.toLowerCase().endsWith('@marketbridge.com.ng')) {
                setError('Restriction: Official @marketbridge.com.ng email required');
                setIsLoading(false);
                return;
            }
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords mismatch');
            setIsLoading(false);
            return;
        }

        try {
            console.log('INITIATING ADMIN PROVISIONING FOR:', identifier);

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: identifier,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        full_name: formData.displayName,
                        role: isSellerInvite ? 'dealer' : role,
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
                } else {
                    throw signUpError;
                }
            }

            if (activeUser) {
                // Wait for session propagation
                await new Promise(resolve => setTimeout(resolve, 1500));

                try {
                    // Forcefully create/update the profile
                    const { error: profileError } = await supabase
                        .from('users')
                        .upsert({
                            id: activeUser.id,
                            email: identifier,
                            display_name: formData.displayName,
                            role: isSellerInvite ? 'dealer' : role,
                            is_verified: true, // Auto-verify admins and approved sellers
                        }, {
                            onConflict: 'id'
                        });

                    if (profileError) {
                        console.error('Profile creation failed:', profileError);
                    }
                } catch (upsertErr) {
                    console.error('Unexpected error during profile creation:', upsertErr);
                }

                // Refresh context
                await refreshUser(activeUser.id);

                // Determine the correct dashboard redirect based on role
                let targetDashboardPath = '/seller/dashboard'; // default seller dashboard
                if (!isSellerInvite) {
                    if (role === 'technical_admin') targetDashboardPath = '/admin/technical';
                    else if (role === 'operations_admin') targetDashboardPath = '/admin/operations';
                    else if (role === 'marketing_admin') targetDashboardPath = '/admin/marketing';
                    else targetDashboardPath = '/admin/operations'; // Super admin fallback for now
                }

                console.log(`Account created successfully. Redirecting to: ${targetDashboardPath}`);

                // Automatically log them in instead of forcing them out
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (signInError) {
                    console.error("Auto-login failed:", signInError);
                    console.warn('UI_ALERT:', );
                    router.push('/login');
                    return;
                }

                // Redirect immediately to their dashboard
                router.push(targetDashboardPath);
            }
        } catch (err: unknown) {
            console.error("Admin Signup Main Error:", err);
            const message = err instanceof Error ? err.message : 'Failed to create administrator account';
            setError(message);
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
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg glass-card border-none shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6200]/40 to-transparent"></div>

                <CardHeader className="space-y-6 pt-16 pb-10 text-center">
                    <div className="mx-auto h-24 w-24 rounded-full border border-[#FF6200]/30 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="h-12 w-12 text-[#FF6200]" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black tracking-[0.3em] text-white uppercase italic">
                            {intent === 'sell' ? 'Seller Onboarding' : 'Admin Onboarding'}
                        </CardTitle>
                        <CardDescription className="text-white/40 font-medium italic text-sm mt-2 lowercase">
                            {intent === 'sell' ? 'Welcome to campus crew' : 'secure registration | administrative Dashboard Campus'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-10">
                    {error && (
                        <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-2xl p-4 mb-8 text-center text-xs text-[#FF6200] font-mono">
                            [ERROR]: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName" className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Full Name</Label>
                                <div className="relative group/input">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/input:text-[#FF6200] transition-colors" />
                                    <input
                                        id="displayName"
                                        name="displayName"
                                        type="text"
                                        className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium text-xs"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Admin Name"
                                    />
                                </div>
                            </div>
                            {intent !== 'sell' && (
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Leadership Post</Label>
                                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                        <SelectTrigger className="w-full h-12 bg-black border border-white/10 rounded-xl text-[#FF6200] font-black italic text-xs focus:ring-2 focus:ring-[#FF6200]/50">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                            <SelectItem value="admin">Super Admin (Mission Control)</SelectItem>
                                            <SelectItem value="technical_admin">Head of Technical</SelectItem>
                                            <SelectItem value="operations_admin">Head of Operations</SelectItem>
                                            <SelectItem value="marketing_admin">Head of Marketing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">
                                {intent === 'sell' ? 'Student Email' : 'Admin Email'}
                            </Label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/input:text-[#FF6200] transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium text-xs disabled:opacity-50"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={intent === 'sell' && !!prefillEmail}
                                    placeholder={intent === 'sell' ? "student@university.edu" : "admin@marketbridge.io"}
                                />
                            </div>
                        </div>

                        {intent !== 'sell' && (
                            <div className="space-y-2">
                                <Label htmlFor="secretKey" className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Secret Admin Code <span className="text-[#FF6200]">*</span></Label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/input:text-[#FF6200] transition-colors" />
                                    <input
                                        id="secretKey"
                                        name="secretKey"
                                        type="password"
                                        className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium text-xs"
                                        value={formData.secretKey}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter the team secret code"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" title="Password" className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium text-xs"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Create a password"
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" title="Confirm Password" className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Confirm Password</Label>
                                <PasswordInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/50 transition-all font-medium text-xs"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Repeat password"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-[#FF6200] text-black font-black uppercase tracking-widest h-14 rounded-xl shadow-[0_0_20px_rgba(255,98,0,0.2)] border-none transition-all hover:opacity-90" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    PROVISIONING...
                                </>
                            ) : intent === 'sell' ? (
                                'COMPLETE SELLER PROFILE'
                            ) : (
                                'REGISTER AS ADMINISTRATOR'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col items-center gap-4 py-10 relative z-10 border-t border-white/5">
                    <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        Authorized personnel only. All access attempts are logged.
                    </p>
                    <div className="flex justify-center gap-6 text-[10px] text-white/40 font-black uppercase tracking-widest">
                        <Link href="/admin/login" className="hover:text-[#FF6200] transition-colors underline">Existing Login</Link>
                        <Link href="/" className="hover:text-white transition-colors">Return to Dashboard</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AdminSignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" />
            </div>
        }>
            <AdminSignupContent />
        </Suspense>
    );
}