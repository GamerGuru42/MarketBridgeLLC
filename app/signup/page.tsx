'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import { SubscriptionPlan } from '@/types/user';
import { CATEGORIES } from '@/lib/categories';

const PRICING_PLANS = [
    {
        id: 'starter' as SubscriptionPlan,
        name: 'Starter',
        price: 'Free',
        description: 'Perfect for getting started',
        features: [
            'Up to 5 active listings',
            'Basic analytics',
            'Standard support',
            '5% transaction fee',
            '14-day trial'
        ]
    },
    {
        id: 'professional' as SubscriptionPlan,
        name: 'Professional',
        price: '₦5,000',
        period: '/month',
        description: 'For growing businesses',
        popular: true,
        features: [
            'Up to 50 active listings',
            'Advanced analytics',
            'Priority support',
            'Verified Dealer Badge',
            '2.5% transaction fee'
        ]
    },
    {
        id: 'enterprise' as SubscriptionPlan,
        name: 'Enterprise',
        price: '₦20,000',
        period: '/month',
        description: 'For large scale operations',
        features: [
            'Unlimited listings',
            'Custom analytics reports',
            'Dedicated account manager',
            'API access',
            '1% transaction fee'
        ]
    }
];

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'role' | 'plan' | 'details'>('role');
    const [role, setRole] = useState<'customer' | 'dealer'>('customer');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter');
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
        businessName: '',
        storeType: 'physical' as 'physical' | 'online' | 'both',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationDocs, setVerificationDocs] = useState<string[]>([]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (signInError) throw signInError;
        } catch (err: any) {
            console.error(err);
            setError('Failed to sign in with Google');
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setVerificationDocs(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRoleSelect = (selectedRole: 'customer' | 'dealer') => {
        setRole(selectedRole);
        if (selectedRole === 'dealer') {
            setStep('plan');
        } else {
            setStep('details');
        }
    };

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setStep('details');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            // Sign up with Supabase Auth
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
                // Wait a moment for the trigger to create the basic user record
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Update user profile with additional details using upsert
                const { error: profileError } = await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: formData.email,
                        display_name: formData.displayName,
                        role: role,
                        location: formData.location,
                        business_name: role === 'dealer' ? formData.businessName : null,
                        store_type: role === 'dealer' ? formData.storeType : null,
                        subscription_plan: role === 'dealer' ? selectedPlan : 'starter',
                        subscription_status: role === 'dealer' ? 'trial' : 'inactive',
                        is_verified: false,
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) throw profileError;

                // Redirect based on role
                if (role === 'dealer') {
                    router.push('/vendor/dashboard');
                } else {
                    router.push('/');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
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

    // Step 1: Role Selection
    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Join MarketBridge</CardTitle>
                        <CardDescription className="text-center">
                            Choose how you want to use MarketBridge
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Sign up with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or select your role
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card
                                className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                                onClick={() => handleRoleSelect('customer')}
                            >
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl mb-3">🛍️</div>
                                    <h3 className="font-semibold text-lg mb-2">Customer</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Browse and purchase products from verified dealers
                                    </p>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                                onClick={() => handleRoleSelect('dealer')}
                            >
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl mb-3">🏪</div>
                                    <h3 className="font-semibold text-lg mb-2">Dealer</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Sell your products and grow your business
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Log in
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Step 2: Plan Selection (Dealers only)
    if (step === 'plan') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
                <div className="w-full max-w-6xl">
                    <div className="text-center mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('role')}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
                        <p className="text-muted-foreground">
                            All plans include a 14-day free trial. Cancel anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PRICING_PLANS.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.id ? 'border-primary shadow-md' : ''
                                    } ${plan.popular ? 'border-primary' : ''} relative`}
                                onClick={() => handlePlanSelect(plan.id)}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                        POPULAR
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-6">
                                        <span className="text-3xl font-bold">{plan.price}</span>
                                        {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                                    </div>
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Button
                            size="lg"
                            onClick={() => setStep('details')}
                            disabled={!selectedPlan}
                        >
                            Continue with {PRICING_PLANS.find(p => p.id === selectedPlan)?.name}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Details Form
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1">
                    <Button
                        variant="ghost"
                        onClick={() => setStep(role === 'dealer' ? 'plan' : 'role')}
                        className="w-fit mb-2"
                        type="button"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                    <CardDescription>
                        {role === 'dealer'
                            ? `${PRICING_PLANS.find(p => p.id === selectedPlan)?.name} Plan - 14-day free trial`
                            : 'Fill in your details to get started'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Full Name</Label>
                            <Input
                                id="displayName"
                                name="displayName"
                                type="text"
                                value={formData.displayName}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="your.email@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                type="text"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Lagos, Nigeria"
                            />
                        </div>

                        {role === 'dealer' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Primary Niche</Label>
                                    <Select
                                        value={CATEGORIES.find(c => c.isActive)?.name || ''}
                                        disabled
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your niche" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.name}
                                                    disabled={!category.isActive}
                                                >
                                                    {category.name} {!category.isActive && '(Coming Soon)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        We are currently onboarding <strong>{CATEGORIES.find(c => c.isActive)?.name}</strong> dealers only.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name</Label>
                                    <Input
                                        id="businessName"
                                        name="businessName"
                                        type="text"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your business name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="storeType">Store Type</Label>
                                    <Select
                                        value={formData.storeType}
                                        onValueChange={(value: 'physical' | 'online' | 'both') =>
                                            setFormData(prev => ({ ...prev, storeType: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select store type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="physical">Physical Store</SelectItem>
                                            <SelectItem value="online">Online Store</SelectItem>
                                            <SelectItem value="both">Both</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="documents">Verification Documents (NIN, CAC, ID)</Label>
                                    <Input
                                        id="documents"
                                        name="documents"
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                    />
                                    {verificationDocs.length > 0 && (
                                        <p className="text-xs text-green-600">{verificationDocs.length} document(s) selected</p>
                                    )}
                                </div>

                                <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
                                    <p><strong>Note:</strong> Dealer accounts require verification which may take up to 24 hours. Your 14-day free trial starts after verification.</p>
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Log in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
