'use client';

import { usePathname } from 'next/navigation';
import { AiAssistant } from '@/components/AiAssistant';
import { CookieConsent } from '@/components/CookieConsent';
import { AppTour } from '@/components/AppTour';

export function GlobalWidgets() {
    const pathname = usePathname();

    // Hide interactive clutter on auth screens
    const authPaths = ['/login', '/signup', '/forgot-password'];
    if (authPaths.includes(pathname || '')) return null;

    return (
        <>
            <AiAssistant />
            <AppTour />
            <CookieConsent />
        </>
    );
}
