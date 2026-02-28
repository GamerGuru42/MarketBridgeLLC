import React from 'react';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Hide the "MarketBridge" wordmark — shows icon only */
    hideText?: boolean;
    /** showText={false} = icon only mode (backward compat) */
    showText?: boolean;
    /** iconOnly={true} = same as hideText */
    iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    hideText = false,
    iconOnly = false,
    showText,
}) => {
    // showText={false} → icon only. If showText is explicitly false, treat as icon-only.
    const showOnlyIcon = hideText || iconOnly || showText === false;

    const iconPixels = {
        sm: 28,
        md: 36,
        lg: 48,
        xl: 72,
    };

    const textSizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl',
        xl: 'text-6xl',
    };

    const px = iconPixels[size];

    return (
        <Link
            href="/"
            className={`group flex items-center gap-2 transition-transform active:scale-95 ${className}`}
        >
            {/* SVG arch icon — perfectly transparent on any background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/favicon.svg"
                alt="MarketBridge logo"
                width={px}
                height={px}
                className="shrink-0 drop-shadow-[0_0_8px_rgba(255,98,0,0.5)] group-hover:drop-shadow-[0_0_14px_rgba(255,98,0,0.75)] transition-all"
                style={{ width: px, height: px }}
            />

            {!showOnlyIcon && (
                <div className="flex items-center">
                    <span className={`${textSizeClasses[size]} font-black text-white tracking-[-0.05em]`}>
                        Market
                    </span>
                    <span className={`${textSizeClasses[size]} font-black text-[#FF6200] tracking-[-0.05em]`}>
                        Bridge
                    </span>
                </div>
            )}
        </Link>
    );
};