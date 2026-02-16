'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListIcon, ShoppingCart, User, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const { itemCount } = useCart();

    // Don't show on certain pages
    const isProtectedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/dealer');
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
            href: '/listings',
            label: 'Listings',
            icon: ListIcon,
            show: true,
        },
        {
            href: '/cart',
            label: 'Cart',
            icon: ShoppingCart,
            show: ['customer', 'student_buyer'].includes(user?.role as any) || !user,
            badge: itemCount,
        },
        {
            href: (() => {
                if (!user) return '/login';
                const role = user.role;
                if (role === 'ceo') return '/ceo';
                if (role === 'cofounder') return '/cofounder';
                if (role === 'cto') return '/cto';
                if (role === 'coo') return '/coo';
                if (role === 'marketing_admin') return '/admin/marketing';
                if (['operations_admin', 'head_of_operations_admin'].includes(role)) return '/admin/operations';
                if (role === 'technical_admin') return '/admin/technical';
                if (['admin', 'super_admin'].includes(role)) return '/admin';
                if (['dealer', 'student_seller'].includes(role)) return '/dealer/dashboard';
                return '/orders';
            })(),
            label: (user && ['ceo', 'cofounder', 'cto', 'coo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'head_of_operations_admin', 'super_admin'].includes(user.role)) ? 'Command' : (user ? 'Account' : 'Login'),
            icon: (user && ['ceo', 'cofounder', 'cto', 'coo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'head_of_operations_admin', 'super_admin'].includes(user.role)) ? Crown : User,
            show: true,
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] glass-card rounded-[2rem] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-20 px-8">
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
                                isActive ? "text-[#FF6600] scale-110" : "text-zinc-600 hover:text-white"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("h-6 w-6", isActive ? "drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" : "")} />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-2 -right-3 h-4 w-4 rounded-full bg-[#FF6600] text-[9px] font-black text-black flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest italic">{item.label}</span>

                            {isActive && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF6600] rounded-full shadow-[0_0_8px_#FF6600]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
