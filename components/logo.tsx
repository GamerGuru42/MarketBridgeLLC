import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
    return (
        <Link href="/" className={`group flex items-center transition-transform active:scale-95 ${className}`}>
            <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Ambient glow effect behind logo */}
                <div className="absolute inset-0 bg-[#FF8A00]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <Image
                    src="/marketbridge_logo.png"
                    alt="MarketBridge"
                    width={64}
                    height={64}
                    className="relative z-10 object-contain drop-shadow-[0_4px_20px_rgba(255,184,0,0.6)] scale-110"
                    priority
                />
            </div>
        </Link>
    );
};
