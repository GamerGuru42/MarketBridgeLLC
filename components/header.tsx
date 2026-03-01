'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/AuthContext';
import {
    Menu, User, LogOut, LayoutDashboard, Crown, Zap,
    ShoppingBag, Store, ChevronDown, X, MessageCircle
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
import { ThemeToggle } from '@/components/ThemeToggle';

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
        { href: '/marketplace', label: 'Browse' },
        { href: '/seller-onboard', label: 'Sell on MarketBridge' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">

                    {/* Left: Logo + Campus Node */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Logo />
                        <button
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800/50 rounded-full transition-all group"
                            onClick={() => {
                                localStorage.removeItem('mb-preferred-node');
                                window.location.reload();
                            }}
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6200]" />
                            </span>
                            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                {currentNode}
                            </span>
                            <ChevronDown className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                        </button>
                    </div>

                    {/* Centre: Nav Links (desktop) */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'px-4 py-2 rounded-full text-sm font-bold transition-all',
                                    isActive(link.href)
                                        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
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
                                    className="px-4 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-full"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-5 py-2 rounded-full bg-[#FF6200] hover:bg-[#FF7A29] text-white text-sm font-black tracking-wide transition-all hover:scale-105 shadow-[0_4px_16px_rgba(255,98,0,0.25)]"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>

                        {user && (
                            <div className="hidden md:flex items-center gap-2">
                                {/* Coins */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-full cursor-help" title="MarketCoins balance">
                                    <Zap className="h-3.5 w-3.5 text-[#FF6200]" />
                                    <span className="text-xs font-black text-zinc-900 dark:text-white">{(user.coins_balance || 0).toLocaleString()}</span>
                                    <span className="text-[9px] font-black text-[#FF6200]/90 uppercase">MC</span>
                                </div>

                                {/* Messages Link */}
                                <Link
                                    href="/chats"
                                    className="px-3 py-1.5 flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="text-xs font-bold hidden lg:inline">Messages</span>
                                </Link>

                                {/* Profile Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm group">
                                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#FF6200] to-amber-400 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors max-w-[80px] truncate">
                                                {user.displayName?.split(' ')[0] || 'Account'}
                                            </span>
                                            <ChevronDown className="h-3 w-3 text-zinc-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuContent
                                            align="end"
                                            sideOffset={12}
                                            className="w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1.5 text-zinc-900 dark:text-white z-[999] shadow-2xl rounded-2xl"
                                        >
                                            {/* Account info */}
                                            <div className="px-3 py-3 mb-1 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg">
                                                <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{user.displayName || 'MarketBridge User'}</p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">{user.email}</p>
                                            </div>

                                            {['dealer', 'student_seller', 'seller'].includes(user.role) && (
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 my-0.5">
                                                    <Link href="/seller/dashboard" className="flex items-center gap-3 px-3 py-2.5">
                                                        <Store className="h-4 w-4 text-[#FF6200]" />
                                                        <span className="text-sm font-bold">Seller Dashboard</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 my-0.5">
                                                <Link href="/marketplace" className="flex items-center gap-3 px-3 py-2.5">
                                                    <ShoppingBag className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-sm font-bold">Browse Market</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 my-0.5">
                                                <Link href="/chats" className="flex items-center gap-3 px-3 py-2.5">
                                                    <MessageCircle className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-sm font-bold">My Communications</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 my-0.5">
                                                <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5">
                                                    <User className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-sm font-bold">My Account</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            {['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'].includes(user.role) && (
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 my-0.5">
                                                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5">
                                                        <Crown className="h-4 w-4 text-[#FF6200]" />
                                                        <span className="text-sm font-bold text-[#FF6200]">Admin Panel</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}

                                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/50" />

                                            <DropdownMenuItem
                                                onClick={handleSignOut}
                                                className="rounded-xl cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 text-red-600 dark:text-red-400 my-0.5 hover:text-red-700 dark:hover:text-red-300"
                                            >
                                                <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                                                    <LogOut className="h-4 w-4" />
                                                    <span className="text-sm font-bold">Log out</span>
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
                            className="md:hidden h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-4 w-4 text-zinc-900 dark:text-white" /> : <Menu className="h-4 w-4 text-zinc-900 dark:text-white" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Slide-down Menu */}
            {mobileMenuOpen && (
                <div className="fixed top-16 left-0 right-0 z-[99] bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 flex flex-col gap-4 md:hidden shadow-xl">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold text-lg transition-colors p-2"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-3 mt-2">
                        {user ? (
                            <>
                                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-300 hover:text-white font-bold p-2">My Account</Link>
                                <button onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} className="text-red-500 font-bold text-left p-2">Log out</button>
                            </>
                        ) : (
                            <>
                                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-white font-black text-center text-sm uppercase tracking-widest shadow-md">
                                    Sign Up Free
                                </Link>
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-center text-sm">
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
