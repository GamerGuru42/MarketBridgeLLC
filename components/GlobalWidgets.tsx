'use client';

import { usePathname } from 'next/navigation';
import { AiAssistant } from '@/components/AiAssistant';
import { CookieConsent } from '@/components/CookieConsent';

export function GlobalWidgets() {
    const pathname = usePathname();

    // Strictly hide interactive clutter on the choice screen
    if (pathname === '/') return null;

    return (
        <>
            <AiAssistant />
            <CookieConsent />
        </>
    );
}
