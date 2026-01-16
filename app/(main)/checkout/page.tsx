'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingBag, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="h-12 w-12 border-2 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FFB800] selection:text-black pt-32 pb-20">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container relative z-10 max-w-4xl mx-auto px-6">
                <div className="text-center space-y-6 mb-16">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">Protocol Update</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                        Secure <span className="text-[#FFB800]">Escrow</span> Handshake
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-2xl mx-auto italic lowercase leading-relaxed">
                        Transitioning to <span className="text-white font-bold">Smart Escrow Protocols</span>.
                        Direct transactions are now initiated within authorized Signal Channels.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Main Logic Card */}
                    <div className="md:col-span-12 glass-card rounded-[3rem] p-10 md:p-16 border-[#FFB800]/10 bg-gradient-to-br from-[#FFB800]/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <ShieldCheck className="h-48 w-48 text-[#FFB800]" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-start gap-8 mb-16 border-b border-white/5 pb-12">
                                <div className="h-20 w-20 rounded-[2rem] bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center shrink-0">
                                    <Cpu className="h-10 w-10 text-[#FFB800]" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight font-heading">System Integration Phase</h3>
                                    <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
                                        We have phased out traditional checkout for high-value items.
                                        All transactions are now processed via our <span className="text-[#FFB800] font-bold">Smart Escrow Mesh</span>,
                                        ensuring 100% protection for both nodes.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 font-heading mb-6">Execution Sequence</h4>
                                    <div className="space-y-6">
                                        {[
                                            { step: '01', desc: 'IDENTIFY ASSET IN THE GLOBAL STREAM' },
                                            { step: '02', desc: 'ESTABLISH SECURE SIGNAL WITH VENDOR' },
                                            { step: '03', desc: 'NEGOTIATE PROTOCOL & PARAMETERS' },
                                            { step: '04', desc: 'EXECUTE SMART ESCROW PAYMENT' },
                                            { step: '05', desc: 'FINALIZE RECEIPT & RELEASE ASSETS' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <span className="text-[10px] font-black text-[#FFB800] font-heading bg-[#FFB800]/10 h-7 w-7 rounded-lg flex items-center justify-center border border-[#FFB800]/20">{item.step}</span>
                                                <p className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors tracking-widest uppercase font-heading">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8 md:border-l md:border-white/5 md:pl-12">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 font-heading mb-6">Protocol Security</h4>
                                    <div className="space-y-4">
                                        {[
                                            'Bi-directional Verification',
                                            'Encrypted Escrow Holding',
                                            'Fraud Detection Algorithms',
                                            'Direct Node Communication'
                                        ].map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[11px] font-bold text-zinc-400 italic lowercase tracking-tight">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8">
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 font-heading">Network Status</p>
                                            <p className="text-[10px] font-medium text-zinc-500 lowercase italic">All systems operational. Smart Escrow active for 100% of marketplace nodes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
                                <Button asChild className="h-16 bg-[#FFB800] text-black hover:bg-[#FFD700] rounded-2xl font-black uppercase tracking-widest text-[10px] font-heading italic shadow-lg shadow-[#FFB800]/10 border-none transition-all hover:scale-[1.02]">
                                    <Link href="/listings" className="flex items-center gap-3">
                                        <ShoppingBag className="h-4 w-4" />
                                        Return to Stream
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="h-16 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-widest text-[10px] font-heading italic transition-all hover:scale-[1.02]">
                                    <Link href="/chats" className="flex items-center gap-3">
                                        <MessageSquare className="h-4 w-4" />
                                        Access Signals
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center">
                    <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em] font-heading italic">Authorized by MarketBridge CORE v16.0</p>
                </div>
            </div>
        </div>
    );
}

