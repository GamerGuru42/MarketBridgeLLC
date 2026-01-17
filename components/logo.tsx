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
                <Image
                    src="/logo-icon.png"
                    alt="MarketBridge Logo"
                    width={40}
                    height={40}
                    className="w-8 h-8 relative z-10 object-contain"
                />
            </div>
            {showText && (
                <span className="font-black text-xl tracking-tighter uppercase text-white">
                    MARKET <span className="text-[#FFB800] italic">BRIDGE</span>
                </span>
            )}
        </Link>
    );
};
