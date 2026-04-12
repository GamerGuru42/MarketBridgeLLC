import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
            className={`flex items-center gap-2 transition-transform active:scale-95 ${className}`}
        >
            <div className="relative">
                <Image
                    src="/marketbridge_logo.png"
                    alt="MarketBridge"
                    width={iconSizes[size]}
                    height={iconSizes[size]}
                    className="rounded-lg"
                    priority
                />
                {isDemoMode && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6200]"></span>
                    </span>
                )}
            </div>
            {showText !== false && (
                <div className="flex flex-col">
                    <span className={`${textSizeClasses[size]} font-black tracking-tight leading-none`}>
                        <span className="text-foreground">Market</span>
                        <span className="text-[#FF6200]">Bridge</span>
                    </span>
                    {isDemoMode && <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#FF6200] mt-1 italic">Live Demo</span>}
                </div>
            )}
        </Link>
    );
};