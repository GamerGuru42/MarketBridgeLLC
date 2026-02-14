'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Smartphone, Shirt, Book, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const items = [
    { icon: Smartphone, label: 'MacBook Pro M3', price: '₦2.1M', rotation: -6, color: 'bg-zinc-800' },
    { icon: Shirt, label: 'Nike Dunk Low', price: '₦45k', rotation: 12, color: 'bg-zinc-900' },
    { icon: Headphones, label: 'Sony XM5', price: '₦350k', rotation: -3, color: 'bg-black' },
    { icon: Book, label: 'Medical Anatomy', price: '₦12k', rotation: 8, color: 'bg-zinc-800' },
];

export const HeroSection = () => {
    const { user } = useAuth();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

    return (
        <section ref={containerRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black pt-20">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF6600]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF4500]/10 rounded-full blur-[100px]" />
            </div>

            <div className="container px-4 mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8 text-center lg:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6600] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6600]"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Next-Gen Commerce</span>
                    </div>

                    <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
                        CAMPUS <br />
                        COMMERCE <br />
                        <span className="text-[#FF6600]">REIMAGINED.</span>
                    </h1>

                    <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                        The fastest, safest way to buy and sell on campus. Join thousands of students trading securely with <span className="text-white font-bold">MarketBridge</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                        <Button size="lg" asChild className="h-14 px-8 bg-[#FF6600] text-black font-black uppercase tracking-widest hover:bg-[#FF8533] hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,102,0,0.3)] rounded-2xl">
                            <Link href="/listings">
                                Start Shopping
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-14 px-8 border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-2xl">
                            <Link href={user ? '/dealer/dashboard' : '/signup?role=dealer'}>
                                Become a Seller
                            </Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Interactive Visuals */}
                <motion.div
                    style={{ y, opacity, scale }}
                    className="relative h-[500px] w-full hidden lg:block"
                >
                    {/* Floating Cards simulating Chowdeck's dynamic feel */}
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.5, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                                delay: 0.2 + (index * 0.1),
                                duration: 0.8,
                                type: "spring",
                                stiffness: 100
                            }}
                            whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
                            className={`absolute p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md ${item.color} flex flex-col items-center gap-4 w-48`}
                            style={{
                                top: `${20 + (index * 15)}%`,
                                left: `${10 + (index % 2 * 40)}%`,
                                rotate: `${item.rotation}deg`,
                            }}
                        >
                            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                                <item.icon className="h-8 w-8 text-[#FF6600]" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-bold text-sm truncate w-full">{item.label}</h3>
                                <p className="text-[#FF6600] font-black text-lg">{item.price}</p>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#FF6600] w-[70%]" />
                            </div>
                        </motion.div>
                    ))}

                    {/* Central Glow */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-tr from-[#FF6600]/20 to-transparent rounded-full blur-[80px] pointer-events-none" />
                </motion.div>
            </div>
        </section>
    );
};
