'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeIdentifier } from '@/lib/auth/utils';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('INITIATING PASSWORD RECOVERY...');
        setIsLoading(true);
        setMessage(null);

        try {
            const emailToUse = normalizeIdentifier(email);
            console.log('Recovery target:', emailToUse);

            const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                console.error('Reset request failed:', error);
                throw error;
            }

            console.log('Recovery link dispatched successfully.');
            setMessage({
                type: 'success',
                text: 'Password reset link sent! If the email or phone number is associated with an account, you will receive a link to set a new password.'
            });
        } catch (err: any) {
            console.error('Recovery exception:', err);
            setMessage({
                type: 'error',
                text: err.message || 'Failed to send reset link - check connectivity.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Button variant="ghost" asChild className="w-fit mb-4 -ml-2">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                        </Link>
                    </Button>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        No worries, we'll send you reset instructions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {message && (
                        <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600'
                            : 'bg-destructive/10 border border-destructive/20 text-destructive'
                            }`}>
                            {message.type === 'success' ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <Mail className="h-5 w-5 shrink-0" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    {!message || message.type !== 'success' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email or Phone Number</Label>
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="your@email.com or 080..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12"
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Dealers: Use the email or phone number you registered with.
                                </p>
                            </div>
                            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <Button asChild className="w-full h-12 text-base font-bold">
                            <Link href="/login">Return to Login</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
