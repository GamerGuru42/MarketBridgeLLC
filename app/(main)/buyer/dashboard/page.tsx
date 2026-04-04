'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
    LayoutDashboard, 
    MessageCircle, 
    ShoppingBag, 
    ShieldCheck, 
    Clock, 
    ArrowRight,
    MapPin,
    AlertCircle,
    Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard-header';

const buyerItems = [
    { label: 'Overview', href: '/buyer/dashboard', icon: LayoutDashboard },
    { label: 'My Escrows', href: '/orders', icon: ShieldCheck },
    { label: 'Saved Assets', href: '/wishlist', icon: Heart },
    { label: 'Communications', href: '/chats', icon: MessageCircle },
    { label: 'Disputes', href: '/disputes', icon: AlertCircle },
];

export default function BuyerDashboardPage() {
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-[#FAFAFA] dark:bg-zinc-950">
            {/* Standard Sidebar Layout handled by DashboardHeader context if needed, but we pass it explicitly here for the Mobile Sheet */}
            <div className="flex-1 flex flex-col max-w-[100vw] overflow-x-hidden">
                <DashboardHeader title="Buyer Center" sidebarItems={buyerItems} />
                
                <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-12">
                    
                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-zinc-800 p-8 md:p-12 shadow-2xl">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6200]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                            <div className="space-y-4 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/20 text-[10px] font-black uppercase tracking-widest text-[#FF6200]">
                                    <ShieldCheck className="h-3 w-3" /> Standard Protocol
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.95]">
                                    Welcome to your <br /> <span className="text-[#FF6200]">Command Center</span>.
                                </h1>
                                <p className="text-zinc-400 font-medium">
                                    Monitor your escrow transactions, track asset deliveries, and communicate with campus merchants securely.
                                </p>
                            </div>
                            
                            <div className="shrink-0 flex items-center gap-4">
                                <Link href="/marketplace">
                                    <Button className="h-14 px-8 rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(255,98,0,0.3)] transition-all hover:scale-105">
                                        Browse Market
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Escrows Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Active Escrows</h2>
                                <Link href="/orders" className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] hover:text-[#FF7A29] transition-colors flex items-center gap-1">
                                    View Log <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                            
                            {/* Empty State: Escrows */}
                            <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 p-12 text-center group transition-colors hover:border-[#FF6200]/50 hover:bg-[#FF6200]/5">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#FF6200]/10 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <ShieldCheck className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-6 group-hover:scale-110 group-hover:text-[#FF6200] transition-all duration-500" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-2">No Active Transactions</h3>
                                <p className="text-zinc-500 text-xs font-medium max-w-sm mx-auto mb-8">
                                    Your money is completely protected until you receive exactly what you ordered. Start a secure transaction today.
                                </p>
                                <Link href="/marketplace">
                                    <Button variant="outline" className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px] text-zinc-900 dark:text-zinc-100 hover:bg-[#FF6200]/10 hover:text-[#FF6200] hover:border-[#FF6200]/30 transition-all">
                                        Find Campus Assets
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Comms & Wishlist Column */}
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Communications</h2>
                            
                            {/* Empty State: Chats */}
                            <div className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm relative overflow-hidden group">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-[#FF6200]/10 transition-colors">
                                        <MessageCircle className="h-5 w-5 text-zinc-400 group-hover:text-[#FF6200] transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-1">Incoming Nodes</h3>
                                        <p className="text-[11px] text-zinc-500 max-w-[200px]">No active negotiations or messages from merchants.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white pt-4">Saved Assets</h2>
                            
                            {/* Empty State: Wishlist */}
                            <div className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm flex flex-col items-center justify-center text-center py-12 group hover:border-red-500/30 transition-colors">
                                <Heart className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-4 group-hover:text-red-500 group-hover:fill-red-500/20 transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white mb-1">Empty Wishlist</h3>
                                <p className="text-[10px] text-zinc-500">Track items you're interested in.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
