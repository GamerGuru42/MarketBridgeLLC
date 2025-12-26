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
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-8">
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <Sidebar items={sidebarItems} title={title} className="border-0" />
                    </SheetContent>
                </Sheet>
                <h1 className="text-lg font-bold tracking-tight md:text-xl">{title}</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                </Button>

                <div className="flex items-center gap-3 pl-2 border-l ml-2">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-xs font-bold leading-none">{user?.displayName || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 border flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </header>
    );
}
