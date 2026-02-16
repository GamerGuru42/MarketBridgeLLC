'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const SubscriptionCheckoutContent = dynamic(
    () => import('@/components/checkout/SubscriptionCheckoutContent'),
    { ssr: false }
);

export default function SubscriptionCheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6600]" />
            </div>
        }>
            <SubscriptionCheckoutContent />
        </Suspense>
    );
}
