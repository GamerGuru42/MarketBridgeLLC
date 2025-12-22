'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        displayName: '',
        location: '',
        photoURL: '',
        role: 'customer',
        businessName: '',
        storeType: 'online' as 'physical' | 'online' | 'both',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            // Pre-fill with existing data
            setFormData({
                displayName: user.displayName || user.email?.split('@')[0] || '',
                location: user.location || '',
                photoURL: user.photoURL || '',
                role: user.role || 'customer',
                businessName: user.businessName || '',
                storeType: (user.storeType as 'physical' | 'online' | 'both') || 'online',
            });
        }
    }, [user, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const updateData: any = {
                display_name: formData.displayName,
                location: formData.location,
                photo_url: formData.photoURL,
                role: formData.role,
            };

            if (formData.role === 'dealer') {
                updateData.business_name = formData.businessName;
                updateData.store_type = formData.storeType;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            await refreshUser();

            // Redirect based on role
            if (formData.role === 'dealer') {
                router.push('/dealer/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            alert(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                        <p className="text-muted-foreground">
                            Let's set up your account to get started
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Step 1: Basic Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-32">
                                            <Label className="mb-2 block text-center">Profile Photo</Label>
                                            <ImageUpload
                                                onImagesSelected={(urls) => setFormData({ ...formData, photoURL: urls[0] || '' })}
                                                defaultImages={formData.photoURL ? [formData.photoURL] : []}
                                                maxImages={1}
                                                bucketName="avatars"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="displayName">Display Name *</Label>
                                        <Input
                                            id="displayName"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            placeholder="Your name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., Lagos, Nigeria"
                                        />
                                    </div>

                                    <div>
                                        <Label>I want to *</Label>
                                        <RadioGroup
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                            className="mt-2"
                                        >
                                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                                                <RadioGroupItem value="customer" id="customer" />
                                                <Label htmlFor="customer" className="cursor-pointer flex-1">
                                                    <div className="font-medium">Buy Products</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Browse and purchase from verified dealers
                                                    </div>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                                                <RadioGroupItem value="dealer" id="dealer" />
                                                <Label htmlFor="dealer" className="cursor-pointer flex-1">
                                                    <div className="font-medium">Sell Products</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Create listings and manage your business
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {formData.role === 'dealer' && (
                                        <>
                                            <div>
                                                <Label htmlFor="businessName">Business Name *</Label>
                                                <Input
                                                    id="businessName"
                                                    value={formData.businessName}
                                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                    placeholder="Your business name"
                                                    required={formData.role === 'dealer'}
                                                />
                                            </div>

                                            <div>
                                                <Label>Store Type *</Label>
                                                <RadioGroup
                                                    value={formData.storeType}
                                                    onValueChange={(value: any) => setFormData({ ...formData, storeType: value })}
                                                    className="mt-2"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="physical" id="physical" />
                                                        <Label htmlFor="physical">Physical Store</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="online" id="online" />
                                                        <Label htmlFor="online">Online Shop</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="both" id="both" />
                                                        <Label htmlFor="both">Both</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </>
                                    )}

                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Complete Setup
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
