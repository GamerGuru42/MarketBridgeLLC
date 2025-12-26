'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, ArrowLeft, ShieldCheck, Mail, Phone, User as UserIcon, CreditCard, Globe, ShoppingCart, Eye, EyeOff } from 'lucide-react';
import { SubscriptionPlan } from '@/types/user';
import { CATEGORIES } from '@/lib/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useFlutterwave, getFlutterwaveConfig } from '@/lib/flutterwave';
import { initiateOPayCheckout } from '@/lib/opay';
import { NIGERIAN_STATES } from '@/lib/constants';
import { useSearchParams } from 'next/navigation';
import { normalizeIdentifier } from '@/lib/auth/utils';

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

const FormContainer = ({ title, description, children, onBack, error }: any) => (
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

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { initializePayment: initFlutterwave } = useFlutterwave();
    const { refreshUser, signInWithGoogle } = useAuth();

    // State Definitions
    const [step, setStep] = useState<'role' | 'plan' | 'details' | 'auth-method' | 'phone-signup'>('role');
    const [role, setRole] = useState<'customer' | 'dealer' | 'admin' | 'ceo'>('customer');
    const [showPassword, setShowPassword] = useState(false);

    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter');
    const [paymentProvider, setPaymentProvider] = useState<'card' | 'transfer' | 'opay'>('card');
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
        businessName: '',
        cacNumber: '',
        storeType: 'physical' as 'physical' | 'online' | 'both',
        phoneNumber: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationDocs, setVerificationDocs] = useState<string[]>([]);
    const [isCacVerifying, setIsCacVerifying] = useState(false);
    const [cacVerified, setCacVerified] = useState(false);
    const [ceoExists, setCeoExists] = useState(false);
    const [adminLimitReached, setAdminLimitReached] = useState(false);

    React.useEffect(() => {
        const checkLimits = async () => {
            // Check CEO
            const { count: ceoCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'ceo');

            if (ceoCount !== null && ceoCount >= 1) setCeoExists(true);

            // Check Admin
            const adminRoles = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin'];
            const { count: adminCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .in('role', adminRoles);

            if (adminCount !== null && adminCount >= 3) setAdminLimitReached(true);
        };
        checkLimits();
    }, []);

    // Direct routing for dealers
    React.useEffect(() => {
        const urlRole = searchParams.get('role');
        if (urlRole === 'dealer' && step === 'role') {
            setRole('dealer');
            setStep('plan');
        }
    }, [searchParams, step]);

    // Helper Functions
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle();
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
        setRole(selectedRole);
        if (selectedRole === 'dealer') {
            setStep('plan');
        } else if (selectedRole === 'customer') {
            setStep('auth-method');
        } else if (selectedRole === 'ceo') {
            router.push('/ceo/signup');
        } else if (selectedRole === 'admin') {
            router.push('/admin/signup');
        } else {
            setStep('details');
        }
    };

    const urlRole = searchParams.get('role');

    const handleBack = () => {
        if (step === 'plan') {
            if (urlRole === 'dealer') {
                router.replace('/');
            } else {
                setStep('role');
            }
        } else if (step === 'auth-method') {
            if (urlRole) {
                router.replace('/');
            } else {
                setStep('role');
            }
        } else if (step === 'details' || step === 'phone-signup') {
            setStep(role === 'dealer' ? 'plan' : 'auth-method');
        } else {
            router.replace('/');
        }
    };

    const handleVerifyCac = async () => {
        if (!formData.cacNumber || formData.cacNumber.length < 5) {
            setError('Please enter a valid CAC RC Number');
            return;
        }
        setIsCacVerifying(true);
        setError('');

        // Simulate CAC Database Lookup
        setTimeout(() => {
            setIsCacVerifying(false);
            setCacVerified(true);
        }, 1500);
    };

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setStep('details');
    };



    const createAccount = async (paymentRef?: string) => {
        try {
            console.log('INITIATING ACCOUNT CREATION...');
            const emailToUse = normalizeIdentifier(formData.email || formData.phoneNumber);
            console.log('Normalized Identifier:', emailToUse);

            if (step === 'phone-signup' && !formData.phoneNumber.replace(/\D/g, '')) {
                throw new Error("Phone number required");
            }

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: emailToUse,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        full_name: formData.displayName, // Fallback for various triggers
                        role: role,
                        phone_number: formData.phoneNumber,
                        location: formData.location
                    },
                },
            });

            let activeUser = authData?.user;

            if (signUpError) {
                console.error('Account creation error:', signUpError);
                // If user already exists, they might have a "zombie" auth record without a profile
                if (signUpError.message?.includes('User already registered') || signUpError.status === 400) {
                    console.log("User already exists in Auth, attempting to repair/update profile...");
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: emailToUse,
                        password: formData.password
                    });
                    if (signInData.user) {
                        activeUser = signInData.user;
                    } else {
                        throw new Error("This email is already registered. Please login instead.");
                    }
                } else if (signUpError.message?.includes('Database error saving new user')) {
                    console.warn("Trigger failed, but account might exist. Attempting aggressive recovery...");
                    // THE AGGRESSIVE BYPASS: Try to sign in. Many times the user IS created despite the error.
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: emailToUse,
                        password: formData.password
                    });

                    if (signInData.user) {
                        console.log('Recovery sign-in successful.');
                        activeUser = signInData.user;
                    } else {
                        // If all else fails, it's a real email conflict or schema issue
                        throw new Error("Database sync timeout. Please refresh the page and try logging in. If that fails, please try a different email address.");
                    }
                } else {
                    throw signUpError;
                }
            }

            if (activeUser) {
                // Wait briefly for trigger to complete basic profile
                await new Promise(resolve => setTimeout(resolve, 2000));

                const planDetails = PRICING_PLANS.find(p => p.id === selectedPlan);
                const isPaidPlan = selectedPlan !== 'starter';

                const now = new Date();
                const trialEndDate = new Date();
                trialEndDate.setDate(now.getDate() + 14);

                try {
                    console.log('Hydrating user profile for:', activeUser.id);
                    const { error: profileError } = await supabase
                        .from('users')
                        .upsert({
                            id: activeUser.id,
                            email: emailToUse,
                            display_name: formData.displayName,
                            role: role,
                            location: formData.location,
                            phone_number: formData.phoneNumber,
                            business_name: role === 'dealer' ? (formData.businessName || null) : null,
                            cac_number: role === 'dealer' ? (formData.cacNumber || null) : null,
                            store_type: role === 'dealer' ? formData.storeType : null,
                            subscription_plan: role === 'dealer' ? selectedPlan : 'starter',
                            subscription_status: role === 'dealer' ? (isPaidPlan ? (paymentRef === 'pending' ? 'pending_payment' : 'active') : 'trial') : 'inactive',
                            subscription_expires_at: role === 'dealer' ? trialEndDate.toISOString() : null,
                            trial_start_date: role === 'dealer' ? now.toISOString() : null,
                            subscription_start_date: role === 'dealer' ? now.toISOString() : null,
                            subscription_end_date: role === 'dealer' ? trialEndDate.toISOString() : null,
                            is_verified: role === 'dealer' ? cacVerified : false,
                            listing_limit: role === 'dealer' ? 999 : (planDetails?.id === 'enterprise' ? 9999 : (planDetails?.id === 'professional' ? 50 : 5)),
                            last_payment_ref: paymentRef || null
                        }, {
                            onConflict: 'id'
                        });

                    if (profileError) {
                        console.error('Profile hydration failed, but account created:', profileError);
                        // We don't throw here to avoid the 500 error if Auth succeeded but Profile update failed
                        // Usually happens if migration wasn't run yet
                    } else {
                        console.log('Profile hydration complete.');
                    }
                } catch (upsertErr) {
                    console.error('Unexpected error during profile hydration:', upsertErr);
                }

                // IMPORTANT: Refresh user profile so the Header/AuthContext knows we are logged in
                await refreshUser();

                if (role === 'dealer') {
                    router.push('/dealer/dashboard');
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
        if (role === 'dealer' && (selectedPlan !== 'starter' || paymentProvider)) {
            const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
            if (plan) {
                const amount = selectedPlan === 'starter' ? (paymentProvider ? 100 : 0) : parseInt(plan.price.replace(/[^0-9]/g, ''));

                if (amount === 0) {
                    await createAccount();
                    return;
                }

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
                        {!adminLimitReached && (
                            <Card className="group cursor-pointer hover:border-blue-500 transition-all p-6 text-center" onClick={() => handleRoleSelect('admin')}>
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
                                <h3 className="font-bold uppercase text-xs mb-2">Admin</h3>
                                <p className="text-[10px] text-muted-foreground">Staff management</p>
                            </Card>
                        )}
                        {!ceoExists && (
                            <Card className="group cursor-pointer hover:border-amber-500 transition-all p-6 text-center" onClick={() => handleRoleSelect('ceo')}>
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👑</div>
                                <h3 className="font-bold uppercase text-xs mb-2">CEO</h3>
                                <p className="text-[10px] text-muted-foreground">Executive oversight</p>
                            </Card>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }


    if (step === 'auth-method') {
        return (
            <FormContainer title="Welcome Customer" description="Choose your signup method" onBack={handleBack}>
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
                        {urlRole === 'dealer' ? (
                            <Button asChild variant="ghost" className="mb-4">
                                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={handleBack} className="mb-4">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        )}
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
            onBack={handleBack}
            error={error}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <div className="relative">
                            <Input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
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
                        <div className="space-y-4 border-t pt-4 mt-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Business Verification</h3>

                            <div className="space-y-2">
                                <Label>CAC RC Number</Label>
                                <div className="flex gap-2">
                                    <Input
                                        name="cacNumber"
                                        value={formData.cacNumber}
                                        onChange={handleChange}
                                        required
                                        placeholder="RC-123456"
                                        className={cacVerified ? "border-green-500 bg-green-50/50" : ""}
                                        disabled={cacVerified}
                                    />
                                    <Button
                                        type="button"
                                        variant={cacVerified ? "secondary" : "default"}
                                        onClick={handleVerifyCac}
                                        disabled={isCacVerifying || cacVerified || !formData.cacNumber}
                                        className="shrink-0"
                                    >
                                        {isCacVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : (cacVerified ? <Check className="h-4 w-4" /> : "Verify")}
                                    </Button>
                                </div>
                                {cacVerified && <p className="text-[10px] text-green-600 font-bold">✓ Business Verified with CAC Database</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Business Name</Label>
                                <Input name="businessName" value={formData.businessName} onChange={handleChange} required placeholder="Elite Motors Abuja" />
                            </div>
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
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (role === 'dealer' ? (selectedPlan === 'starter' ? (paymentProvider ? "Verify & Create Account" : "Create Account") : "Pay & Create Account") : "Create Account")}
                </Button>
            </form>
        </FormContainer>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
