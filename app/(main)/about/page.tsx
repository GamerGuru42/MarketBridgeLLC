'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Users, Eye, MessageSquare, CheckCircle, Lock, Wallet, Clock, AlertTriangle, ArrowLeft, ArrowUpRight, Zap, Target, Activity } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-[#FF6600] selection:text-black pt-28 pb-20">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container px-4 mx-auto relative z-10 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-b border-white/5 pb-12">
                    <div className="space-y-6 max-w-2xl">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-[#FF6600] hover:text-[#FF6600] hover:bg-transparent p-0 h-auto text-[10px] font-black uppercase tracking-[0.2em] font-heading"
                        >
                            <ArrowLeft className="mr-2 h-3 w-3" /> Return to Core
                        </Button>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Protocol <span className="text-zinc-500">Intelligence.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed italic">
                            Building Nigeria's most trusted <span className="text-white">escrow-protected infrastructure</span> for high-value asset exchange.
                        </p>
                    </div>
                </div>

                {/* Manifesto Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
                    <div className="glass-card p-12 rounded-[3.5rem] border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Logo size="xl" hideText />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic font-heading tracking-tighter mb-8 flex items-center gap-4">
                            <span className="h-2 w-2 rounded-full bg-[#FF6600]" />
                            The Mission
                        </h2>
                        <div className="space-y-6 text-zinc-400 font-medium leading-relaxed">
                            <p>
                                MarketBridge was founded on a single principle: <span className="text-white italic">Trust is good. Control is better.</span> In a digital landscape where anonymity often breeds uncertainty, we provide the infrastructure for transparency.
                            </p>
                            <p>
                                Starting with the automotive sector, we are bridge-building between verified dealers and serious buyers. Our escrow protocol ensures that capital only flows when fulfillment is verified.
                            </p>
                            <div className="pt-8 flex gap-4">
                                <Link href="/signup" className="h-12 px-8 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all group/link">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Join the Protocol</span>
                                    <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover/link:text-[#FF6600] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all" />
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { title: 'Verified Nodes', desc: 'All dealers undergo rigorous identity and business documentation verification.', icon: Shield },
                            { title: 'Escrow Flow', desc: 'Capital is held in secure custody until order fulfillment is confirmed by the buyer.', icon: Lock },
                            { title: 'Direct Uplink', desc: 'Encrypted communication channels between participants for secure negotiation.', icon: MessageSquare },
                            { title: 'Zero Friction', desc: 'Built for speed and security, ensuring low-latency asset discovery.', icon: Zap }
                        ].map((item, i) => (
                            <div key={i} className="glass-card p-8 rounded-3xl border-white/5 hover:border-[#FF6600]/20 transition-all duration-500 group">
                                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#FF6600]/50 group-hover:bg-[#FF6600]/10 transition-all">
                                    <item.icon className="h-5 w-5 text-zinc-500 group-hover:text-[#FF6600]" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3 italic">{item.title}</h3>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secure Protocol Steps */}
                <div className="mb-32">
                    <div className="text-center mb-20 space-y-4">
                        <p className="text-[10px] text-[#FF6600] font-black uppercase tracking-[0.4em] font-heading">Operational Framework</p>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">How the <span className="text-zinc-500">Bridge</span> Functions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { step: '01', title: 'Asset Scan', desc: 'Browse high-fidelity listings from authorized dealer nodes.', icon: Target },
                            { step: '02', title: 'Signal Link', desc: 'Initiate secure negotiation via encrypted chat protocols.', icon: Activity },
                            { step: '03', title: 'Capital Lock', desc: 'Payment is committed to the escrow bridge, protecting the buyer.', icon: Wallet },
                            { step: '04', title: 'Release Flow', desc: 'Upon verified delivery, capital is released to the seller.', icon: CheckCircle }
                        ].map((item, i) => (
                            <div key={i} className="relative group">
                                <div className="glass-card p-10 rounded-[2.5rem] border-white/5 h-full relative z-10 hover:translate-y-[-8px] transition-all duration-500">
                                    <div className="text-5xl font-black text-zinc-900 absolute top-8 right-8 group-hover:text-[#FF6600]/10 transition-colors">{item.step}</div>
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                                        <item.icon className="h-6 w-6 text-[#FF6600]" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-4 italic font-heading">{item.title}</h3>
                                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Protection Alert */}
                <div className="glass-card p-10 rounded-[3rem] border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden mb-32">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <AlertTriangle className="h-32 w-32 text-yellow-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="h-20 w-20 rounded-[2rem] bg-yellow-500/20 flex items-center justify-center shrink-0">
                            <Shield className="h-10 w-10 text-yellow-500" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic font-heading text-yellow-500">Dispute & Conflict Resolution</h3>
                            <p className="text-sm text-yellow-600/80 font-medium leading-relaxed max-w-3xl">
                                Our protocol includes built-in safeguards for all participants. If an asset fails to meet the verified specifications or delivery is compromised, the escrow bridge remains locked. Our arbitration node will review the manifest and ensure an equitable outcome.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="text-center py-20 border-t border-white/5">
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic font-heading mb-12">
                        Ready to <span className="text-[#FF6600]">Escalate?</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button asChild size="lg" className="h-16 px-12 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest text-xs italic">
                            <Link href="/listings">Examine Stream</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-16 px-12 border-white/10 bg-transparent text-white hover:bg-white/5 rounded-2xl font-black uppercase tracking-widest text-xs italic">
                            <Link href="/signup">Establish Dealer Node</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
