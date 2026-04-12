import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
            <Image
                src="/marketbridge_logo.png"
                alt="MarketBridge"
                width={iconSizes[size]}
                height={iconSizes[size]}
                className="rounded-lg"
                priority
            />
            {showText !== false && (
                <span className={`${textSizeClasses[size]} font-black tracking-tight`}>
                    <span className="text-foreground">Market</span>
                    <span className="text-[#FF6200]">Bridge</span>
                </span>
            )}
        </Link>
    );
};