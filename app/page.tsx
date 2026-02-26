'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Loader2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import QRCode from 'react-qr-code';
import { Logo } from '@/components/logo';

export default function WaitlistPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchWaitlistCount = async () => {
            const { count } = await supabase
                .from('waitlist')
                .select('*', { count: 'exact', head: true });
            if (count !== null) setWaitlistCount(count);
        };
        fetchWaitlistCount();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.error && data.error.includes('already exists')) {
                    throw new Error('This email is already on the waitlist!');
                }
                throw new Error(data.error || 'Failed to join waitlist');
            }

            setStatus('success');
            setMessage("Welcome! You're now in the queue. We'll notify you when we open.");
            setEmail('');
            // refresh count
            const { count } = await supabase.from('waitlist').select('*', { count: 'exact', head: true });
            if (count !== null) setWaitlistCount(count);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FF6200] selection:text-white">
            <header className="w-full p-6 flex justify-center absolute top-0 z-50">
                <div className="flex items-center">
                    <Logo size="xl" />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-24 pb-20 relative overflow-hidden">
                {/* Subtle Orange Glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6200]/15 blur-[120px] rounded-full pointer-events-none" />

                <div className="z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-12">

                    {/* Header Section */}
                    <div className="space-y-6 mt-8">
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#FF6200] leading-[1.1]">
                            THE WAIT IS ALMOST OVER.
                        </h1>
                        <h2 className="text-xl md:text-2xl font-medium text-white mx-auto leading-relaxed max-w-3xl">
                            MarketBridge is here, a safer, smarter way to buy and sell on campus. Whether you're a student, staff, or part of the community, discover a marketplace built for you.
                        </h2>
                        <div className="text-[#FF6200] font-bold text-lg md:text-xl pt-2">
                            Launching first in Abuja. Coming soon.
                        </div>
                    </div>

                    {/* Buyer Waitlist Section */}
                    <div className="w-full max-w-xl bg-white/5 border border-white/10 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="space-y-4 mb-8">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-white">
                                Join the Buyer Waitlist
                            </h3>
                            <p className="text-zinc-400 text-sm md:text-base font-medium leading-relaxed">
                                Be the first to know when we launch. Get exclusive early access + special launch discounts.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="relative flex items-center">
                                <Mail className="absolute left-5 h-6 w-6 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    placeholder="Enter your email address"
                                    className="w-full h-16 bg-black/50 border border-white/20 rounded-2xl pl-16 pr-6 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] transition-all font-medium text-lg disabled:opacity-50"
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <p className="text-red-500 text-sm font-bold text-left px-2">{message}</p>
                            )}

                            {status === 'success' ? (
                                <div className="bg-[#FF6200]/10 border border-[#FF6200]/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-[#FF6200] animate-in fade-in slide-in-from-bottom-2">
                                    <CheckCircle className="h-10 w-10 text-[#FF6200]" />
                                    <p className="font-bold text-base text-center">{message}</p>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full h-16 bg-[#FF6200] text-black font-black uppercase tracking-widest text-lg rounded-2xl hover:bg-[#ff7a29] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 shadow-[0_0_40px_rgba(255,98,0,0.4)] flex items-center justify-center"
                                >
                                    {status === 'loading' ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        'Join Waitlist →'
                                    )}
                                </button>
                            )}
                        </form>

                        {waitlistCount !== null && (
                            <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm font-bold mt-6 animate-in fade-in zoom-in">
                                <Users className="h-5 w-5 text-[#FF6200]" />
                                Already joined: <span className="text-white bg-white/10 px-3 py-1 rounded-md">{waitlistCount}</span> real students
                            </div>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="w-full max-w-xl flex items-center justify-center gap-4 opacity-30">
                        <div className="h-px bg-white flex-1" />
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Campus Crew</span>
                        <div className="h-px bg-white flex-1" />
                    </div>

                    {/* Seller Section */}
                    <div className="w-full max-w-xl text-center space-y-8 pb-12">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-[#FF6200]">
                                Are you a student seller ready to earn first?
                            </h3>
                            <p className="text-zinc-300 text-base font-medium">
                                Join our exclusive Campus Crew and start listing items before buyers arrive.
                            </p>
                            <div className="inline-block bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest animate-pulse">
                                Limited: First 40 Sellers Only
                            </div>
                        </div>

                        <div className="flex justify-center items-center">
                            <div className="bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] inline-flex flex-col items-center gap-6 group hover:scale-[1.02] transition-transform duration-300">
                                <a href="https://marketbridge.com.ng/seller" className="block relative">
                                    <QRCode
                                        value="https://marketbridge.com.ng/seller"
                                        size={220}
                                        bgColor="#FFFFFF"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                                        <div className="bg-[#FF6200] text-black text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                                            Tap to Open
                                        </div>
                                    </div>
                                </a>
                                <div className="space-y-2 text-center">
                                    <span className="block text-black font-black uppercase tracking-widest text-sm">
                                        Scan to become a Campus Seller
                                    </span>
                                    <a
                                        href="https://marketbridge.com.ng/seller"
                                        className="inline-block text-[#FF6200] hover:text-[#ff7a29] font-bold text-sm underline transition-colors"
                                    >
                                        Or tap here: marketbridge.com.ng/seller
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
