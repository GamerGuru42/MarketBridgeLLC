'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/AuthContext';
import {
    Menu, User, LogOut, LayoutDashboard, Crown, Zap,
    ShoppingBag, Store, ChevronDown, X
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const Header = () => {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentNode, setCurrentNode] = useState<string>('Abuja');

    useEffect(() => {
        const saved = localStorage.getItem('mb-preferred-node');
        if (saved && saved !== 'global') {
            setCurrentNode(saved);
        } else if (saved === 'global') {
            setCurrentNode('Global');
        }
    }, []);

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    const navLinks = [
        { href: '/listings', label: 'Browse' },
        { href: '/signup?role=student_seller', label: 'Sell on MarketBridge' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] bg-[#0A0A0A] border-b border-white/[0.07] h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">

                    {/* Left: Logo + Campus Node */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Logo />
                        <button
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-full transition-all group"
                            onClick={() => {
                                localStorage.removeItem('mb-preferred-node');
                                window.location.reload();
                            }}
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6200]" />
                            </span>
                            <span className="text-[11px] font-bold text-white/60 group-hover:text-white/90 transition-colors">
                                {currentNode}
                            </span>
                            <ChevronDown className="h-3 w-3 text-white/30" />
                        </button>
                    </div>

                    {/* Centre: Nav Links (desktop) */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                                    isActive(link.href)
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/55 hover:text-white hover:bg-white/[0.06]'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right: Auth actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {!loading && !user && (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-5 py-2 rounded-full bg-[#FF6200] hover:bg-[#FF7A29] text-black text-sm font-black tracking-tight transition-all hover:scale-105 shadow-[0_4px_16px_rgba(255,98,0,0.35)]"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}

                        {user && (
                            <div className="hidden md:flex items-center gap-2">
                                {/* Coins */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-full cursor-help" title="MarketCoins balance">
                                    <Zap className="h-3.5 w-3.5 text-[#FF6200]" />
                                    <span className="text-xs font-black text-white">{(user.coins_balance || 0).toLocaleString()}</span>
                                    <span className="text-[9px] font-black text-[#FF6200]/70 uppercase">MC</span>
                                </div>

                                {/* Profile Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all group">
                                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#FF6200] to-amber-400 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                                                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors max-w-[80px] truncate">
                                                {user.displayName?.split(' ')[0] || 'Account'}
                                            </span>
                                            <ChevronDown className="h-3 w-3 text-white/30" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuContent
                                            align="end"
                                            sideOffset={12}
                                            className="w-64 bg-[#111] border border-white/10 p-1.5 text-white z-[999] shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl"
                                        >
                                            {/* Account info */}
                                            <div className="px-3 py-3 mb-1 border-b border-white/5">
                                                <p className="text-xs font-black text-white truncate">{user.displayName || 'MarketBridge User'}</p>
                                                <p className="text-[11px] text-white/40 truncate mt-0.5">{user.email}</p>
                                            </div>

                                            {['dealer', 'student_seller', 'seller'].includes(user.role) && (
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-white/5 my-0.5">
                                                    <Link href="/seller/dashboard" className="flex items-center gap-3 px-3 py-2.5">
                                                        <Store className="h-4 w-4 text-[#FF6200]" />
                                                        <span className="text-sm font-semibold">Seller Dashboard</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-white/5 my-0.5">
                                                <Link href="/listings" className="flex items-center gap-3 px-3 py-2.5">
                                                    <ShoppingBag className="h-4 w-4 text-white/50" />
                                                    <span className="text-sm font-semibold">Browse Market</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-white/5 my-0.5">
                                                <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5">
                                                    <User className="h-4 w-4 text-white/50" />
                                                    <span className="text-sm font-semibold">My Account</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            {['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'].includes(user.role) && (
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-white/5 my-0.5">
                                                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5">
                                                        <Crown className="h-4 w-4 text-[#FF6200]" />
                                                        <span className="text-sm font-semibold text-[#FF6200]">Admin Panel</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}

                                            <div className="my-1 border-t border-white/5" />

                                            <DropdownMenuItem
                                                onClick={handleSignOut}
                                                className="rounded-xl cursor-pointer focus:bg-red-500/10 text-red-400 my-0.5"
                                            >
                                                <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                                                    <LogOut className="h-4 w-4" />
                                                    <span className="text-sm font-semibold">Log out</span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenuPortal>
                                </DropdownMenu>

                                <LayoutDashboard className="hidden" />
                            </div>
                        )}

                        {/* Mobile Hamburger */}
                        <button
                            className="md:hidden h-9 w-9 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4 text-white" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Slide-down Menu */}
            {mobileMenuOpen && (
                <div className="fixed top-16 left-0 right-0 z-[99] bg-[#0A0A0A] border-b border-white/10 px-6 py-6 flex flex-col gap-4 md:hidden">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-white/70 hover:text-white font-semibold text-lg transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="border-t border-white/5 pt-4 flex flex-col gap-3 mt-2">
                        {user ? (
                            <>
                                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="text-white/60 font-semibold">My Account</Link>
                                <button onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} className="text-red-400 font-semibold text-left">Log out</button>
                            </>
                        ) : (
                            <>
                                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full py-3.5 rounded-2xl bg-[#FF6200] text-black font-black text-center text-sm uppercase tracking-widest">
                                    Sign Up Free
                                </Link>
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3.5 rounded-2xl border border-white/15 text-white font-semibold text-center text-sm">
                                    Log In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
