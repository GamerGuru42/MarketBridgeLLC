'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Globe, Smartphone, Package, Search } from 'lucide-react';

export default function PublicMarketplacePage() {
    return (
        <div className="container mx-auto px-6 py-20 min-h-screen">
            <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-top-10 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                    <Globe className="h-3 w-3" />
                    Connecting All of Nigeria
                </div>
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-tight font-heading">
                    Public <span className="text-blue-500">Marketplace</span>
                </h1>
                <p className="max-w-2xl mx-auto text-zinc-500 text-lg font-medium italic">
                    The broad-spectrum commerce protocol for Nigeria. High-security escrow trading for general goods and services.
                </p>
            </div>

            <Card className="max-w-4xl mx-auto glass-card border-none rounded-[3rem] p-12 text-center relative overflow-hidden bg-zinc-900/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />

                <div className="mx-auto h-24 w-24 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
                    <Lock className="h-10 w-10 text-blue-500 animate-pulse" />
                </div>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">
                    Expansion Node Pending
                </h2>
                <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed uppercase text-xs font-bold tracking-widest">
                    The Public Marketplace is currently locked for national security and protocol testing. It will be enabled in Phase 2 of the MarketBridge deployment.
                </p>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30">
                    <div className="p-6 bg-white/5 rounded-3xl space-y-3">
                        <Smartphone className="h-6 w-6 text-blue-400 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">OTP Auth</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl space-y-3">
                        <Package className="h-6 w-6 text-blue-400 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Used Goods</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl space-y-3">
                        <Search className="h-6 w-6 text-blue-400 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Smart Search</p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <Button disabled className="h-14 px-10 bg-blue-500/20 text-blue-500 font-black uppercase tracking-widest rounded-xl border border-blue-500/30">
                        Stay Notified
                    </Button>
                </div>
            </Card>
        </div>
    );
}
