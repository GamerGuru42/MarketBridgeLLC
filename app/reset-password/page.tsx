'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    React.useEffect(() => {
        const checkSession = async () => {
            console.log('VALIDATING RECOVERY SESSION...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error('Session check error:', sessionError);
            }
            if (!session) {
                console.warn('No active recovery session detected.');
                setError('Invalid or expired reset link. Please request a new one.');
            } else {
                console.log('Recovery session active for UID:', session.user.id);
            }
            setIsCheckingSession(false);
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('INITIATING PASSWORD UPDATE...');
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                console.error('Update request failed:', error);
                throw error;
            }

            console.log('Password update committed successfully.');
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: unknown) {
            console.error('Update exception:', err);
            const messageText = err instanceof Error ? err.message : 'Failed to update password - server rejected request';
            setError(messageText);
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
                <Card className="w-full max-w-md border-green-500/20 bg-green-500/5">
                    <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 mb-2">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-green-700">Password Updated</CardTitle>
                        <CardDescription className="text-green-600 font-medium">
                            Your password has been successfully reset. Redirecting you to login...
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <Lock className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                    <CardDescription>
                        Please enter a secure new password for your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="space-y-4">
                            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                                {error}
                            </div>
                            {error.includes('expired') && (
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/forgot-password">Request New Link</Link>
                                </Button>
                            )}
                        </div>
                    )}
                    {!error.includes('expired') && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-12"
                                    placeholder="••••••••"
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 text-base font-bold mt-2" disabled={isLoading}>
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
