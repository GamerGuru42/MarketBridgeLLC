import React from 'react';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
    return (
        <Link href="/" className={`flex items-center gap-2 ${className}`}>
            <div className="relative w-10 h-10">
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    {/* Black Swoosh */}
                    <path
                        d="M10 80 C 30 90, 70 90, 90 80"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="text-foreground"
                    />
                    {/* Orange Bridge Arches */}
                    <path
                        d="M20 80 Q 35 40, 50 80"
                        stroke="hsl(24, 95%, 53%)"
                        strokeWidth="6"
                        fill="none"
                    />
                    <path
                        d="M50 80 Q 65 40, 80 80"
                        stroke="hsl(24, 95%, 53%)"
                        strokeWidth="6"
                        fill="none"
                    />
                    {/* Connecting Line */}
                    <path
                        d="M20 80 L 80 80"
                        stroke="hsl(24, 95%, 53%)"
                        strokeWidth="2"
                    />
                </svg>
            </div>
            {showText && (
                <span className="font-bold text-xl tracking-tight">
                    MARKET<span className="text-primary">BRIDGE</span>
                </span>
            )}
        </Link>
    );
};
