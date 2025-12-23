'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { TrendingUp, LayoutDashboard, MessageSquare, Zap } from 'lucide-react';

const ceoItems = [
    { label: 'Strategic Overview', href: '/ceo', icon: LayoutDashboard },
    { label: 'Market Intelligence', href: '/ceo/growth', icon: TrendingUp },
    { label: 'Proposals Queue', href: '/ceo', icon: Zap },
    { label: 'Vision Command', href: '/admin/executive-chat', icon: MessageSquare },
];

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CEOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && (!user || !['ceo', 'cofounder'].includes(user.role))) {
            router.push('/ceo/login');
        }
    }, [user, loading, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" /></div>;
    if (!user) return null;

    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block w-64 fixed h-full z-10">
                <Sidebar items={ceoItems} title="CEO Dashboard" />
            </div>
            <main className="flex-1 md:ml-64 p-8 bg-[#050505] text-white">
                {children}
            </main>
        </div>
    );
}
