'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, User, LogOut, LayoutDashboard, Crown, MapPin, ChevronRight, Zap } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export const Header = () => {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 20);
    });

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    const [currentNode, setCurrentNode] = useState<string>('Abuja');

    useEffect(() => {
        const saved = localStorage.getItem('mb-preferred-node');
        if (saved && saved !== 'global') {
            setCurrentNode(saved);
        } else if (saved === 'global') {
            setCurrentNode('Global');
        }
    }, []);

    const navLinkClass = (path: string) => cn(
        "relative text-xs font-bold uppercase tracking-widest transition-colors duration-300",
        isActive(path) ? "text-white" : "text-zinc-400 hover:text-white"
    );

    return (
        <motion.header
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b",
                scrolled
                    ? "bg-black/80 backdrop-blur-xl border-white/5 h-20 shadow-2xl"
                    : "bg-transparent border-transparent h-24"
            )}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "circOut" }}
        >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo & Node */}
                <div className="flex items-center gap-6">
                    <Logo />
                    <div
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 hover:border-[#FF6200]/30 transition-all group"
                        onClick={() => { localStorage.removeItem('mb-preferred-node'); window.location.reload(); }}
                    >
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]"></span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-300 group-hover:text-white transition-colors">{currentNode} Node</span>
                    </div>
                </div>

                {/* Desktop Nav - Removed as per user request */}
                <div className="hidden lg:flex" />

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {!user && !loading && (
                        <div className="hidden lg:flex items-center gap-4">
                            <Link href="/login" className="text-white font-bold text-xs uppercase tracking-widest hover:text-[#FF6200] transition-colors">
                                Sign In
                            </Link>
                            <Button asChild className="bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest px-6 rounded-full h-10 transition-all shadow-lg shadow-[#FF6200]/20 hover:shadow-[#FF6200]/40 hover:scale-105 border-none">
                                <Link href="/signup">
                                    Get Started
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}

                    {user && (
                        <div className="flex items-center gap-3">
                            {/* MarketCoins Display */}
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-full group cursor-help" title="Your MarketCoins balance">
                                <Zap className="h-4 w-4 text-[#FF6200] fill-[#FF6200]/20 group-hover:scale-110 transition-transform" />
                                <span className="text-[12px] font-black text-white tracking-widest leading-none">
                                    {(user.coins_balance || 0).toLocaleString()}
                                </span>
                                <span className="text-[8px] font-black uppercase text-[#FF6200] tracking-widest opacity-60">MC</span>
                            </div>

                            {/* External Logout Button for easier access */}
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="hidden md:flex items-center gap-2 h-11 px-5 rounded-full border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/50 text-zinc-400 hover:text-red-500 transition-all font-black uppercase text-[10px] tracking-widest group"
                            >
                                <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span>Logout</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-11 w-11 rounded-full p-0 border border-white/10 bg-white/5 hover:bg-white/10 ring-offset-black transition-all hover:scale-105 active:scale-95">
                                        <div className="relative">
                                            <User className="h-5 w-5 text-zinc-300" />
                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6200]"></span>
                                            </span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent
                                        align="end"
                                        sideOffset={15}
                                        className="w-72 bg-black border border-white/10 p-2 text-white z-[999] shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl backdrop-blur-3xl"
                                    >
                                        <div className="px-4 py-4 mb-2 border-b border-white/5 bg-zinc-900/50 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Account Protocol</p>
                                            <p className="text-sm font-black truncate text-white uppercase tracking-tight">{user.displayName || 'MarketBridge User'}</p>
                                            <p className="text-[10px] text-[#FF6200] font-bold truncate opacity-80">{user.email}</p>
                                        </div>

                                        {/* Primary Seller Action */}
                                        {['dealer', 'student_seller'].includes(user.role) && (
                                            <DropdownMenuItem asChild className="focus:bg-white/5 rounded-2xl cursor-pointer py-3 group my-1 outline-none border border-transparent focus:border-white/5">
                                                <Link href="/seller/dashboard" className="flex items-center gap-4 w-full px-2">
                                                    <div className="h-9 w-9 rounded-xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center group-hover:bg-[#FF6200]/20 transition-all">
                                                        <LayoutDashboard className="h-4 w-4 text-[#FF6200]" />
                                                    </div>
                                                    <span className="font-bold uppercase text-[10px] tracking-widest text-[#FF6200]">Merchant Terminal</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem asChild className="focus:bg-white/5 rounded-2xl cursor-pointer py-3 group my-1 outline-none transition-colors border border-transparent focus:border-white/5">
                                            <Link href="/settings" className="flex items-center gap-4 w-full px-2">
                                                <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-[#FF6200]/50 transition-colors">
                                                    <User className="h-4 w-4 text-zinc-500 group-hover:text-[#FF6200]" />
                                                </div>
                                                <span className="font-bold uppercase text-[10px] tracking-widest text-zinc-400 group-hover:text-white transition-colors">Profile Node</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        {['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'].includes(user.role) && (
                                            <DropdownMenuItem asChild className="focus:bg-white/5 rounded-2xl cursor-pointer py-3 group my-1 outline-none border border-transparent focus:border-white/5">
                                                <Link href="/admin" className="flex items-center gap-4 w-full px-2">
                                                    <div className="h-9 w-9 rounded-xl bg-[#FF6200]/10 border border-[#FF6200]/20 flex items-center justify-center">
                                                        <Crown className="h-4 w-4 text-[#FF6200]" />
                                                    </div>
                                                    <span className="font-bold uppercase text-[10px] tracking-widest text-[#FF6200]">Master Control</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <div className="my-2 border-t border-white/5" />
                                        <DropdownMenuItem onClick={handleSignOut} className="focus:bg-red-500/10 text-red-500 rounded-2xl cursor-pointer py-3 group my-1 border border-transparent focus:border-red-500/10">
                                            <span className="flex items-center gap-4 w-full px-2">
                                                <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20">
                                                    <LogOut className="h-4 w-4 text-red-500" />
                                                </div>
                                                <span className="font-bold uppercase text-[10px] tracking-widest">Disconnect</span>
                                            </span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-full border border-white/10 bg-white/5 hover:bg-white/10">
                                <Menu className="h-5 w-5 text-white" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full bg-black backdrop-blur-2xl border-none p-8 flex flex-col z-[200]">
                            <div className="flex justify-between items-center mb-16">
                                <Logo />
                            </div>

                            <nav className="flex flex-col gap-8 text-3xl font-black uppercase tracking-tighter italic">
                                {/* Simplified Mobile Nav */}
                                <Link
                                    href="/listings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="transition-all hover:translate-x-4 text-white/40 hover:text-white"
                                >
                                    Browse Assets
                                </Link>
                            </nav>

                            <div className="mt-auto flex flex-col gap-4">
                                {!user ? (
                                    <>
                                        <Button asChild className="h-16 rounded-[2rem] bg-[#FF6200] text-black font-black uppercase tracking-widest border-none hover:bg-[#FF7A29]">
                                            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
                                        </Button>
                                        <Button variant="outline" asChild className="h-16 rounded-[2rem] bg-transparent border-white/20 text-white font-black uppercase tracking-widest hover:bg-white hover:text-black hover:border-transparent transition-all">
                                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleSignOut} className="h-16 rounded-[2rem] bg-zinc-900 border border-white/10 text-red-500 font-black uppercase tracking-widest hover:bg-red-950/30">
                                        Log Out
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </motion.header>
    );
};
