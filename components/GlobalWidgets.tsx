'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AiAssistant } from '@/components/AiAssistant';
import { CookieConsent } from '@/components/CookieConsent';
import { AppTour } from '@/components/AppTour';

export function GlobalWidgets() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Hide interactive clutter on admin/portal paths
    const isAdminPath = pathname?.startsWith('/admin') || pathname?.startsWith('/portal');
    if (isAdminPath) return null;

    // Hide interactive clutter on auth screens
    const authPaths = ['/login', '/signup', '/forgot-password'];
    if (authPaths.includes(pathname || '')) return null;

    // Enable Sage AI globally (Hidden on admin routes)
    const showSageAI = true;

    return (
        <>
            {showSageAI && <AiAssistant />}
            <AppTour />
            <CookieConsent />
        </>
    );
}
