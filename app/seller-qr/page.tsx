'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { ArrowLeft, Store, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SellerQRPage() {
    const router = useRouter();
    const sellerUrl = "https://marketbridge.com.ng/seller-onboard";

    return (
        <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden font-heading">
            {/* Cinematic Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-[1.05]"
                style={{ backgroundImage: 'url("/media/genesis_bg.png")' }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

            {/* Back Button */}
            <button 
                onClick={() => router.push('/')}
                className="absolute top-10 left-10 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group z-50"
            >
                <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Poster Content */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-2xl px-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-full mb-4">
                        <Store className="h-4 w-4 text-[#FF6200]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6200]">Become a Seller</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                        Start Your <br />
                        <span className="text-[#FF6200]">Campus Business</span>
                    </h1>
                    <p className="text-zinc-500 font-medium tracking-widest text-xs uppercase italic">
                        Abuja Campus // Seller Registration
                    </p>
                </div>

                <div className="p-6 md:p-12 bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_80px_rgba(255,255,255,0.1)] border border-white/20 transform hover:scale-105 transition-transform duration-500 max-w-[90vw]">
                    <div className="bg-white p-2 md:p-4 rounded-2xl">
                        <QRCode 
                            value={sellerUrl}
                            size={220}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 280 280`}
                            fgColor="#000000"
                            bgColor="#FFFFFF"
                            className="md:hidden"
                        />
                        <QRCode 
                            value={sellerUrl}
                            size={320}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 320 320`}
                            fgColor="#000000"
                            bgColor="#FFFFFF"
                            className="hidden md:block"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <p className="text-zinc-400 text-[10px] md:text-xs uppercase font-bold tracking-[0.4em] leading-relaxed max-w-sm">
                        SCAN TO SIGN UP AS A SELLER & <br /> 
                        START SELLING ON CAMPUS
                    </p>
                    <div className="flex items-center justify-center gap-6 opacity-40">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Safe Payments</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Verified ONLY</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Decals */}
            <div className="absolute bottom-10 right-10 text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500 opacity-30 vertical-text hidden md:block">
                MARKETBRIDGE // GENESIS DEPLOYMENT
            </div>

            <style jsx>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}</style>
        </div>
    );
}
