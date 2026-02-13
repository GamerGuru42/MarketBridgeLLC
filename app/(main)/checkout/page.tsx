'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Zap, Loader2, ArrowLeft, Building2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const supabase = createClient();

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, total, clearCart } = useCart();

    const [actionLoading, setActionLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [paymentRef, setPaymentRef] = useState('');
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);

    // Bank Details State (Default: Moniepoint)
    const [bankDetails, setBankDetails] = useState({
        account_number: '9022858358',
        bank_name: 'Moniepoint MFB',
        account_name: 'MarketBridge Escrow'
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (!authLoading && items.length === 0) {
            router.push('/cart');
        }
    }, [user, authLoading, items, router]);

    // Fetch dynamic bank settings
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'bank_details')
                .single();

            if (data?.value) {
                setBankDetails(data.value);
            }
        };
        fetchSettings();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            setProofUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading receipt:', error);
            alert('Failed to upload receipt. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!user || items.length === 0) return;
        if (!paymentRef || !proofUrl || !agreed) {
            alert('Please complete all payment verification steps.');
            return;
        }

        setActionLoading(true);

        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    items: items.map(item => ({
                        listingId: item.listingId,
                        quantity: item.quantity,
                        price: item.price,
                        dealerId: item.dealerId
                    })),
                    totalAmount: total,
                    proofUrl,
                    paymentRef
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Order creation failed');
            }

            const data = await response.json();

            clearCart();
            alert('Order placed successfully! Pending admin verification.');
            router.push(`/orders?new=${data.orderId}`);

        } catch (err: any) {
            console.error('Checkout error:', err);
            alert(err.message || 'Failed to place order. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (authLoading || (items.length === 0 && !authLoading)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6600]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FF6600] selection:text-black pt-32 pb-20">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container relative z-10 max-w-6xl mx-auto px-6">
                <div className="text-center space-y-6 mb-16">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6600] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading leading-tight">Secure Handshake Protocol</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Order <span className="text-[#FF6600]">Verification</span>
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-2xl mx-auto italic lowercase leading-relaxed">
                        To guarantee 0% transaction fees, please transfer the exact amount directly to our secure escrow account.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Bank Details & Upload Form */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="glass-card rounded-[3rem] p-10 border-white/5 space-y-10">

                            {/* Bank Details Card */}
                            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Building2 className="h-32 w-32 text-white" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#FF6600]">MarketBridge Escrow Account</h3>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black tracking-tighter text-white">{bankDetails.account_number}</p>
                                        <p className="text-sm font-bold text-zinc-400">{bankDetails.bank_name}</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] font-mono text-zinc-500 uppercase">Account Name</p>
                                        <p className="text-sm font-bold text-white">{bankDetails.account_name}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            {/* Verification Form */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black uppercase tracking-tight font-heading italic">Proof of Payment</h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ref" className="text-xs uppercase font-bold text-zinc-500">Transaction Reference / Sender Name</Label>
                                        <Input
                                            id="ref"
                                            value={paymentRef}
                                            onChange={(e) => setPaymentRef(e.target.value)}
                                            placeholder="e.g. Ref: 123456789 or John Doe"
                                            className="bg-black border-white/10 h-12 text-white focus:border-[#FF6600]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-zinc-500">Upload Receipt (Screenshot)</Label>
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#FF6600]/50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={uploading}
                                            />
                                            {uploading ? (
                                                <Loader2 className="h-8 w-8 text-[#FF6600] animate-spin mx-auto" />
                                            ) : proofUrl ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                                    <p className="text-xs font-bold text-green-500">Receipt Uploaded</p>
                                                    <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] underline text-zinc-500 z-10 relative">View</a>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                    <UploadCloud className="h-8 w-8" />
                                                    <p className="text-xs font-bold">Click to upload screenshot</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <div
                                            className={cn(
                                                "h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                                agreed ? "bg-[#FF6600] border-[#FF6600]" : "border-zinc-700 hover:border-zinc-500"
                                            )}
                                            onClick={() => setAgreed(!agreed)}
                                        >
                                            {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                                        </div>
                                        <p className="text-xs text-zinc-500 cursor-pointer select-none" onClick={() => setAgreed(!agreed)}>
                                            I confirm I have transferred <span className="text-white font-bold">₦{total.toLocaleString()}</span> to the account above.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-8">
                            <Button variant="ghost" onClick={() => router.back()} className="text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                            </Button>
                        </div>
                    </div>

                    {/* Summary & Execution */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="glass-card rounded-[3rem] p-10 border-[#FF6600]/20 bg-gradient-to-br from-[#FF6600]/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldCheck className="h-40 w-40 text-[#FF6600]" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter font-heading italic">Order Summary</h3>
                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Manual Verification Node</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-zinc-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-heading">Subtotal</span>
                                        <span className="text-sm font-bold">₦{total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-heading">Fees (0%)</span>
                                        <span className="text-sm font-black text-[#00FF85] uppercase tracking-tighter italic">WAIVED</span>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="flex flex-col space-y-2">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-heading">Total To Send</span>
                                        <span className="text-5xl font-black text-[#FF6600] tracking-tighter italic font-heading">₦{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        onClick={handleConfirmPayment}
                                        disabled={actionLoading || uploading || !proofUrl || !paymentRef || !agreed}
                                        className="w-full h-20 bg-[#FF6600] text-black hover:bg-[#FFD700] rounded-2xl font-black uppercase tracking-[0.2em] transition-all font-heading shadow-[0_15px_45px_rgba(255,184,0,0.3)] border-none relative group scale-100 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <>
                                                Verify & Place Order
                                                <Zap className="ml-3 h-4 w-4 fill-black group-hover:scale-125 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-6 italic">
                                        Your order will be processed once payment is confirmed by Admin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items Preview (Compact) */}
                        <div className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Items ({items.length})</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {items.map(item => (
                                    <div key={item.listingId} className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                                            {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-white truncate">{item.title}</p>
                                            <p className="text-[9px] text-zinc-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-xs font-bold text-[#FF6600]">₦{item.price.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-[1px] w-full", className)} />
);
