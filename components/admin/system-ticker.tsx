'use client';

import React from 'react';
import { Activity, Zap, Shield, TrendingUp, Users, ShoppingBag } from 'lucide-react';

export const SystemTicker = () => {
    const items = [
        { icon: Activity, text: "PLATFORM STATUS: HEALTHY", color: "text-green-500" },
        { icon: Zap, text: "AVERAGE LOAD TIME: 0.8S", color: "text-primary" },
        { icon: Shield, text: "SECURITY: ENCRYPTED", color: "text-blue-500" },
        { icon: TrendingUp, text: "DAILY GROWTH: +12%", color: "text-green-400" },
        { icon: Users, text: "NEW USER REGISTERED: ABJ-UNIT", color: "text-primary" },
        { icon: ShoppingBag, text: "PAYMENT PROCESSING: STABLE", color: "text-orange-500" },
    ];

    return (
        <div className="w-full bg-black/40 backdrop-blur-md border-y border-white/5 py-3 overflow-hidden whitespace-nowrap relative">
            <div className="flex animate-marquee gap-12 items-center">
                {/* Double for continuous scroll effect */}
                {[...items, ...items, ...items].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 shrink-0">
                        <item.icon className={`h-3 w-3 ${item.color}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                            {item.text}
                        </span>
                        <span className="text-white/10 mx-4">//</span>
                    </div>
                ))}
            </div>
            
            {/* Gradient Fades */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
            `}</style>
        </div>
    );
};
