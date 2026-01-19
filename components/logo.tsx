import React from 'react';
import Link from 'next/link';

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

                <svg
                    viewBox="0 0 400 320"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                >
                    <defs>
                        <linearGradient id="logoArchGradient" x1="0" y1="0" x2="400" y2="320" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FFB800" />
                            <stop offset="0.5" stopColor="#FF8A00" />
                            <stop offset="1" stopColor="#E65100" />
                        </linearGradient>
                        <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                            <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
                            <feComposite in="SourceGraphic" in2="offsetBlur" operator="out" result="glow" />
                        </filter>
                    </defs>

                    {/* Base Foundation Arc */}
                    <path
                        d="M40 240C150 190 250 190 360 240"
                        stroke="url(#logoArchGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="opacity-80"
                    />

                    {/* Left Arch - Precision curved to match provided identity */}
                    <path
                        d="M60 230C60 50 195 50 195 230"
                        stroke="url(#logoArchGradient)"
                        strokeWidth="52"
                        strokeLinecap="butt"
                    />
                    {/* Highlight layer for 3D effect */}
                    <path
                        d="M75 220C75 70 180 70 180 220"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="opacity-20"
                    />

                    {/* Right Arch - Mirrored with slight overlap for structural continuity */}
                    <path
                        d="M205 230C205 50 340 50 340 230"
                        stroke="url(#logoArchGradient)"
                        strokeWidth="52"
                        strokeLinecap="butt"
                    />
                    {/* Highlight layer for 3D effect */}
                    <path
                        d="M220 220C220 70 325 70 325 220"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="opacity-20"
                    />
                </svg>
            </div>
        </Link>
    );
};
