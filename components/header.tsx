'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, User, LogOut, LayoutDashboard, Crown, MapPin } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
        "transition-colors relative after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#FFB800] after:rounded-full transition-all duration-300",
        isActive(path) ? "text-white after:opacity-100 scale-110" : "text-zinc-500 hover:text-white after:opacity-0"
    );

    return (
        <header className="sticky top-0 z-[100] w-full bg-black/50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center">
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo & Node */}
                <div className="flex items-center gap-4">
                    <Logo />
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-full cursor-pointer hover:bg-[#FFB800]/20 transition-all group" onClick={() => localStorage.removeItem('mb-preferred-node')}>
                        <div className="h-1.5 w-1.5 rounded-full bg-[#00FF85] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#FFB800]">{currentNode} Node</span>
                        <MapPin className="h-3 w-3 text-zinc-600 group-hover:text-[#FFB800] transition-colors" />
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em]">
                    <Link href="/" className={navLinkClass('/')}>HOME</Link>
                    <Link href="/listings" className={navLinkClass('/listings')}>LISTINGS</Link>
                    <Link href="/dealers" className={navLinkClass('/dealers')}>DEALERS</Link>
                    <Link href="/about" className={navLinkClass('/about')}>ABOUT</Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {!user && !loading && (
                        <div className="hidden lg:flex items-center gap-6">
                            <Link href="/login" className="text-white font-black text-[11px] uppercase tracking-widest hover:opacity-80 transition-opacity">
                                SIGN IN
                            </Link>
                            <Button asChild className="bg-gold-gradient text-black font-black uppercase tracking-widest px-8 rounded-full h-11 glow-on-hover border-none">
                                <Link href="/signup">SIGN UP</Link>
                            </Button>
                        </div>
                    )}

                    {user && (
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-11 w-11 rounded-full p-0 glass-border bg-white/5 hover:bg-white/10">
                                        <User className="h-5 w-5 text-zinc-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={12} className="w-56 glass-card border-white/10 p-2 text-white z-[150] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="px-3 py-2 mb-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Session active</p>
                                        <p className="text-sm font-bold truncate">{user.displayName}</p>
                                    </div>
                                    <DropdownMenuItem asChild className="focus:bg-white/10 rounded-xl cursor-pointer">
                                        <Link href="/settings" className="flex items-center gap-3 py-2.5">
                                            <User className="h-4 w-4 text-[#FFB800]" />
                                            <span className="font-bold uppercase text-[10px] tracking-widest">Operational Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    {user.role === 'dealer' && (
                                        <DropdownMenuItem asChild className="focus:bg-white/10 rounded-xl cursor-pointer text-[#FFB800]">
                                            <Link href="/dealer/dashboard" className="flex items-center gap-3 py-2.5">
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span className="font-bold uppercase text-[10px] tracking-widest">Dealer Command</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'].includes(user.role) && (
                                        <DropdownMenuItem asChild className="focus:bg-white/10 rounded-xl cursor-pointer text-[#FFB800]">
                                            <Link href="/admin" className="flex items-center gap-3 py-2.5 font-bold">
                                                <Crown className="h-4 w-4" /> Vision Command
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={handleSignOut} className="focus:bg-red-500/10 text-red-500 rounded-xl cursor-pointer">
                                        <span className="flex items-center gap-3 py-2.5">
                                            <LogOut className="h-4 w-4" /> Terminate Session
                                        </span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 glass-border bg-white/5 hover:bg-white/10">
                                <Menu className="h-5 w-5 text-white" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full bg-black border-l border-white/5 p-8 flex flex-col">
                            <div className="flex justify-between items-center mb-16">
                                <Logo />
                            </div>

                            <nav className="flex flex-col gap-8 text-2xl font-black uppercase tracking-tighter italic">
                                <Link
                                    href="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(isActive('/') ? "text-[#FFB800]" : "text-white/60")}
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/listings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(isActive('/listings') ? "text-[#FFB800]" : "text-white/60")}
                                >
                                    Listings
                                </Link>
                                <Link
                                    href="/dealers"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(isActive('/dealers') ? "text-[#FFB800]" : "text-white/60")}
                                >
                                    Dealers
                                </Link>
                                <Link
                                    href="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(isActive('/about') ? "text-[#FFB800]" : "text-white/60")}
                                >
                                    About
                                </Link>
                            </nav>

                            <div className="mt-auto flex flex-col gap-4">
                                {!user ? (
                                    <>
                                        <Button asChild className="h-16 rounded-3xl bg-gold-gradient text-black font-black uppercase tracking-widest border-none">
                                            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Establish Account</Link>
                                        </Button>
                                        <Button variant="outline" asChild className="h-16 rounded-3xl bg-transparent border-white/20 text-white font-black uppercase tracking-widest">
                                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleSignOut} className="h-16 rounded-3xl bg-red-600 text-white font-black uppercase tracking-widest border-none">
                                        Terminate Session
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};
