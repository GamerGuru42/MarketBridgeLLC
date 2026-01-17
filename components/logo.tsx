import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
                    className="w-8 h-8 relative z-10"
                >
                    <path
                        d="M8 82 Q 50 5, 92 82"
                        stroke="#FFB800"
                        strokeWidth="20"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M15 95 L 85 95"
                        stroke="#FFB800"
                        strokeWidth="12"
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
