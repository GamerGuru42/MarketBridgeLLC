'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AiAssistant } from '@/components/AiAssistant';
import { CookieConsent } from '@/components/CookieConsent';
import { AppTour } from '@/components/AppTour';

export function GlobalWidgets() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Hide interactive clutter on auth screens
    const authPaths = ['/login', '/signup', '/forgot-password'];
    if (authPaths.includes(pathname || '')) return null;

    // Only show Sage AI to logged-in buyers and sellers within the actual web app 
    const isPublicMarketingPage = ['/', '/ambassador'].includes(pathname || '');
    const isWebAppUser = user && ['buyer', 'seller', 'ambassador', 'student_buyer', 'student_seller', 'dealer', 'customer'].includes(user.role);
    const showSageAI = isWebAppUser && !isPublicMarketingPage;

    return (
        <>
            {showSageAI && <AiAssistant />}
            <AppTour />
            <CookieConsent />
        </>
    );
}
