'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
    src: string | null | undefined;
    fallbackIcon?: React.ReactNode;
}

export function ImageWithFallback({
    src,
    alt,
    className,
    fallbackIcon,
    ...props
}: ImageWithFallbackProps) {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const showFallback = !src || error;

    if (showFallback) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-zinc-900 border border-white/5", className)}>
                {fallbackIcon || <ImageIcon className="h-8 w-8 text-zinc-700" />}
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-2">No Visual</span>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {isLoading && (
                <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center z-0">
                    <div className="w-full h-full bg-zinc-800/50" />
                </div>
            )}
            <Image
                src={src as string}
                alt={alt}
                className={cn(
                    "transition-opacity duration-500 relative z-10",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => {
                    setError(true);
                    setIsLoading(false);
                }}
                {...props}
            />
        </div>
    );
}
