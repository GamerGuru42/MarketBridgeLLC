"use client"

import React, { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Loader2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'

const CampusMap = dynamic(() => import('../../components/CampusMap'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-white/5 rounded-[2.5rem] flex items-center justify-center animate-pulse border border-white/10"><Loader2 className="h-8 w-8 text-[#FF6200] animate-spin" /></div>
})

export default function CampusIndex() {
    const [lat, setLat] = useState<number | null>(null)
    const [lon, setLon] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!navigator?.geolocation) {
            setError('Geolocation not supported')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude)
                setLon(pos.coords.longitude)
            },
            () => {
                // fallback to Abuja center
                setLat(9.0765)
                setLon(7.3986)
            },
            { maximumAge: 1000 * 60 * 5, timeout: 5000 }
        )
    }, [])

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#FF6200] selection:text-black">
            {/* Ambient background */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
            <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6200]/5 blur-[120px] rounded-full pointer-events-none" />

            <header className="flex items-center justify-between px-6 py-8 relative z-10 border-b border-white/5 backdrop-blur-md bg-black/40">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-[#FF6200] transition-transform hover:scale-110">
                        <Logo showText={false} className="h-8 w-8" />
                    </Link>
                    <div className="text-[#FF6200] font-black text-2xl uppercase tracking-tighter italic">MarketBridge</div>
                </div>
                <div className="hidden sm:block px-6 py-2 bg-[#FF6200]/10 border border-[#FF6200]/30 rounded-full">
                    <span className="text-[#FF6200] text-[10px] font-black uppercase tracking-[0.2em]">Campus Beta – Testing Phase</span>
                </div>
                <div className="sm:hidden text-[#FF6200] text-[8px] font-black uppercase tracking-widest">Beta Mode</div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Market Discovery</span>
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic leading-none">
                            Campus <span className="text-[#FF6200]">Marketplace</span>
                        </h1>
                        <p className="text-white/60 text-lg max-w-lg font-medium">
                            Browse verified campus listings. Abuja university region only.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl">
                        <MapPin className="h-5 w-5 text-[#FF6200]" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Active Campus</span>
                            <span className="text-xs font-bold text-white uppercase">{lat && lon ? `Nigeria // Abuja` : 'Detecting...'}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-zinc-950/20">
                    <Suspense fallback={<div className="h-[500px] flex items-center justify-center bg-white/5"><Loader2 className="h-10 w-10 animate-spin text-[#FF6200] shadow-[0_0_20px_#FF6200]" /></div>}>
                        {lat && lon ? (
                            <CampusMap initialLat={lat} initialLon={lon} />
                        ) : (
                            <div className="h-[500px] flex flex-col items-center justify-center space-y-6">
                                <Loader2 className="h-12 w-12 animate-spin text-[#FF6200]" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6200]">Calibrating Location Flow...</p>
                            </div>
                        )}
                    </Suspense>
                </div>
            </main>

            <footer className="w-full border-t border-white/5 py-12 mt-20 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#FF6200]/5 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">MarketBridge Campus Alpha v2.0</p>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
                        <div className="flex flex-col items-center sm:items-start gap-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Technical Oversight</span>
                            <a href="mailto:support@marketbridge.com.ng" className="text-sm font-bold text-[#FF6200] hover:text-white transition-colors">support@marketbridge.com.ng</a>
                        </div>
                        <div className="h-[1px] w-8 bg-white/10 sm:h-8 sm:w-[1px]" />
                        <div className="flex flex-col items-center sm:items-start gap-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Operations Support</span>
                            <a href="mailto:ops-support@marketbridge.com.ng" className="text-sm font-bold text-[#FF6200] hover:text-white transition-colors">ops-support@marketbridge.com.ng</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
