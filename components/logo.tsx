'use client';

import React from 'react';
import Link from 'next/link';
import { useSystem } from '@/contexts/SystemContext'

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    showText = true,
}) => {
    const { isDemoMode } = useSystem()

    const textSizeClasses = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
        xl: 'text-5xl',
    };

    const iconSizes = {
        sm: 24,
        md: 32,
        lg: 40,
        xl: 56,
    };

    return (
        <Link
            href="/"
            className={`flex flex-col items-start gap-0.5 transition-transform active:scale-95 ${className}`}
        >
            <div className="flex flex-col">
                <span className={`${textSizeClasses[size]} font-black tracking-tighter leading-none`}>
                    <span className="text-foreground">Market</span>
                    <span className="text-[#FF6200]">Bridge</span>
                </span>

            </div>
        </Link>
    );
};