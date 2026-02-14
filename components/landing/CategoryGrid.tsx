'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CATEGORIES, Category } from '@/lib/categories';
import { Smartphone, Book, Shirt, Coffee, Music, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryGridProps {
    onCategoryClick?: (category: Category) => void;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const CategoryGrid = ({ onCategoryClick }: CategoryGridProps) => {
    // We limit to top 8 or key categories for the landing page
    const featuredCategories = CATEGORIES.slice(0, 8);

    return (
        <section className="py-24 bg-black relative">
            <div className="container px-4 mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-4">
                            Explore <span className="text-[#FF6600]">Campus</span>
                        </h2>
                        <p className="text-zinc-500 max-w-md">
                            Everything you need to survive and thrive on campus, all in one place.
                        </p>
                    </div>
                    <Link href="/listings" className="hidden md:flex items-center gap-2 text-[#FF6600] font-bold hover:text-white transition-colors group">
                        View All Categories
                        <ArrowUpRight className="h-5 w-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                >
                    {featuredCategories.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                            <motion.div variants={item} key={idx}>
                                <Link href={cat.locked ? '#' : `/listings?category=${cat.name}`}>
                                    <div className={cn(
                                        "group relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 aspect-square flex flex-col items-center justify-center gap-4 transition-all duration-300 overflow-hidden",
                                        cat.locked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#FF6600] hover:border-[#FF6600] cursor-pointer"
                                    )}>
                                        <div className={cn(
                                            "h-14 w-14 rounded-full bg-black/50 flex items-center justify-center transition-colors group-hover:bg-black/20",
                                            cat.locked ? "text-zinc-500" : "text-white"
                                        )}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className={cn(
                                            "font-bold text-sm uppercase tracking-wide text-center",
                                            cat.locked ? "text-zinc-500" : "text-zinc-300 group-hover:text-black"
                                        )}>
                                            {cat.name}
                                        </span>

                                        {!cat.locked && (
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="h-4 w-4 text-black" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>

                <div className="mt-8 text-center md:hidden">
                    <Link href="/listings" className="inline-flex items-center gap-2 text-[#FF6600] font-bold hover:text-white transition-colors">
                        View All Categories
                        <ArrowUpRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
};
