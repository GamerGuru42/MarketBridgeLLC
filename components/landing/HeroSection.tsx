'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Smartphone, Shirt, Book, Headphones, Zap, MousePointer2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const items = [
    { icon: Smartphone, label: 'MacBook Pro', price: '₦2.1M', rotation: -6, color: 'bg-zinc-900', top: '10%', left: '10%' },
    { icon: Shirt, label: 'Nike Dunk', price: '₦45k', rotation: 12, color: 'bg-black', top: '30%', left: '60%' },
    { icon: Headphones, label: 'Sony XM5', price: '₦350k', rotation: -3, color: 'bg-zinc-800', top: '60%', left: '20%' },
    { icon: Book, label: 'Anatomy', price: '₦12k', rotation: 8, color: 'bg-zinc-900', top: '70%', left: '55%' },
    { icon: Zap, label: 'PowerBank', price: '₦15k', rotation: -15, color: 'bg-black', top: '5%', left: '70%' },
];

export const HeroSection = () => {
    const { user } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Mouse Move Effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth - 0.5;
        const y = clientY / innerHeight - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-black pt-20"
        >
            {/* Ambient Lighting */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#FF6600]/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FF4500]/10 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] mix-blend-overlay" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

            <div className="container px-4 mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }}
                    className="space-y-10 text-center lg:text-left relative z-20"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/20 hover:border-[#FF6600]/30 transition-colors cursor-default"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6600] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6600]"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Beta Access Live</span>
                    </motion.div>

                    <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.85] select-none">
                        <motion.span className="block" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>CAMPUS</motion.span>
                        <motion.span className="block" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>COMMERCE</motion.span>
                        <motion.span
                            className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6600] to-[#FF9500] italic pr-2 block"
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                        >
                            REIMAGINED.
                        </motion.span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-zinc-400 text-lg md:text-xl font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed"
                    >
                        The fastest, safest way to buy and sell on campus. <br className="hidden md:block" />
                        Join thousands of students trading securely with <span className="text-white font-bold">MarketBridge</span>.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4"
                    >
                        <Button size="lg" asChild className="h-16 px-10 bg-[#FF6600] text-black font-black uppercase tracking-widest hover:bg-[#FF8533] hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,102,0,0.3)] rounded-[2rem] border border-white/10 group">
                            <Link href="/listings">
                                Start Shopping
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-16 px-10 border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-transparent transition-all rounded-[2rem] bg-transparent backdrop-blur-sm">
                            <Link href={user ? '/dealer/dashboard' : '/signup?role=dealer'}>
                                Become a Seller
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Interactive Visuals (Floating Cards) */}
                <motion.div
                    style={{ y, opacity }}
                    className="relative h-[600px] w-full hidden lg:block perspective-1000"
                >
                    {/* Tilt Container */}
                    <div className="relative w-full h-full transform-style-3d">
                        {items.map((item, index) => {
                            // Parallax Factor based on index
                            const depth = 20 + (index * 10);
                            const moveX = useTransform(mouseX, [-0.5, 0.5], [depth, -depth]);
                            const moveY = useTransform(mouseY, [-0.5, 0.5], [depth, -depth]);
                            const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
                            const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0, y: 100 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                        delay: 0.5 + (index * 0.1),
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 20
                                    }}
                                    style={{
                                        top: item.top,
                                        left: item.left,
                                        x: moveX,
                                        y: moveY,
                                        rotateX: rotateX,
                                        rotateY: rotateY,
                                        rotate: item.rotation
                                    }}
                                    whileHover={{ scale: 1.1, zIndex: 50, rotate: 0 }}
                                    className={`absolute p-5 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl ${item.color} flex flex-col items-center gap-3 w-44 cursor-pointer group hover:border-[#FF6600]/50 transition-colors`}
                                >
                                    {/* Glass sheen effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 rounded-3xl pointer-events-none" />

                                    <div className="h-14 w-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <item.icon className="h-7 w-7 text-[#FF6600]" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-zinc-300 font-bold text-xs uppercase tracking-wider">{item.label}</h3>
                                        <p className="text-white font-black text-xl italic mt-1">{item.price}</p>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '70%' }}
                                            transition={{ duration: 1, delay: 1 + (index * 0.2) }}
                                            className="h-full bg-[#FF6600]"
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
