import React from 'react';
import Link from 'next/link';
import { Waypoints } from 'lucide-react';
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

    const iconSizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-14 w-14',
    };

    return (
        <Link
            href="/"
            className={`group flex items-center gap-2 transition-transform active:scale-95 ${className}`}
        >
            <div className={cn(
                "flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6200] to-amber-500 shadow-[0_0_20px_rgba(255,98,0,0.3)] group-hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] transition-all group-hover:rotate-[10deg]",
                size === 'sm' ? 'p-1.5' : size === 'md' ? 'p-2' : size === 'lg' ? 'p-2.5' : 'p-4'
            )}>
                <Waypoints className={cn("text-black", iconSizeClasses[size])} strokeWidth={3} />
            </div>
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