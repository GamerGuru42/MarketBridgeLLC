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
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                            MarketBridge is Nigeria's trusted digital marketplace, connecting verified dealers with everyday customers through transparency and trust.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-8">Platform</h3>
                        <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            <li><Link href="/listings" className="hover:text-white transition-colors">Browse Listings</Link></li>
                            <li><Link href="/dealers" className="hover:text-white transition-colors">Find Dealers</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-8">Support</h3>
                        <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ Terminal</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Data Privacy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-8">Connect</h3>
                        <div className="flex space-x-6">
                            {[
                                { Icon: Instagram, href: "https://instagram.com/marketbridgeng" },
                                { Icon: Twitter, href: "https://x.com/marketbridgeng" },
                                { Icon: Facebook, href: "https://facebook.com/marketbridgeng" }
                            ].map((social, i) => (
                                <Link key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="h-10 w-10 glass-card rounded-xl flex items-center justify-center text-zinc-500 hover:text-[#FF6600] hover:border-[#FF6600]/50 transition-all">
                                    <social.Icon className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-700 font-black uppercase tracking-[0.2em]">
                    <p>&copy; {new Date().getFullYear()} MarketBridge Terminal. All rights reserved.</p>
                    <div className="flex gap-8">
                        <span className="text-zinc-800">Status: Operational</span>
                        <span className="text-zinc-800">Version: 4.2.0-BETA</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
