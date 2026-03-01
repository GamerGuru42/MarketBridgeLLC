import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    showText = true
}) => {
    const textSizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl',
        xl: 'text-6xl',
    };

    return (
        <Link
            href="/"
            className={`group flex items-center gap-2 transition-transform active:scale-95 ${className}`}
        >
            {showText !== false && (
                <div className="flex items-center">
                    <span className={cn(textSizeClasses[size], "font-black text-white tracking-tighter italic")}>
                        Market
                    </span>
                    <span className={cn(textSizeClasses[size], "font-black text-[#FF6200] tracking-tighter italic")}>
                        Bridge
                    </span>
                </div>
            )}
        </Link>
    );
};