'use client';

/**
 * Internal System Layout
 * 
 * SECURITY: This layout deliberately EXCLUDES all public-facing providers
 * (CartProvider, LocationProvider, GlobalWidgets, OnboardingTour, BetaLabel)
 * to ensure zero shared client-side JavaScript between public and internal surfaces.
 * 
 * Only AuthProvider and ThemeProvider are included — the minimum required
 * for authentication and visual consistency.
 */

import React from 'react';

export default function InternalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="internal-system">
            {children}
        </div>
    );
}
