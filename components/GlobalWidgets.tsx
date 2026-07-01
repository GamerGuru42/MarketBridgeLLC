'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CookieConsent } from '@/components/CookieConsent';


export function GlobalWidgets() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Hide interactive clutter on admin/portal paths
    const isAdminPath = pathname?.startsWith('/admin') || pathname?.startsWith('/portal');
    if (isAdminPath) return null;

    // Hide interactive clutter on auth screens
    const authPaths = ['/login', '/signup', '/forgot-password'];
    if (authPaths.includes(pathname || '')) return null;

    return (
        <>
            <CookieConsent />
        </>
    );
}
