'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Menu, User, LogOut, LayoutDashboard, Package, Shield, Crown, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export const Header = () => {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    return (
        <header className="fixed top-0 z-[100] w-full bg-black/50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center">
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-white font-black text-xl tracking-tighter uppercase group-hover:opacity-80 transition-opacity">
                        Market <span className="text-[#FFB800] italic">Bridge</span>
                    </span>
                    <span className="text-[10px] font-black bg-[#FFB800] text-black px-1.5 py-0.5 rounded leading-none">BETA</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em]">
                    <Link href="/" className="text-white hover:text-[#FFB800] transition-colors relative after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#FFB800] after:rounded-full after:opacity-100">Home</Link>
                    <Link href="/listings" className="text-zinc-400 hover:text-white transition-colors">Listings</Link>
                    <Link href="/dealers" className="text-zinc-400 hover:text-white transition-colors">Dealers</Link>
                    <Link href="/about" className="text-zinc-400 hover:text-white transition-colors">About</Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {!user && !loading && (
                        <div className="hidden lg:flex items-center gap-6">
                            <Link href="/login" className="text-white font-black text-[11px] uppercase tracking-widest hover:opacity-80 transition-opacity">
                                Sign in
                            </Link>
                            <Button asChild className="bg-gold-gradient text-black font-black uppercase tracking-widest px-8 rounded-full h-11 glow-on-hover border-none">
                                <Link href="/signup">Sign up</Link>
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
                                <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 p-2 mt-4 text-white">
                                    <div className="px-3 py-2 mb-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Session active</p>
                                        <p className="text-sm font-bold truncate">{user.displayName}</p>
                                    </div>
                                    <DropdownMenuItem asChild className="focus:bg-white/10 rounded-xl cursor-pointer">
                                        <Link href="/settings" className="flex items-center gap-3 py-2.5">
                                            <User className="h-4 w-4" /> Profile Status
                                        </Link>
                                    </DropdownMenuItem>
                                    {user.role === 'dealer' && (
                                        <DropdownMenuItem asChild className="focus:bg-white/10 rounded-xl cursor-pointer text-[#FFB800]">
                                            <Link href="/dealer/dashboard" className="flex items-center gap-3 py-2.5">
                                                <LayoutDashboard className="h-4 w-4" /> Dealer Command
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {['ceo', 'cofounder'].includes(user.role) && (
                                        <DropdownMenuItem asChild className="focus:bg-white/10 rounded-xl cursor-pointer text-[#FFB800]">
                                            <Link href="/ceo" className="flex items-center gap-3 py-2.5 font-bold">
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
                                <span className="text-white font-black text-xl tracking-tighter uppercase">
                                    Market <span className="text-[#FFB800] italic">Bridge</span>
                                </span>
                            </div>

                            <nav className="flex flex-col gap-8 text-2xl font-black uppercase tracking-tighter italic">
                                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-[#FFB800]">Home</Link>
                                <Link href="/listings" onClick={() => setMobileMenuOpen(false)} className="text-white/60">Listings</Link>
                                <Link href="/dealers" onClick={() => setMobileMenuOpen(false)} className="text-white/60">Dealers</Link>
                                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-white/60">About</Link>
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
