'use client';

import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, User, Bell } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
    title: string;
    sidebarItems: any[];
}

export function DashboardHeader({ title, sidebarItems }: DashboardHeaderProps) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-40 flex h-24 w-full items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-2xl px-6 md:px-12">
            <div className="flex items-center gap-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-white">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-black border-r border-white/10">
                        <Sidebar items={sidebarItems} title={title} className="border-0 shadow-none" />
                    </SheetContent>
                </Sheet>
                <h1 className="text-xl md:text-2xl font-black italic tracking-widest text-[#FFB800] uppercase">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
                <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-[#FFB800] transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5 rounded-full bg-[#FF8A00] animate-pulse"></span>
                </Button>

                <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-[11px] font-black text-white uppercase italic tracking-wider">
                            {user?.displayName || 'Authorized User'}
                        </span>
                        <span className="text-[9px] text-[#FFB800] font-black uppercase tracking-[0.2em] mt-1 italic">
                            {user?.role?.replace('_', ' ')} unit
                        </span>
                    </div>
                    <div className="h-10 w-10 rounded-2xl glass-card border-none flex items-center justify-center text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.1)] group cursor-pointer hover:scale-105 transition-transform">
                        <User className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
