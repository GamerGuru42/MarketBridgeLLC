import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { Logo } from '@/components/logo';

export const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 z-50 relative">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                    <div className="space-y-6">
                        <Logo />
                        <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                            <strong>MarketBridge Campus Beta</strong><br />
                            <a href="mailto:support@marketbridge.com.ng?subject=Tech%20Support" className="hover:text-[#FF6200] transition-colors">
                                Tech Support: support@marketbridge.com.ng
                            </a><br />
                            <a href="mailto:ops-support@marketbridge.com.ng?subject=Ops%20Support" className="hover:text-[#FF6200] transition-colors">
                                Ops / Refunds / Account Help: ops-support@marketbridge.com.ng
                            </a><br />
                            Website: <a href="https://marketbridge.com.ng" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">https://marketbridge.com.ng</a><br />
                            <span className="text-[10px] text-zinc-600 mt-2 block">
                                <Link href="/terms" className="hover:text-white">Terms</Link> | <Link href="/privacy" className="hover:text-white">Privacy</Link> | <Link href="/refund" className="hover:text-white">Refund</Link> | <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
                            </span>
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-8">Platform</h3>
                        <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            <li><Link href="/listings" className="hover:text-white transition-colors">Browse Listings</Link></li>
                            <li><Link href="/dealers" className="hover:text-white transition-colors">Founding Sellers</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Beta Access</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-8">Legal (Beta)</h3>
                        <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy (NDPA)</Link></li>
                            <li><Link href="/refund" className="hover:text-white transition-colors">Refund & Cancellation</Link></li>
                            <li><Link href="/disclaimer" className="hover:text-white transition-colors">Beta Disclaimer</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-8">Connect</h3>
                        <div className="flex space-x-6">
                            {[
                                { Icon: Instagram, href: "https://instagram.com/marketbridge.ng" },
                                { Icon: Twitter, href: "https://x.com/marketbridgeng" },
                                { Icon: Facebook, href: "https://facebook.com/marketbridgeng" }
                            ].map((social, i) => (
                                <Link key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="h-10 w-10 glass-card rounded-xl flex items-center justify-center text-zinc-500 hover:text-[#FF6200] hover:border-[#FF6200]/50 transition-all">
                                    <social.Icon className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-700 font-black uppercase tracking-[0.2em]">
                    <p>&copy; {new Date().getFullYear()} MarketBridge Limited (Beta). All rights reserved.</p>
                    <div className="flex gap-8">
                        <span className="text-[#FF6200] flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200] animate-pulse" />
                            Systems Operational
                        </span>
                        <span className="text-zinc-600">v1.0.0-BETA.3</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
