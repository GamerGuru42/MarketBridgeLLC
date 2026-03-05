'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export interface SidebarItem {
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
    const { logout } = useAuth();

    return (
        <div className={cn("pb-12 min-h-screen border-r border-border bg-card/60 backdrop-blur-2xl flex flex-col transition-colors duration-300", className)}>
            <div className="space-y-10 py-10 px-8">
                <div className="px-2">
                    <div className="mb-14">
                        <Logo showText={true} className="scale-110" />
                        {title && (
                            <p className="mt-6 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] italic text-center">
                                // {title}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        {items.map((item) => {
                            const isExact = pathname === item.href;
                            const isSubPath = pathname?.startsWith(item.href) && item.href !== '/' && item.href !== '/admin' && item.href !== '/ceo' && item.href !== '/seller/dashboard';
                            const isActive = isExact || isSubPath;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(255,98,0,0.25)]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-full opacity-80" />
                                    )}
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-transform group-hover:scale-110",
                                        isActive ? "text-primary-foreground" : "text-muted-foreground opacity-70 group-hover:opacity-100"
                                    )} />
                                    <span className="text-[11px] font-black uppercase tracking-widest italic truncate">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-auto px-10 py-10 border-t border-border">
                <button
                    className="flex items-center gap-5 w-full px-4 py-4 text-muted-foreground hover:text-red-500 transition-all duration-300 group rounded-2xl hover:bg-red-500/5 active:scale-95"
                    onClick={() => logout()}
                >
                    <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Terminate</span>
                </button>
            </div>
        </div>
    );
}