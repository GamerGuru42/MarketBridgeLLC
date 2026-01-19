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
            <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Ambient glow effect behind logo */}
                <div className="absolute inset-0 bg-[#FF8A00]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <Image
                    src="/marketbridge_logo.png"
                    alt="MarketBridge"
                    width={48}
                    height={48}
                    className="relative z-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                    priority
                />
            </div>
        </Link>
    );
};
