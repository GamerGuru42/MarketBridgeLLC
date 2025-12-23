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
import { Loader2, ShieldCheck, Lock, Mail, User, Briefcase } from 'lucide-react';

export default function AdminSignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminCode: '', // Mock security check
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

        // Mock verification code check
        if (formData.adminCode !== 'MB-ADMIN-2024') {
            setError('Invalid Administrator Verification Code');
            setIsLoading(false);
            return;
        }

        try {
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        role: role,
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (authData.user) {
                // Wait for trigger
                await new Promise(resolve => setTimeout(resolve, 1000));

                const { error: profileError } = await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: formData.email,
                        display_name: formData.displayName,
                        role: role,
                        is_verified: true,
                    });

                if (profileError) throw profileError;
                router.push('/admin');
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 font-sans">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

            <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-slate-100 shadow-2xl relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-primary to-blue-400"></div>

                <CardHeader className="space-y-1 pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-center tracking-tight text-white uppercase italic">
                        Admin Onboarding
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400 font-medium">
                        Secure registration for MarketBridge Administrative Personnel
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-mono">
                            [ERROR]: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName" className="text-xs text-slate-400 uppercase font-bold tracking-widest">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="displayName"
                                        name="displayName"
                                        type="text"
                                        className="bg-slate-950 border-slate-800 pl-10 focus:ring-primary"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Admin Name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-xs text-slate-400 uppercase font-bold tracking-widest">Department</Label>
                                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 focus:ring-primary">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="admin">Global Admin</SelectItem>
                                        <SelectItem value="technical_admin">Technical Dept</SelectItem>
                                        <SelectItem value="operations_admin">Operations Dept</SelectItem>
                                        <SelectItem value="marketing_admin">Marketing Dept</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs text-slate-400 uppercase font-bold tracking-widest">Admin Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="bg-slate-950 border-slate-800 pl-10 focus:ring-primary"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="admin@marketbridge.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminCode" className="text-xs text-slate-400 uppercase font-bold tracking-widest text-orange-400">Verification Code</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-500/50" />
                                <Input
                                    id="adminCode"
                                    name="adminCode"
                                    type="text"
                                    className="bg-slate-950 border-orange-500/20 pl-10 focus:ring-orange-500 font-mono text-orange-400"
                                    value={formData.adminCode}
                                    onChange={handleChange}
                                    required
                                    placeholder="MB-XXXX-XXXX"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" title="Password" className="text-xs text-slate-400 uppercase font-bold tracking-widest">Passphrase</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="bg-slate-950 border-slate-800 focus:ring-primary"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" title="Confirm Password" className="text-xs text-slate-400 uppercase font-bold tracking-widest">Confirm</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="bg-slate-950 border-slate-800 focus:ring-primary"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12" disabled={isLoading}>
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

                <CardFooter className="bg-slate-950/50 border-t border-slate-800 p-6 flex flex-col gap-4">
                    <p className="text-center text-xs text-slate-500">
                        Authorized personnel only. All access attempts are logged.
                    </p>
                    <div className="flex justify-center gap-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                        <Link href="/admin/login" className="hover:text-primary transition-colors underline">Existing Login</Link>
                        <Link href="/" className="hover:text-slate-400 transition-colors">Return to Terminal</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
