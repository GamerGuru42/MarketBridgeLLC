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
                    {/* Double Arch Bridge Logo - Bolder & More Accurate */}
                    <path d="M10 75 Q 50 62 90 75" stroke="#FF8A00" strokeWidth="8" strokeLinecap="round" />

                    <path d="M30 70 V 45 C 30 30 48 30 48 45 V 70" stroke="#FF8A00" strokeWidth="11" strokeLinejoin="round" />
                    <line x1="36" y1="42" x2="36" y2="68" stroke="#FF8A00" strokeWidth="3" />
                    <line x1="42" y1="42" x2="42" y2="68" stroke="#FF8A00" strokeWidth="3" />

                    <path d="M52 70 V 45 C 52 30 70 30 70 45 V 70" stroke="#FF8A00" strokeWidth="11" strokeLinejoin="round" />
                    <line x1="58" y1="42" x2="58" y2="68" stroke="#FF8A00" strokeWidth="3" />
                    <line x1="64" y1="42" x2="64" y2="68" stroke="#FF8A00" strokeWidth="3" />
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
