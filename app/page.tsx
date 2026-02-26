'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export default function WaitlistPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

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
                throw new Error(data.error || 'Failed to join waitlist');
            }

            setStatus('success');
            setMessage('You have successfully joined the MarketBridge queue! We will notify you when we launch.');
            setEmail('');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FF6200] selection:text-white">
            <header className="w-full p-6 flex justify-center border-b border-white/5 absolute top-0 z-50 bg-black/50 backdrop-blur-sm">
                <div className="text-2xl font-black italic tracking-widest text-[#FF6200] uppercase">
                    MarketBridge
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF6200]/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="z-10 w-full max-w-xl flex flex-col items-center text-center space-y-8 bg-black/40 backdrop-blur-md p-10 md:p-14 rounded-[3rem] border border-white/10 shadow-2xl">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF6200]/30 bg-[#FF6200]/10 text-[#FF6200] uppercase text-[10px] font-black tracking-[0.2em] mb-4 shadow-[0_0_20px_rgba(255,98,0,0.2)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]"></span>
                            </span>
                            Platform Locked For Now
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
                            Join the <span className="text-[#FF6200]">Queue</span>
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base font-medium max-w-md mx-auto leading-relaxed">
                            MarketBridge is currently in closed development. Drop your email below to get notified and receive exclusive early access when we launch.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full relative max-w-sm flex flex-col gap-4 mx-auto">
                        <div className="relative flex items-center">
                            <Mail className="absolute left-4 h-5 w-5 text-zinc-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                                placeholder="name@university.edu"
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6200] focus:bg-white/10 transition-all font-medium text-sm disabled:opacity-50"
                            />
                        </div>

                        {status === 'error' && (
                            <p className="text-red-500 text-xs text-left font-bold px-2">{message}</p>
                        )}

                        {status === 'success' ? (
                            <div className="bg-[#FF6200]/20 border border-[#FF6200]/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-[#FF6200] animate-in fade-in slide-in-from-bottom-2">
                                <CheckCircle className="h-8 w-8 text-[#FF6200]" />
                                <p className="font-bold text-sm text-center">{message}</p>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full h-14 bg-[#FF6200] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#ff7a29] transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-50 shadow-[0_0_30px_rgba(255,98,0,0.3)] flex items-center justify-center"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Get Early Access'
                                )}
                            </button>
                        )}
                    </form>
                </div>
            </main>

            <footer className="w-full p-6 border-t border-white/5 bg-[#000000] text-center text-[10px] font-black tracking-widest uppercase text-zinc-600 z-50 absolute bottom-0">
                MarketBridge Africa © {new Date().getFullYear()}
            </footer>
        </div>
    );
}
