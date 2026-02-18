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
        <div className={cn("pb-12 min-h-screen border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col", className)}>
            <div className="space-y-8 py-8 px-6">
                <div className="px-3">
                    <div className="mb-12">
                        <Logo showText={true} />
                        {title && (
                            <p className="mt-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] italic text-center">
                                // {title}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        {items.map((item) => {
                            // Smart Active Logic:
                            // 1. Exact match takes precedence
                            // 2. If no exact match, check checking for sub-paths (e.g. /admin/users/123 matches /admin/users)
                            // 3. Prevent root path '/' or '/admin' from matching everything unless exactly on it

                            const isExact = pathname === item.href;
                            const isSubPath = pathname?.startsWith(item.href) && item.href !== '/' && item.href !== '/admin' && item.href !== '/ceo' && item.href !== '/seller/dashboard';

                            // To prevent multiple highlights, we prioritize exact matches.
                            // If we are on a subpath, we ensure we don't highlight the parent dashboard if a more specific link exists?
                            // Actually, with the exclusion list above (admin, ceo, dealer/dashboard), we prevent the "Overview" links from lighting up on subpages.
                            // This assumes "Overview" links are the "roots" of those sections.

                            const isActive = isExact || isSubPath;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                                        isActive
                                            ? "bg-white/5 text-[#FF6600] shadow-[0_0_20px_rgba(255,184,0,0.05)]"
                                            : "text-zinc-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FF6600] rounded-full shadow-[0_0_10px_#FF6600]" />
                                    )}
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-transform group-hover:scale-110",
                                        isActive ? "text-[#FF6600]" : "text-zinc-700"
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

            <div className="mt-auto px-8 py-8 border-t border-white/5">
                <button
                    className="flex items-center gap-4 w-full px-4 py-3 text-zinc-600 hover:text-red-500 transition-colors group"
                    onClick={() => logout()}
                >
                    <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-widest italic">Terminate</span>
                </button>
            </div>
        </div>
    );
}
