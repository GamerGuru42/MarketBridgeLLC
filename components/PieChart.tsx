'use client';

import React, { useState } from 'react';

interface DataItem {
    name: string;
    value: number;
    color: string;
}

interface PieChartProps {
    data: DataItem[];
    size?: number;
}

export function PieChart({ data, size = 300 }: PieChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const center = size / 2;
    const radius = size / 2 - 20; // Padding for glow

    let currentAngle = 0;

    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((item, index) => {
                    const angle = (item.value / total) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle += angle;

                    // Calculate path
                    const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

                    const largeArcFlag = angle > 180 ? 1 : 0;

                    const pathData = [
                        `M ${center} ${center}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z',
                    ].join(' ');

                    const isHovered = hoveredIndex === index;

                    return (
                        <path
                            key={item.name}
                            d={pathData}
                            fill={item.color}
                            stroke="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            style={{
                                filter: isHovered ? `drop-shadow(0 0 15px ${item.color})` : 'none',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                transformOrigin: 'center',
                                opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}
                {/* Inner circle for donut chart look (optional, but looks premium) */}
                <circle cx={center} cy={center} r={radius * 0.6} fill="hsl(var(--card))" />

                {/* Center Text */}
                <text
                    x={center}
                    y={center}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground font-bold text-lg"
                >
                    {hoveredIndex !== null ? data[hoveredIndex].name : 'Total'}
                </text>
                <text
                    x={center}
                    y={center + 25}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-sm"
                >
                    {hoveredIndex !== null
                        ? `₦${data[hoveredIndex].value.toLocaleString()}`
                        : `₦${total.toLocaleString()}`
                    }
                </text>
            </svg>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                {data.map((item, index) => (
                    <div
                        key={item.name}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${hoveredIndex === index ? 'bg-muted/50 scale-105' : ''}`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div
                            className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]"
                            style={{ backgroundColor: item.color, color: item.color }}
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {((item.value / total) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
