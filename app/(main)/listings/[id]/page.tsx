'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ListingDetailContent = dynamic(
    () => import('@/components/listings/ListingDetailContent'),
    { ssr: false }
);

export default function ListingDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-zinc-900">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" />
            </div>
        }>
            <ListingDetailContent />
        </Suspense>
    );
}
