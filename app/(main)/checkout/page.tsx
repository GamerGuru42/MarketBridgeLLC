'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingBag, ShieldCheck, Zap, Globe, Cpu, Loader2, CreditCard, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getFlutterwaveConfig, useFlutterwave } from '@/lib/flutterwave';
import { initiateOPayCheckout } from '@/lib/opay';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, total, clearCart } = useCart();
    const { initializePayment: initFlutterwave } = useFlutterwave();

    const [actionLoading, setActionLoading] = useState(false);
    const [paymentProvider, setPaymentProvider] = useState<'card' | 'transfer' | 'opay'>('card');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (!authLoading && items.length === 0) {
            router.push('/cart');
        }
    }, [user, authLoading, items, router]);

    const handleConfirmPayment = async () => {
        if (!user || items.length === 0) return;

        setActionLoading(true);
        const txRef = `MB-CART-${Date.now()}-${user.id.slice(0, 5)}`;

        const onSuccess = async (response: any) => {
            try {
                // Verify transaction via API
                const verifyRes = await fetch('/api/verify-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transaction_id: response.transaction_id,
                        tx_ref: txRef,
                        is_cart: true,
                        items: items
                    })
                });

                if (!verifyRes.ok) throw new Error('Payment verification protocols failed.');

                clearCart();
                alert('Secure cart acquisition successful!');
                router.push('/orders');
            } catch (err: unknown) {
                console.error('Error verifying cart order:', err);
                alert('Payment detected but verification timed out. Support notified.');
            } finally {
                setActionLoading(false);
            }
        };

        const onCancel = () => {
            setActionLoading(false);
        };

        try {
            // For now, we simulate a single consolidated order or handle via backend
            // In a real flow, we might want to split orders per dealer

            if (paymentProvider === 'opay') {
                const res = await initiateOPayCheckout({
                    amount: total,
                    email: user.email,
                    reference: txRef,
                    description: `Escrow release for ${items.length} assets`
                });
                if (!res.success) {
                    alert(res.message);
                    setActionLoading(false);
                }
            } else {
                const flwOptions = paymentProvider === 'card' ? 'card' : 'banktransfer';
                const config = getFlutterwaveConfig(
                    txRef,
                    total,
                    user.email || '',
                    user.displayName || 'Student Operative',
                    user.phone_number || '08000000000',
                    onSuccess,
                    onCancel,
                    flwOptions
                );

                const started = await initFlutterwave(config);
                if (!started) {
                    alert('Gateway linkage failed.');
                    setActionLoading(false);
                }
            }
        } catch (err: unknown) {
            console.error('Checkout error:', err);
            alert('Acquisition protocol initialization failed.');
            setActionLoading(false);
        }
    };

    if (authLoading || (items.length === 0 && !authLoading)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#FFB800]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FFB800] selection:text-black pt-32 pb-20">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container relative z-10 max-w-6xl mx-auto px-6">
                <div className="text-center space-y-6 mb-16">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading leading-tight">Secure Handshake Protocol</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Finalize <span className="text-[#FFB800]">Escrow</span>
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-2xl mx-auto italic lowercase leading-relaxed">
                        Establishing <span className="text-white font-bold">Smart Escrow Mesh</span> for your staged assets.
                        Funds will be held securely until the physical verification handshake is completed on campus.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Items & Options */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="glass-card rounded-[3rem] p-10 border-white/5 space-y-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight font-heading italic mb-6">Staged Assets</h3>
                                <div className="space-y-4">
                                    {items.map(item => (
                                        <div key={item.listingId} className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="h-12 w-12 rounded-lg bg-zinc-900 overflow-hidden shrink-0">
                                                {item.image && <img src={item.image} className="w-full h-full object-cover opacity-50" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-0.5 truncate">{item.title}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Unit Acquisition Verified</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black italic tracking-tighter">₦{item.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight font-heading italic mb-6">Protocol Channel</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: 'card', label: 'Credit/Debit', icon: CreditCard, desc: 'Instant Clearance' },
                                        { id: 'transfer', label: 'Direct Wire', icon: Globe, desc: 'Lekki-Hub Route' },
                                        { id: 'opay', label: 'OPay App', icon: Wallet, desc: 'Mobile Linkage' }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentProvider(method.id as any)}
                                            className={cn(
                                                "p-6 rounded-3xl border transition-all text-left group",
                                                paymentProvider === method.id
                                                    ? "bg-[#FFB800] border-[#FFB800] text-black"
                                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
                                        >
                                            <method.icon className={cn("h-6 w-6 mb-4 transition-transform group-hover:scale-110", paymentProvider === method.id ? "text-black" : "text-[#FFB800]")} />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{method.label}</p>
                                            <p className={cn("text-[8px] font-bold uppercase italic", paymentProvider === method.id ? "text-black/60" : "text-zinc-500")}>{method.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-8">
                            <Button variant="ghost" onClick={() => router.back()} className="text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Modify Assets
                            </Button>
                        </div>
                    </div>

                    {/* Summary & Execution */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="glass-card rounded-[3rem] p-10 border-[#FFB800]/20 bg-gradient-to-br from-[#FFB800]/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldCheck className="h-40 w-40 text-[#FFB800]" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter font-heading italic">Acquisition Ledger</h3>
                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Node-to-Node Secure Mapping</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-zinc-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-heading">Asset Sum</span>
                                        <span className="text-sm font-bold">₦{total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-heading">Escrow Buffer</span>
                                        <span className="text-sm font-black text-[#00FF85] uppercase tracking-tighter italic">DIRECTED (₦0)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-heading">Campus Rating</span>
                                        <span className="text-sm font-black text-[#00FF85] uppercase tracking-tighter italic">A+ SECURE</span>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="flex flex-col space-y-2">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-heading">Total Authorization Request</span>
                                        <span className="text-5xl font-black text-[#FFB800] tracking-tighter italic font-heading">₦{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        onClick={handleConfirmPayment}
                                        disabled={actionLoading}
                                        className="w-full h-20 bg-[#FFB800] text-black hover:bg-[#FFD700] rounded-2xl font-black uppercase tracking-[0.2em] transition-all font-heading shadow-[0_15px_45px_rgba(255,184,0,0.3)] border-none relative group scale-100 hover:scale-[1.02]"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <>
                                                Initialize Handshake
                                                <Zap className="ml-3 h-4 w-4 fill-black group-hover:scale-125 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-6 italic">
                                        By initializing, you authorize the Smart Escrow Mesh to hold funds under NDPA 2023 compliance.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="glass-card p-6 rounded-3xl border-white/5 flex items-center gap-6">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none mb-1">Handshake Protection</p>
                                <p className="text-[8px] font-bold text-zinc-600 uppercase">Funds only released after physical verification</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em] font-heading italic">MarketBridge Handshake v2.1 // Authorized Nodes Only</p>
                </div>
            </div>
        </div>
    );
}

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-[1px] w-full", className)} />
);

