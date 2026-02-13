'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, User, Building, Shield, Bell, MapPin, Phone, Mail, Banknote, Landmark } from 'lucide-react';
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

    const [bankData, setBankData] = useState({
        bankName: '',
        accountNumber: '',
        accountName: ''
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

            // Fetch payout details
            const fetchBankDetails = async () => {
                const { data } = await supabase
                    .from('users')
                    .select('bank_name, account_number, account_name')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setBankData({
                        bankName: data.bank_name || '',
                        accountNumber: data.account_number || '',
                        accountName: data.account_name || ''
                    });
                }
            };
            fetchBankDetails();
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setUpdating(true);
        setSuccessMessage('');
        try {
            // Prepare update data
            const updateData: Record<string, string | null> = {
                display_name: formData.displayName,
                location: formData.location,
                photo_url: formData.photoURL,
                phone_number: formData.phone_number,
                updated_at: new Date().toISOString()
            };

            // Only add business fields for dealers to avoid DB constraint issues
            if (['dealer', 'student_seller'].includes(user.role)) {
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
        } catch (err: unknown) {
            console.error('Update settings error:', err);
            const message = err instanceof Error ? err.message : 'Failed to update settings';
            alert(message);
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setUpdating(true);
        setSuccessMessage('');
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    bank_name: bankData.bankName,
                    account_number: bankData.accountNumber,
                    account_name: bankData.accountName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            setSuccessMessage('Payout details updated!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Update bank error:', err);
            alert(err.message || 'Failed to update payout details');
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
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Background Grid Accent */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#FF6600]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
                <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#FF6600] mb-2">
                            <Shield className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                            Profile <span className="text-[#FF6600]">Command</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 font-medium">
                            Operational status: {user.isVerified ? 'Verified Hub' : 'Pending Sync'}
                        </p>
                    </div>
                    {successMessage && (
                        <div className="bg-[#00FF85]/10 border border-[#00FF85]/20 text-[#00FF85] px-6 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-widest">{successMessage}</span>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="profile" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/10 p-1 lg:w-auto w-full flex overflow-x-auto no-scrollbar rounded-2xl h-14">
                        <TabsTrigger value="profile" className="gap-2 px-6 rounded-xl data-[state=active]:bg-[#FF6600] data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                            <User className="h-3.5 w-3.5" />
                            Identity
                        </TabsTrigger>
                        {['dealer', 'student_seller'].includes(user.role) && (
                            <>
                                <TabsTrigger value="business" className="gap-2 px-6 rounded-xl data-[state=active]:bg-[#FF6600] data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                                    <Building className="h-3.5 w-3.5" />
                                    Business
                                </TabsTrigger>
                                <TabsTrigger value="financials" className="gap-2 px-6 rounded-xl data-[state=active]:bg-[#FF6600] data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                                    <Banknote className="h-3.5 w-3.5" />
                                    Payouts
                                </TabsTrigger>
                            </>
                        )}
                        <TabsTrigger value="security" className="gap-2 px-6 rounded-xl data-[state=active]:bg-[#FF6600] data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                            <Shield className="h-3.5 w-3.5" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2 px-6 rounded-xl data-[state=active]:bg-[#FF6600] data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                            <Bell className="h-3.5 w-3.5" />
                            Comms
                        </TabsTrigger>
                    </TabsList>

                    {/* Identity Tab (Standard) */}
                    <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="glass-card border-white/10 rounded-[2rem] overflow-hidden bg-white/5">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Identity Parameters</CardTitle>
                                <CardDescription className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest">Update your public network signature</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex flex-col md:flex-row gap-12 items-start">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Avatar Port</Label>
                                        <div className="w-40 h-40 relative group">
                                            <div className="absolute inset-0 bg-gold-gradient rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative h-full w-full rounded-3xl overflow-hidden border border-white/10 bg-black">
                                                <ImageUpload
                                                    onImagesSelected={(urls) => setFormData({ ...formData, photoURL: urls[0] || '' })}
                                                    defaultImages={formData.photoURL ? [formData.photoURL] : []}
                                                    maxImages={1}
                                                    bucketName="avatars"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid gap-8 w-full">
                                        <div className="grid gap-3">
                                            <Label htmlFor="displayName" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Alias / Name</Label>
                                            <div className="relative group">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors" />
                                                <Input
                                                    id="displayName"
                                                    className="h-14 pl-14 bg-black border-white/10 rounded-2xl focus:ring-[#FF6600] focus:border-[#FF6600] font-bold text-white"
                                                    value={formData.displayName}
                                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="grid gap-3">
                                                <Label htmlFor="phone" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Comm Line</Label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors" />
                                                    <Input
                                                        id="phone"
                                                        className="h-14 pl-14 bg-black border-white/10 rounded-2xl focus:ring-[#FF6600] focus:border-[#FF6600] font-bold text-white"
                                                        value={formData.phone_number}
                                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-3">
                                                <Label htmlFor="location" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Operational Node</Label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors z-10" />
                                                    <select
                                                        id="location"
                                                        className="w-full h-14 pl-14 pr-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FF6600]/50 outline-none font-bold uppercase appearance-none"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    >
                                                        <option value="" className="bg-zinc-900">SELECT NODE</option>
                                                        {NIGERIAN_STATES.map((state: string) => (
                                                            <option key={state} value={state} className="bg-zinc-900">{state === 'FCT - Abuja' ? 'FCT (ABUJA) HUB' : state.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-white/5 border-t border-white/10 p-8 flex justify-end">
                                <Button onClick={handleUpdateProfile} disabled={updating} className="h-14 px-10 bg-[#FF6600] hover:bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-2xl border-none">
                                    {updating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-3 h-5 w-5" />}
                                    Sync Parameters
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Business Tab (Sellers Only) */}
                    {['dealer', 'student_seller'].includes(user.role) && (
                        <TabsContent value="business" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="glass-card border-white/10 rounded-[2rem] overflow-hidden bg-white/5">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Business Protocols</CardTitle>
                                    <CardDescription className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest">Configure your commercial sector presence</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="grid gap-3">
                                            <Label htmlFor="businessName" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Vessel / Brand Name</Label>
                                            <div className="relative group">
                                                <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors" />
                                                <Input
                                                    id="businessName"
                                                    className="h-14 pl-14 bg-black border-white/10 rounded-2xl focus:ring-[#FF6600] focus:border-[#FF6600] font-bold text-white"
                                                    value={formData.businessName}
                                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="storeType" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Terminal Class</Label>
                                            <select
                                                id="storeType"
                                                className="w-full h-14 px-6 bg-black border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-[#FF6600]/50 outline-none font-bold uppercase appearance-none"
                                                value={formData.storeType}
                                                onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                                            >
                                                <option value="online" className="bg-zinc-900">Digital Node</option>
                                                <option value="physical" className="bg-zinc-900">Physical Hub</option>
                                                <option value="both" className="bg-zinc-900">Hybrid Grid</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/10 p-8 flex justify-end">
                                    <Button onClick={handleUpdateProfile} disabled={updating} className="h-14 px-10 bg-[#FF6600] hover:bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-2xl border-none">
                                        {updating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-3 h-5 w-5" />}
                                        Sync Assets
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Financials / Payouts Tab (Sellers Only) */}
                    {['dealer', 'student_seller'].includes(user.role) && (
                        <TabsContent value="financials" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="glass-card border-white/10 rounded-[2rem] overflow-hidden bg-white/5">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Payout Matrix</CardTitle>
                                    <CardDescription className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest">Designated transfer coordinates for revenue</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="grid gap-3">
                                            <Label htmlFor="bankName" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Bank Name</Label>
                                            <div className="relative group">
                                                <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors" />
                                                <Input
                                                    id="bankName"
                                                    placeholder="e.g. GTBank, Kuda, Moniepoint"
                                                    className="h-14 pl-14 bg-black border-white/10 rounded-2xl focus:ring-[#FF6600] focus:border-[#FF6600] font-bold text-white"
                                                    value={bankData.bankName}
                                                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="accountNumber" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Account Number</Label>
                                            <div className="relative group">
                                                <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors" />
                                                <Input
                                                    id="accountNumber"
                                                    placeholder="10-digit NUBAN"
                                                    className="h-14 pl-14 bg-black border-white/10 rounded-2xl focus:ring-[#FF6600] focus:border-[#FF6600] font-bold text-white font-mono"
                                                    value={bankData.accountNumber}
                                                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="accountName" className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Account Name</Label>
                                        <div className="relative group">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-[#FF6600] transition-colors" />
                                            <Input
                                                id="accountName"
                                                placeholder="Matching Bank Account Name"
                                                className="h-14 pl-14 bg-black border-white/10 rounded-2xl focus:ring-[#FF6600] focus:border-[#FF6600] font-bold text-white"
                                                value={bankData.accountName}
                                                onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/10 p-8 flex justify-end">
                                    <Button onClick={handleUpdateBank} disabled={updating} className="h-14 px-10 bg-[#FF6600] hover:bg-[#FF6600] text-black font-black uppercase tracking-widest rounded-2xl border-none">
                                        {updating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-3 h-5 w-5" />}
                                        Save Credentials
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Security Tab */}
                    <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid gap-8">
                            <Card className="glass-card border-white/10 rounded-[2rem] overflow-hidden bg-white/5">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Security Clearances</CardTitle>
                                    <CardDescription className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest">Operational role and verification status</CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-2xl">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em]">Assigned Role</p>
                                            <p className="font-bold text-white uppercase tracking-wider">{user.role}</p>
                                        </div>
                                        <Shield className="h-6 w-6 text-[#FF6600] opacity-50" />
                                    </div>
                                    <div className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-2xl">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em]">Sync Status</p>
                                            <p className={`font-black uppercase tracking-wider ${user.isVerified ? 'text-[#00FF85]' : 'text-zinc-500'}`}>
                                                {user.isVerified ? 'Verified Hub' : 'Pending Verification'}
                                            </p>
                                        </div>
                                        <CheckCircle className={`h-6 w-6 ${user.isVerified ? 'text-[#00FF85]' : 'text-zinc-700'}`} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-red-500/20 rounded-[2rem] overflow-hidden bg-red-500/5">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight text-red-500">Self-Destruct</CardTitle>
                                    <CardDescription className="text-red-500/40 uppercase text-[9px] font-bold tracking-widest">Permanent account termination protocol</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase tracking-widest rounded-xl transition-all h-12">
                                        Terminate Account Session
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="glass-card border-white/10 rounded-[2rem] overflow-hidden bg-white/5">
                            <CardHeader className="p-8">
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Comms Frequency</CardTitle>
                                <CardDescription className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest">Transmission alert protocols</CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-4">
                                <div className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="font-bold text-white uppercase tracking-wider">Operational Intel</p>
                                        <p className="text-xs text-zinc-500 font-medium">Order status and hub updates</p>
                                    </div>
                                    <div className="px-3 py-1 bg-[#00FF85]/10 text-[#00FF85] text-[9px] font-black uppercase rounded-full border border-[#00FF85]/20 tracking-tighter">Essential</div>
                                </div>
                                <div className="border-t border-zinc-800 my-2" />
                                <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl opacity-40">
                                    <div className="space-y-1">
                                        <p className="font-bold text-zinc-500 uppercase tracking-wider">Sector Broadcasts</p>
                                        <p className="text-xs text-zinc-700 font-medium">Promotions and network news</p>
                                    </div>
                                    <div className="px-3 py-1 bg-zinc-800 text-zinc-600 text-[9px] font-black uppercase rounded-full border border-white/5 tracking-tighter">Inactive</div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
