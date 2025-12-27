import React from 'react';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
    return (
        <Link href="/" className={`flex items-center gap-2 ${className}`}>
            <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gold-gradient rounded-xl rotate-12 opacity-20 blur-sm group-hover:rotate-45 transition-transform duration-500" />
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7 relative z-10"
                >
                    <path
                        d="M10 80 Q 50 10, 90 80"
                        stroke="#FFB800"
                        strokeWidth="12"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M20 85 L 80 85"
                        stroke="#FFB800"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            {showText && (
                <span className="font-black text-xl tracking-tighter uppercase text-white">
                    MARKET <span className="text-[#FFB800] italic">BRIDGE</span>
                </span>
            )}
        </Link>
    );
};
