'use client';

import React from 'react';
import { MapPin, Users, Globe } from 'lucide-react';

interface AdminMapProps {
    distribution?: Record<string, number>;
    buyerCount?: number;
}

export const AdminMap = ({ distribution = {}, buyerCount = 0 }: AdminMapProps) => {
    // Official Abuja campus relative coordinates for a zoomed-in FCT view
    // Normalized to 0-100 viewBox
    const CAMPUS_DATA = [
        { id: 'baze', name: "Baze University", x: 75, y: 45 },
        { id: 'nile', name: "Nile University", x: 65, y: 55 },
        { id: 'veritas', name: "Veritas University", x: 60, y: 15 },
        { id: 'uniabuja', name: "University of Abuja", x: 20, y: 65 },
        { id: 'cosmopolitan', name: "Cosmopolitan", x: 80, y: 50 },
    ];

    // Filter to only campuses that have active onboarded sellers
    const activeNodes = CAMPUS_DATA.map(campus => ({
        ...campus,
        count: distribution[campus.name] || 0,
        active: (distribution[campus.name] || 0) > 0
    })).filter(n => n.active);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="relative w-full h-[450px] bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
                
                {/* Header info */}
                <div className="absolute top-10 left-10 z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic mb-3">Live Fleet Analytics</h3>
                    <p className="text-[24px] font-black uppercase tracking-tighter text-white italic font-heading">Onboarded <span className="text-primary italic">Sellers</span></p>
                </div>

                <div className="absolute top-10 right-10 z-10 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/5 px-5 py-2.5 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60 font-medium">Abuja Live Stream</span>
                </div>

                {/* SVG Visualizer */}
                <svg viewBox="0 0 100 100" className="w-full h-full p-16 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                    {/* FCT Region Abstract Boundary */}
                    <path 
                        d="M 15 50 Q 25 20 50 15 Q 85 15 90 45 Q 95 80 70 90 Q 30 95 10 75 Z" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="0.3" 
                        className="text-primary/10"
                    />
                    
                    {/* Activity Grid Points (Subtle) */}
                    {[...Array(5)].map((_, i) => (
                        <line key={i} x1="0" y1={i * 25} x2="100" y2={i * 25} stroke="#ffffff" strokeWidth="0.05" opacity="0.05" />
                    ))}
                    {[...Array(5)].map((_, i) => (
                        <line key={i} x1={i * 25} y1="0" x2={i * 25} y2="100" stroke="#ffffff" strokeWidth="0.05" opacity="0.05" />
                    ))}

                    {/* Node Connections */}
                    {activeNodes.map((node, i) => (
                        activeNodes.slice(i + 1).map((target, j) => (
                            <line 
                                key={`${i}-${j}`}
                                x1={node.x} y1={node.y} 
                                x2={target.x} y2={target.y} 
                                stroke="currentColor" 
                                strokeWidth="0.15" 
                                className="text-primary/10 animate-pulse"
                                style={{ animationDelay: `${(i+j) * 0.4}s` }}
                            />
                        ))
                    ))}

                    {/* Active Hubs */}
                    {activeNodes.map((node, i) => {
                        const baseSize = 1;
                        const scale = Math.min(2, 1 + (node.count * 0.1)); // Scale with count
                        
                        return (
                            <g key={i}>
                                <circle 
                                    cx={node.x} cy={node.y} r={baseSize * scale} 
                                    className="fill-primary shadow-2xl"
                                />
                                <circle 
                                    cx={node.x} cy={node.y} r={baseSize * scale * 2.5} 
                                    className="fill-primary/20 animate-ping"
                                    style={{ animationDuration: '4s', animationDelay: `${i * 0.3}s` }}
                                />
                                <text 
                                    x={node.x + (baseSize * scale * 2)} y={node.y + 0.5} 
                                    className="fill-white/80 font-black uppercase tracking-widest text-[2px] italic select-none"
                                >
                                    {node.name}
                                </text>
                                <text 
                                    x={node.x + (baseSize * scale * 2)} y={node.y + 2.5} 
                                    className="fill-primary font-black text-[1.5px] uppercase italic tracking-[0.2em] select-none"
                                >
                                    {node.count} SELLERS
                                </text>
                            </g>
                        );
                    })}

                    {/* Placeholder if empty */}
                    {activeNodes.length === 0 && (
                        <text x="50" y="55" textAnchor="middle" className="fill-white/20 font-black italic uppercase tracking-[0.5em] text-[3px]">
                            Awaiting Onboarding...
                        </text>
                    )}
                </svg>

                {/* Bottom Meta Labels */}
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end z-10">
                    <div className="space-y-1.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Primary Market Zone</p>
                        <p className="text-[14px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" /> Abuja FCT
                        </p>
                    </div>
                    <div className="text-right space-y-1.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Coverage Index</p>
                        <p className="text-[14px] font-black text-primary uppercase italic tracking-[0.2em]">
                            {activeNodes.length} / {CAMPUS_DATA.length} Campus Hubs
                        </p>
                    </div>
                </div>
            </div>

            {/* Buyer Counter Panel (Requested beneath map) */}
            <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:bg-primary/10 transition-colors">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">Platform Connectivity</h4>
                    <div className="flex items-baseline gap-2 justify-center">
                        <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground font-heading">
                            {buyerCount.toLocaleString()}
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-primary italic">Live Buyers</span>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Aggregate across all Abuja campuses</p>
                </div>
            </div>
        </div>
    );
};
