'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, User, Building, Shield, Bell, MapPin, Phone, Mail } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { NIGERIAN_STATES } from '@/lib/constants';

export default function SettingsPage() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const [updating, setUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        displayName: '',
        location: '',
        photoURL: '',
        phone_number: '',
        businessName: '',
        storeType: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                location: user.location || '',
                photoURL: user.photoURL || '',
                phone_number: user.phone_number || '',
                businessName: user.businessName || '',
                storeType: user.storeType || '',
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setUpdating(true);
        setSuccessMessage('');
        try {
            // Prepare update data
            const updateData: any = {
                display_name: formData.displayName,
                location: formData.location,
                photo_url: formData.photoURL,
                phone_number: formData.phone_number,
                updated_at: new Date().toISOString()
            };

            // Only add business fields for dealers to avoid DB constraint issues
            if (user.role === 'dealer') {
                updateData.business_name = formData.businessName;
                updateData.store_type = formData.storeType;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            await refreshUser();
            setSuccessMessage('Settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Update settings error:', err);
            alert(err.message || 'Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold">Please login to access settings</h1>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your profile, business details, and account preferences.
                    </p>
                </div>
                {successMessage && (
                    <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{successMessage}</span>
                    </div>
                )}
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 lg:w-auto w-full flex overflow-x-auto no-scrollbar">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    {user.role === 'dealer' && (
                        <TabsTrigger value="business" className="gap-2">
                            <Building className="h-4 w-4" />
                            Business
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Account & Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Update your public profile information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="space-y-4">
                                    <Label>Profile Picture</Label>
                                    <div className="w-32 h-32 relative">
                                        <ImageUpload
                                            onImagesSelected={(urls) => setFormData({ ...formData, photoURL: urls[0] || '' })}
                                            defaultImages={formData.photoURL ? [formData.photoURL] : []}
                                            maxImages={1}
                                            bucketName="avatars"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 grid gap-4 w-full">
                                    <div className="grid gap-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="displayName"
                                                className="pl-10"
                                                value={formData.displayName}
                                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                className="pl-10 bg-muted/50"
                                                value={user.email}
                                                disabled
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Email cannot be changed directly.</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    className="pl-10"
                                                    value={formData.phone_number}
                                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="location">Location (State)</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <select
                                                    id="location"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                >
                                                    <option value="">Select State</option>
                                                    {NIGERIAN_STATES.map((state: string) => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t items-center justify-end py-4">
                            <Button onClick={handleUpdateProfile} disabled={updating}>
                                {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Save Profile Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Business Tab */}
                {user.role === 'dealer' && (
                    <TabsContent value="business">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle>Business Details</CardTitle>
                                <CardDescription>
                                    Manage your dealership's public information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="businessName">Business Name</Label>
                                    <Input
                                        id="businessName"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="storeType">Store Type</Label>
                                    <select
                                        id="storeType"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.storeType}
                                        onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                                    >
                                        <option value="online">Online Only</option>
                                        <option value="physical">Physical Store</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t items-center justify-end py-4">
                                <Button onClick={handleUpdateProfile} disabled={updating}>
                                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Save Business Details
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                )}

                {/* Security Tab */}
                <TabsContent value="security">
                    <div className="grid gap-6">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle>Account Status</CardTitle>
                                <CardDescription>
                                    Current role and verification level.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm font-medium">Account Type</span>
                                    <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold">
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm font-medium">Verification Status</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {user.isVerified ? 'Verified' : 'Pending Verification'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-sm border-destructive/20">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>
                                    Permanent actions for your account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">
                                    Deactivate Account
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Notifications Preferences</CardTitle>
                            <CardDescription>
                                Control how we contact you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Order Updates</Label>
                                    <p className="text-sm text-muted-foreground">Receive emails about your order status.</p>
                                </div>
                                <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">ALWAYS ON</div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between opacity-50">
                                <div className="space-y-0.5">
                                    <Label>Marketing Emails</Label>
                                    <p className="text-sm text-muted-foreground">Weekly newsletters and offers.</p>
                                </div>
                                <div className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-bold rounded">DISABLED</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Separator() {
    return <div className="h-px w-full bg-border/50" />;
}
