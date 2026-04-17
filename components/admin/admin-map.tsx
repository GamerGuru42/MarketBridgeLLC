'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

export const AdminMap = () => {
    // Representative campus coordinates (normalized 0-100 for SVG viewbox)
    const nodes = [
        { name: "UNILAG", x: 15, y: 85, active: true },
        { name: "ABU Zaria", x: 45, y: 25, active: true },
        { name: "UNIBADAN", x: 20, y: 75, active: true },
        { name: "UNIPORT", x: 35, y: 92, active: true },
        { name: "UNIZIK", x: 42, y: 82, active: true },
        { name: "UNIABUJA", x: 40, y: 55, active: true },
        { name: "UNILORIN", x: 25, y: 60, active: true },
        { name: "FUTA", x: 28, y: 78, active: true },
    ];

    return (
        <div className="relative w-full h-[400px] bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
            
            <div className="absolute top-8 left-8 z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic mb-2">Network Ingress</h3>
                <p className="text-[20px] font-black uppercase tracking-tighter text-white italic font-heading">Geospatial Pulse</p>
            </div>

            <div className="absolute top-8 right-8 z-10 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Live Grid Synchronized</span>
            </div>

            <svg viewBox="0 0 100 100" className="w-full h-full p-12 opacity-40 group-hover:opacity-60 transition-opacity">
                {/* Simplified Nigeria Silhouette Path (Mock) */}
                <path 
                    d="M 10 70 Q 15 50 20 40 Q 30 20 50 15 Q 70 15 85 30 Q 95 60 90 80 Q 75 95 50 90 Q 25 95 10 75 Z" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    className="text-primary/20"
                />
                
                {/* Connections */}
                {nodes.map((node, i) => (
                    nodes.slice(i + 1).map((target, j) => (
                        <line 
                            key={`${i}-${j}`}
                            x1={node.x} y1={node.y} 
                            x2={target.x} y2={target.y} 
                            stroke="currentColor" 
                            strokeWidth="0.1" 
                            className="text-primary/10 animate-pulse"
                            style={{ animationDelay: `${(i+j) * 0.5}s` }}
                        />
                    ))
                ))}

                {/* Nodes */}
                {nodes.map((node, i) => (
                    <g key={i}>
                        <circle 
                            cx={node.x} cy={node.y} r="0.8" 
                            className="fill-primary"
                        />
                        <circle 
                            cx={node.x} cy={node.y} r="2" 
                            className="fill-primary/20 animate-ping"
                            style={{ animationDuration: '3s', animationDelay: `${i * 0.4}s` }}
                        />
                        <text 
                            x={node.x + 2} y={node.y + 0.5} 
                            className="text-[1px] font-bold fill-white/40 uppercase tracking-tighter"
                            style={{ fontSize: '1.2px' }}
                        >
                            {node.name}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Bottom Meta */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-10">
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Target Vector</p>
                    <p className="text-[12px] font-black text-white/80 uppercase italic tracking-widest">W-Africa / 001</p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Active Nodes</p>
                    <p className="text-[12px] font-black text-primary uppercase italic tracking-widest">08 Main Campus Hubs</p>
                </div>
            </div>
        </div>
    );
};
