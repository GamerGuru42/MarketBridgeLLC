'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const BetaBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 15 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 15000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-4"
                >
                    <div className="bg-zinc-900/90 backdrop-blur-md border border-[#FF6600]/30 text-white py-3 px-4 rounded-full shadow-2xl flex items-center gap-4 max-w-2xl pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6600] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6600]"></span>
                            </span>

                            <div className="overflow-hidden w-[200px] sm:w-[300px] md:w-[400px]">
                                <div className="animate-marquee whitespace-nowrap text-xs font-bold uppercase tracking-wider text-zinc-300">
                                    <span className="text-[#FF6600] mr-2">Market Notice:</span>
                                    Listings are samples for demonstration. Real inventory incoming.
                                    <span className="mx-4 text-zinc-600">///</span>
                                    <span className="text-[#FF6600] mr-2">Market Notice:</span>
                                    Listings are samples for demonstration. Real inventory incoming.
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsVisible(false)}
                            className="h-6 w-6 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
