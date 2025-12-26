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
    if (pathname?.includes('/admin') || pathname?.includes('/ceo') || pathname?.includes('/cofounder')) {
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
            label: 'Browse',
            icon: ListIcon,
            show: true,
        },
        {
            href: '/cart',
            label: 'Cart',
            icon: ShoppingCart,
            show: user?.role === 'customer',
            badge: itemCount,
        },
        {
            href: user?.role === 'ceo' ? '/ceo' : (user?.role === 'dealer' ? '/dealer/dashboard' : '/orders'),
            label: user?.role === 'ceo' ? 'Dashboard' : (user ? 'Account' : 'Login'),
            icon: user?.role === 'ceo' ? Crown : User,
            show: true,
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
            <div className="grid grid-cols-4 h-16">
                {navItems.filter(item => item.show).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
