import React from 'react';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    hideText?: boolean;
    showText?: boolean;
    iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
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
            className={`group flex items-center transition-transform active:scale-95 ${className}`}
        >
            <span className={`${textSizeClasses[size]} font-black text-white tracking-[-0.05em]`}>
                Market
            </span>
            <span className={`${textSizeClasses[size]} font-black text-[#FF6200] tracking-[-0.05em]`}>
                Bridge
            </span>
        </Link>
    );
};