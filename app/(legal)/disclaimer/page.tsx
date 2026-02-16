'use client';

import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DisclaimerPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FF6600] selection:text-black pt-28 pb-20">
            <div className="container px-4 mx-auto max-w-4xl space-y-8">
                <Button
                    asChild
                    variant="ghost"
                    className="text-zinc-500 hover:text-white pl-0 gap-2 mb-8"
                >
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" /> Back to MarketBridge
                    </Link>
                </Button>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                        Legal <span className="text-[#FF6600]">Disclaimer</span>
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                        Last Updated: February 16, 2026 | Version: 1.0 (Beta Notice)
                    </p>
                </div>

                <div className="mb-10 bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex gap-4 items-start">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                    <p className="text-sm text-yellow-500 mt-1">
                        <strong>TESTING PHASE WARNING:</strong> MarketBridge is currently in a Live Beta.
                        While funds are secured via Paystack/Flutterwave, user experience may vary.
                        By using this platform, you agree to report bugs via the Feedback tool.
                    </p>
                </div>

                <div className="prose prose-invert prose-orange max-w-none space-y-8 text-zinc-300 font-medium">
                    <section className="glass-card p-8 rounded-3xl border-white/5 bg-zinc-900/50">
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-4">1. No Warranty</h2>
                        <p>
                            MarketBridge (Campus Beta) disclaims all warranties, express or implied, including fitness for a particular purpose
                            or non-infringement. We do not guarantee uninterrupted access or error-free operation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">2. User-Generated Content</h2>
                        <p>
                            Listings are created entirely by users. MarketBridge does not verify the accuracy, safety, or legality of items listed.
                            Users transact at their own risk, subject to our Escrow safeguards.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">3. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by Nigerian Law, MarketBridge shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages, or any loss of profits or revenues.
                            Total liability for any claim shall not exceed the amount paid by you to MarketBridge in the last 12 months.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-white/10">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">
                            Legal Contact: legal@marketbridge.com.ng | Abuja, FCT
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
