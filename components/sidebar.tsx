'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { LogOut } from 'lucide-react';

interface SidebarItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface SidebarProps {
    items: SidebarItem[];
    title?: string;
    className?: string;
}

export function Sidebar({ items, title, className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-muted/10", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-6 px-4">
                        <Logo showText={true} />
                        {title && <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>}
                    </div>
                    <div className="space-y-1">
                        {items.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname === item.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-3 py-2 mt-auto absolute bottom-4 w-full border-t pt-4">
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Button>
            </div>
        </div>
    );
}
