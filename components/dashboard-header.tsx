'use client';
import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, User, Bell, LogOut, Globe } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar, SidebarItem } from '@/components/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardHeaderProps {
    title: string;
    sidebarItems: SidebarItem[];
}

export function DashboardHeader({ title, sidebarItems }: DashboardHeaderProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-40 flex h-24 w-full items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-[#FAFAFA]/90 dark:bg-zinc-950/90 backdrop-blur-2xl px-6 md:px-12">
            <div className="flex items-center gap-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-background border-r border-border">
                        <Sidebar items={sidebarItems} title={title} className="border-0 shadow-none" />
                    </SheetContent>
                </Sheet>
                <div className="flex flex-col">
                    <h1 className="text-xl md:text-2xl font-black italic tracking-widest text-[#FF6200] uppercase">
                        {title}
                    </h1>
                    <span className="text-zinc-500 text-[10px] hidden md:block">
                        Active Identity: <span className="font-black text-foreground uppercase tracking-widest">{user?.displayName}</span> 
                        <span className="mx-2 opacity-20">|</span> 
                        Context: <span className="text-primary font-black uppercase tracking-widest text-[9px]">{pathname?.includes('/ceo') ? 'Executive Suite' : 'Operations Hub'}</span>
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
                <Link href="/" className="hidden md:flex items-center gap-3 text-zinc-500 hover:text-primary transition-all text-[10px] items-center uppercase font-black tracking-widest bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <Globe className="h-3 w-3" />
                    Marketplace Site
                </Link>

                <ThemeToggle />

                <div className="flex items-center gap-4 pl-6 border-l border-zinc-100">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="h-10 w-10 rounded-2xl bg-white border border-zinc-200 shadow-sm border-none flex items-center justify-center text-[#FF6200] shadow-[0_0_15px_rgba(255,184,0,0.1)] group cursor-pointer hover:scale-105 transition-transform">
                                <User className="h-5 w-5" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={15} className="w-64 bg-[#FAFAFA] border border-zinc-200 p-2 text-zinc-900 z-[999] rounded-[2rem] shadow-2xl backdrop-blur-3xl">
                            <div className="px-4 py-3 mb-2 border-b border-zinc-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Management Account</p>
                                <p className="text-sm font-black truncate uppercase">{user?.displayName}</p>
                            </div>
                            <DropdownMenuItem asChild className="focus:bg-white rounded-xl cursor-pointer py-3 group outline-none transition-colors border border-transparent focus:border-zinc-100">
                                <Link href="/settings" className="flex items-center gap-4 w-full px-2">
                                    <User className="h-4 w-4 text-zinc-500 group-hover:text-[#FF6200]" />
                                    <span className="font-bold uppercase text-[10px] tracking-widest text-zinc-500 group-hover:text-zinc-900">Account Settings</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}