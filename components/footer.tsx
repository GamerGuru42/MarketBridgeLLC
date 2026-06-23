import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { Logo } from '@/components/logo';

export const Footer = () => {
    return (
        <footer className="bg-card border-t border-border pt-24 pb-36 md:pb-12 z-50 relative">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                    <div className="space-y-6">
                        <Logo />
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                            <strong className="text-foreground">MarketBridge Campus</strong><br />
                            <a href="mailto:support@marketbridge.com.ng?subject=Tech%20Support" className="text-[#FF6200] hover:text-[#FF7A29] transition-colors">
                                Tech Support: support@marketbridge.com.ng
                            </a><br />
                            <a href="mailto:ops-support@marketbridge.com.ng?subject=Ops%20Support" className="text-[#FF6200] hover:text-[#FF7A29] transition-colors">
                                Ops / Refunds / Account Help: ops-support@marketbridge.com.ng
                            </a><br />
                            Website: <a href="https://marketbridge.com.ng" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6200] transition-colors text-foreground">https://marketbridge.com.ng</a><br />
                            <span className="text-[10px] text-muted-foreground mt-2 block">
                                <Link href="/terms" className="hover:text-foreground">Terms</Link> | <Link href="/privacy" className="hover:text-foreground">Privacy</Link> | <Link href="/refund" className="hover:text-foreground">Refund</Link>
                            </span>
                        </p>
                    </div>

                    <div>
                        <h3 className="text-foreground font-black uppercase text-[10px] tracking-[0.2em] mb-8">Platform</h3>
                        <ul className="space-y-4 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                            <li><Link href="/listings" className="hover:text-foreground transition-colors">Browse Listings</Link></li>
                            <li><Link href="/sellers" className="hover:text-foreground transition-colors">Student Sellers</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="/faq" className="hover:text-foreground transition-colors">How It Works</Link></li>
                            <li><Link href="/seller-onboarding" className="hover:text-foreground transition-colors">Sell on MarketBridge</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-foreground font-black uppercase text-[10px] tracking-[0.2em] mb-8">Legal</h3>
                        <ul className="space-y-4 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                            <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy (NDPA)</Link></li>
                            <li><Link href="/refund" className="hover:text-foreground transition-colors">Refund & Cancellation</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-foreground font-black uppercase text-[10px] tracking-[0.2em] mb-8">Connect</h3>
                        <div className="flex space-x-4">
                            {[
                                { Icon: Instagram, href: "https://instagram.com/marketbridge.ng" },
                                { Icon: Twitter, href: "https://x.com/marketbridgeng" },
                                { Icon: Facebook, href: "https://facebook.com/marketbridgeng" }
                            ].map((social, i) => (
                                <Link key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-secondary border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-[#FF6200] hover:border-[#FF6200]/50 transition-all">
                                    <social.Icon className="h-4 w-4" />
                                </Link>
                            ))}
                            <Link href="https://tiktok.com/@marketbridge.ng" target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-secondary border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-[#FF6200] hover:border-[#FF6200]/50 transition-all">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.42-.37-.24-.71-.53-1.02-.85v7.39c.01 2.44-.85 4.87-2.5 6.63-1.89 2.05-4.82 3.1-7.59 2.72-2.73-.37-5.18-2.22-6.28-4.78-1.28-2.91-.65-6.66 1.54-8.87 1.9-1.95 4.86-2.67 7.42-1.86v4.14c-1.39-.51-3.01-.26-4.14.74-.9.78-1.26 2.04-.98 3.2.27 1.12 1.2 2.02 2.34 2.25.96.2 2 .02 2.8-.52.88-.58 1.39-1.6 1.39-2.65V.02z"/>
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                    <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
                        <p>&copy; {new Date().getFullYear()} MarketBridge Limited. All rights reserved.</p>
                        <p className="text-foreground/70 normal-case tracking-normal">MarketBridge NG Limited | Registered in Abuja, Nigeria</p>
                    </div>
                    <div className="flex gap-8">
                        <span className="text-[#FF6200] flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200] animate-pulse" />
                            Systems Operational
                        </span>
                        <span className="text-muted-foreground">v1.0.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
