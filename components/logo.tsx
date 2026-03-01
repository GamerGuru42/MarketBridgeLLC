import React from 'react';
import Link from 'next/link';

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
    const textSizeClasses = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
        xl: 'text-5xl',
    };

    return (
        <Link
            href="/"
            className={`flex items-center transition-transform active:scale-95 ${className}`}
        >
            {showText !== false && (
                <span className={`${textSizeClasses[size]} font-black tracking-tight`}>
                    <span className="text-zinc-900 dark:text-white">Market</span>
                    <span className="text-[#FF6200]">Bridge</span>
                </span>
            )}
        </Link>
    );
};