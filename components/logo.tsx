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
            <div className="flex items-center gap-1">
                <span className="text-2xl font-black text-white tracking-tighter">Market</span>
                <span className="text-2xl font-black text-[#FFB800] tracking-tighter">Bridge</span>
            </div>
        </Link>
    );
};
