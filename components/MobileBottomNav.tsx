'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, User, Crown, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const { itemCount } = useCart();

    // Don't show on certain pages
    const isProtectedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/seller');
    if (isProtectedPath) {
        return null;
    }

    const navItems = [
        {
            href: '/',
            label: 'Home',
            icon: Home,
            show: true,
        },
        {
            href: '/marketplace',
            label: 'Market',
            icon: ShoppingBag,
            show: true,
        },
        {
            href: '/chats',
            label: 'Chats',
            icon: MessageCircle,
            show: !!user,
        },
        {
            href: '/cart',
            label: 'Cart',
            icon: ShoppingCart,
            show: (user?.role === 'student_buyer') || !user,
            badge: itemCount,
        },
        {
            href: (() => {
                if (!user) return '/login';
                const role = user.role;
                if (role === 'ceo') return '/admin/ceo';
                if (role === 'operations_admin') return '/admin/operations';
                if (role === 'marketing_admin') return '/admin/marketing';
                if (role === 'systems_admin' || role === 'technical_admin') return '/admin/systems';
                if (role === 'it_support') return '/admin/it-support';
                if (role === 'student_seller') return '/seller/dashboard';
                return '/orders';
            })(),
            label: (user && ['ceo', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support', 'technical_admin', 'admin'].includes(user.role)) ? 'Command' : (user ? 'Account' : 'Login'),
            icon: (user && ['ceo', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support', 'technical_admin', 'admin'].includes(user.role)) ? Crown : User,
            show: true,
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] bg-white rounded-[2rem] border border-zinc-200 shadow-lg shadow-black/5 h-20 px-8">
            <div className="flex h-full items-center justify-between">
                {navItems.filter(item => item.show).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all relative group",
                                isActive ? "text-[#FF6200] scale-110" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("h-6 w-6", isActive ? "drop-shadow-[0_2px_4px_rgba(255,184,0,0.3)]" : "")} />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-2 -right-3 h-4 w-4 rounded-full bg-[#FF6200] text-[9px] font-black text-white flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest italic">{item.label}</span>

                            {isActive && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF6200] rounded-full shadow-[0_0_8px_#FF6200]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
