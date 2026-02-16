'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function PaymentPendingPage() {
    const searchParams = useSearchParams();
    const ref = searchParams.get('ref');

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />

            <div className="bg-zinc-900 border border-white/10 p-8 md:p-12 rounded-3xl max-w-lg w-full text-center relative z-10 shadow-2xl">
                <div className="h-20 w-20 bg-[#00FF85]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#00FF85]/20">
                    <CheckCircle className="h-10 w-10 text-[#00FF85]" />
                </div>

                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 italic font-heading">
                    Instant Access <span className="text-[#00FF85]">Granted!</span>
                </h1>

                <p className="text-zinc-400 mb-8 leading-relaxed">
                    We've unlocked your premium features <strong>provisionally</strong> so you can start selling immediately! 🚀
                    <br /><br />
                    Our team will verify your payment in the background.
                    As long as the transfer is confirmed within 24 hours, you're all set!
                </p>

                {ref && (
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-8">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Reference ID</p>
                        <p className="font-mono text-[#FF6600] tracking-wider">{ref}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <Button asChild className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest rounded-xl text-sm">
                        <Link href="/dealer/dashboard">
                            Return to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>

                    <p className="text-xs text-zinc-600 flex items-center justify-center gap-2">
                        <ShieldCheck className="h-3 w-3" />
                        Secure Transaction via MarketBridge
                    </p>
                </div>
            </div>
        </div>
    );
}
