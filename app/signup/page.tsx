'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, ArrowLeft, ShieldCheck, Mail, Phone, User as UserIcon, CreditCard, Globe, ShoppingCart } from 'lucide-react';
import { SubscriptionPlan } from '@/types/user';
import { CATEGORIES } from '@/lib/categories';
import { useFlutterwave, getFlutterwaveConfig } from '@/lib/flutterwave';
import { initiateOPayCheckout } from '@/lib/opay';
import { NIGERIAN_STATES } from '@/lib/constants';

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
    const { initializePayment: initFlutterwave } = useFlutterwave();

    // State Definitions
    const [step, setStep] = useState<'role' | 'plan' | 'details' | 'auth-method' | 'phone-signup'>('role');
    const [role, setRole] = useState<'customer' | 'dealer' | 'admin' | 'ceo'>('customer');
    const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [targetRole, setTargetRole] = useState<'admin' | 'ceo' | null>(null);

    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter');
    const [paymentProvider, setPaymentProvider] = useState<'card' | 'transfer' | 'opay'>('card');
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
        businessName: '',
        storeType: 'physical' as 'physical' | 'online' | 'both',
        phoneNumber: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationDocs, setVerificationDocs] = useState<string[]>([]);

    // Helper Functions
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleRoleSelect = (selectedRole: 'customer' | 'dealer' | 'admin' | 'ceo') => {
        if (selectedRole === 'admin' || selectedRole === 'ceo') {
            setTargetRole(selectedRole);
            setAccessCode('');
            setError('');
            setShowAccessCodeInput(true);
            return;
        }

        setRole(selectedRole);
        if (selectedRole === 'dealer') {
            setStep('plan');
        } else if (selectedRole === 'customer') {
            setStep('auth-method');
        } else {
            setStep('details');
        }
    };

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setStep('details');
    };

    const verifyAccessCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (targetRole === 'admin') {
            if (accessCode === '1029384756') {
                router.push('/admin/signup');
            } else {
                setError('Invalid Administrator Access Code');
            }
        } else if (targetRole === 'ceo') {
            if (accessCode === '244466666') {
                router.push('/ceo/signup');
            } else {
                setError('Invalid Executive Access Code');
            }
        }
    };

    const createAccount = async (paymentRef?: string) => {
        try {
            let emailToUse = formData.email;
            if (step === 'phone-signup') {
                const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
                if (!cleanPhone) throw new Error("Phone number required");
                if (cleanPhone.length < 11) throw new Error("Please enter a valid phone number");
                emailToUse = `phone-${cleanPhone}@marketbridge.local`;
            }

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: emailToUse,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        role: role,
                        phone_number: formData.phoneNumber
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (authData.user) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                const planDetails = PRICING_PLANS.find(p => p.id === selectedPlan);
                const isPaidPlan = selectedPlan !== 'starter';

                const { error: profileError } = await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: emailToUse,
                        display_name: formData.displayName,
                        role: role,
                        location: formData.location,
                        phone_number: formData.phoneNumber,
                        business_name: role === 'dealer' ? formData.businessName : null,
                        store_type: role === 'dealer' ? formData.storeType : null,
                        subscription_plan: role === 'dealer' ? selectedPlan : 'starter',
                        subscription_status: role === 'dealer' ? (isPaidPlan ? (paymentRef === 'pending' ? 'pending_payment' : 'active') : 'trial') : 'inactive',
                        is_verified: false,
                        listing_limit: planDetails?.id === 'enterprise' ? 9999 : (planDetails?.id === 'professional' ? 50 : 5),
                        last_payment_ref: paymentRef || null
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) throw profileError;

                if (role === 'dealer') {
                    router.push('/vendor/dashboard');
                } else {
                    router.push('/');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
            setIsLoading(false);
        }
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

        // Handle Dealer Subscription Payment
        if (role === 'dealer' && selectedPlan !== 'starter') {
            const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
            if (plan) {
                const amount = parseInt(plan.price.replace(/[^0-9]/g, ''));
                const txRef = `SUB-${Date.now()}-${formData.email.slice(0, 3)}`;

                const onSuccess = (response: any) => {
                    // Update user status to active if payment successful in browser
                    createAccount(response.tx_ref || response.reference);
                };

                const onCancel = () => {
                    setIsLoading(false);
                };

                try {
                    // 1. Create the account first in pending state
                    await createAccount('pending');

                    // 2. Initiate payment
                    if (paymentProvider === 'opay') {
                        const res = await initiateOPayCheckout({
                            amount,
                            email: formData.email,
                            reference: txRef,
                            description: `Dealer Subscription: ${plan.name} Plan`
                        });
                        if (!res.success) {
                            alert(res.message);
                            setIsLoading(false);
                        }
                    } else {
                        const flwOptions = paymentProvider === 'card' ? 'card' : 'banktransfer';
                        const config = getFlutterwaveConfig(
                            txRef,
                            amount,
                            formData.email,
                            formData.displayName,
                            formData.phoneNumber || '08000000000',
                            onSuccess,
                            onCancel,
                            flwOptions
                        );
                        initFlutterwave(config);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to initialize signup');
                    setIsLoading(false);
                }
                return;
            }
        }

        await createAccount();
    };

    // Render Logic

    if (showAccessCodeInput) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950">
                <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl font-bold uppercase tracking-widest">Security Check</CardTitle>
                        <CardDescription className="text-slate-400">Enter restricted access code for {targetRole}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && <div className="text-red-400 text-xs font-mono text-center">{error}</div>}
                        <form onSubmit={verifyAccessCode} className="space-y-6">
                            <Input
                                type="password"
                                className="bg-slate-950 border-slate-800 text-center tracking-[0.5em] font-mono text-lg"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Button type="button" variant="ghost" onClick={() => setShowAccessCodeInput(false)}>Cancel</Button>
                                <Button type="submit">Verify</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'role') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
                <Card className="w-full max-w-4xl">
                    <CardHeader className="text-center mb-8">
                        <CardTitle className="text-4xl font-black italic uppercase tracking-tighter">Join MarketBridge</CardTitle>
                        <CardDescription>Select your account type to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="group cursor-pointer hover:border-primary transition-all p-6 text-center" onClick={() => handleRoleSelect('customer')}>
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛍️</div>
                            <h3 className="font-bold uppercase text-xs mb-2">Customer</h3>
                            <p className="text-[10px] text-muted-foreground">Buy premium vehicles</p>
                        </Card>
                        <Card className="group cursor-pointer hover:border-primary transition-all p-6 text-center" onClick={() => handleRoleSelect('dealer')}>
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚗</div>
                            <h3 className="font-bold uppercase text-xs mb-2">Dealer</h3>
                            <p className="text-[10px] text-muted-foreground">Sell your inventory</p>
                        </Card>
                        <Card className="group cursor-pointer hover:border-blue-500 transition-all p-6 text-center" onClick={() => handleRoleSelect('admin')}>
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
                            <h3 className="font-bold uppercase text-xs mb-2">Admin</h3>
                            <p className="text-[10px] text-muted-foreground">Staff management</p>
                        </Card>
                        <Card className="group cursor-pointer hover:border-amber-500 transition-all p-6 text-center" onClick={() => handleRoleSelect('ceo')}>
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👑</div>
                            <h3 className="font-bold uppercase text-xs mb-2">CEO</h3>
                            <p className="text-[10px] text-muted-foreground">Executive oversight</p>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const FormContainer = ({ title, description, children, onBack }: any) => (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <Button variant="ghost" onClick={onBack} className="w-fit mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">{error}</div>}
                    {children}
                </CardContent>
            </Card>
        </div>
    );

    if (step === 'auth-method') {
        return (
            <FormContainer title="Welcome Customer" description="Choose your signup method" onBack={() => setStep('role')}>
                <Button variant="outline" className="w-full h-12" onClick={handleGoogleLogin} disabled={isLoading}>
                    <Mail className="mr-2 h-5 w-5" /> Continue with Google
                </Button>
                <div className="relative text-center text-xs uppercase text-muted-foreground my-4"><span className="bg-background px-2">Or</span></div>
                <Button variant="outline" className="w-full h-12" onClick={() => setStep('phone-signup')}><Phone className="mr-2 h-5 w-5" /> Continue with Phone</Button>
                <Button className="w-full h-12 mt-4" onClick={() => setStep('details')}><UserIcon className="mr-2 h-5 w-5" /> Continue with Email</Button>
            </FormContainer>
        );
    }

    if (step === 'plan') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
                <div className="w-full max-w-6xl">
                    <div className="text-center mb-8">
                        <Button variant="ghost" onClick={() => setStep('role')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <h1 className="text-3xl font-bold font-sans uppercase tracking-widest italic">Choose Your Dealer Plan</h1>
                        <p className="text-muted-foreground">Select a plan to start your 14-day free trial</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PRICING_PLANS.map(plan => (
                            <Card key={plan.id} className={`cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-primary ring-2 ring-primary/20' : ''}`} onClick={() => handlePlanSelect(plan.id)}>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                    <div className="text-3xl font-black text-primary">{plan.price} <span className="text-xs font-normal text-muted-foreground">{plan.period}</span></div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-3 mb-6">
                                        {plan.features.map((f, i) => <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {f}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <FormContainer
            title={step === 'phone-signup' ? "Sign up with Phone" : "Complete Your Profile"}
            description={role === 'dealer' ? `Onboarding ${selectedPlan} Plan` : "Fill in your details"}
            onBack={() => setStep(role === 'dealer' ? 'plan' : 'auth-method')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="John Doe" />
                </div>
                {step === 'phone-signup' ? (
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder="08012345678" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input name="password" type="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Confirm</Label>
                        <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Location (State)</Label>
                    <select
                        name="location"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.location}
                        onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
                        required
                    >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
                {role === 'dealer' && (
                    <>
                        <div className="space-y-2">
                            <Label>Business Name</Label>
                            <Input name="businessName" value={formData.businessName} onChange={handleChange} required placeholder="Elite Motors Abuja" />
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border-2 border-dashed border-primary/20 text-center mt-4">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Subscription Payment Method</p>
                            <div className="flex justify-center flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentProvider('card')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${paymentProvider === 'card' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-background border-muted text-muted-foreground hover:border-primary/50'}`}
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentProvider('transfer')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${paymentProvider === 'transfer' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-background border-muted text-muted-foreground hover:border-primary/50'}`}
                                >
                                    <Globe className="h-4 w-4" />
                                    Transfer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentProvider('opay')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${paymentProvider === 'opay' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-background border-muted text-muted-foreground hover:border-primary/50'}`}
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    OPay
                                </button>
                            </div>
                        </div>
                    </>
                )}
                <Button type="submit" className="w-full h-12 text-lg font-bold mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (role === 'dealer' && selectedPlan !== 'starter' ? "Pay & Create Account" : "Create Account")}
                </Button>
            </form>
        </FormContainer>
    );
}
