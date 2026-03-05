'use client';

import { usePathname } from 'next/navigation';
import { AiAssistant } from '@/components/AiAssistant';
import { CookieConsent } from '@/components/CookieConsent';
import { AppTour } from '@/components/AppTour';

export function GlobalWidgets() {
    const pathname = usePathname();

    // Strictly hide interactive clutter on landing and auth screens
    const excludedPaths = ['/', '/login', '/signup', '/forgot-password'];
    if (excludedPaths.includes(pathname || '')) return null;

    return (
        <>
            <AiAssistant />
            <AppTour />
            <CookieConsent />
        </>
    );
}
