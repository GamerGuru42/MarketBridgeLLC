import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LaunchCountdown() {
    const router = useRouter();
    const sellerUrl = "https://marketbridge.com.ng/seller-onboard";
    // Target date: April 20th, 2026, 00:00:00 +01:00 (Nigeria)
    const targetDate = new Date('2026-04-20T00:00:00+01:00').getTime();
    
    const [isMounted, setIsMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-between overflow-hidden font-heading selection:bg-[#FF6200] selection:text-black py-10 md:py-16 px-6">
            {/* Cinematic Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 scale-[1.05] animate-subtle-zoom pointer-events-none"
                style={{ backgroundImage: 'url("/media/genesis_bg.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF6200] animate-pulse" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Genesis // MarketBridge</span>
                </div>
            </div>

            {/* Hero / Countdown */}
            <div className="relative z-10 flex flex-col items-center gap-8 md:gap-16 w-full max-w-5xl">
                <div className="space-y-4 text-center">
                    <h1 className="text-[clamp(2.2rem,10vw,5.5rem)] font-black uppercase tracking-tighter leading-none italic">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6200] to-[#FF9000]">Market</span> is Coming
                    </h1>
                    <p className="text-zinc-500 font-bold tracking-[0.3em] text-[9px] md:text-sm uppercase italic">
                        Abuja Campus Pilot // Live in:
                    </p>
                </div>

                <div className="grid grid-cols-2 md:flex items-center justify-center gap-4 md:gap-16">
                    <TimeUnit value={timeLeft.days} label="Days" isMounted={isMounted} />
                    <Separator className="opacity-20 flex items-center justify-center" />
                    <TimeUnit value={timeLeft.hours} label="Hours" isMounted={isMounted} />
                    <Separator className="hidden md:flex opacity-20 items-center justify-center" />
                    <TimeUnit value={timeLeft.minutes} label="Minutes" isMounted={isMounted} />
                    <Separator className="opacity-20 flex items-center justify-center" />
                    <TimeUnit value={timeLeft.seconds} label="Seconds" isMounted={isMounted} />
                </div>
            </div>

            {/* Simple Onboarding Section */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 md:gap-6">
                    <div className="space-y-1">
                        <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-[0.2em]">Seller Entrance</p>
                        <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap">Join the <span className="text-[#FF6200]">Pilot</span></h2>
                    </div>
                    
                    <Button 
                        onClick={() => router.push('/seller-onboard')}
                        className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,98,0,0.2)] group"
                    >
                        Sign In <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden md:block w-px h-20 bg-white/10" />
                {/* Horizontal Divider (Mobile) - simplified */}
                <div className="md:hidden w-1/4 h-px bg-white/10" />

                <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-2.5 rounded-xl shadow-2xl transition-transform hover:scale-105">
                        <QRCode value={sellerUrl} size={70} viewBox="0 0 70 70" />
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#FF6200] mb-0.5">Seller QR</p>
                        <p className="text-[8px] font-medium text-zinc-500 uppercase tracking-widest max-w-[120px] leading-tight opacity-50">Scan to register</p>
                    </div>
                </div>
            </div>

            {/* Footer Tech Decals */}
            <div className="relative z-10 opacity-20 flex items-center gap-4">
                <div className="h-px w-8 bg-zinc-500" />
                <span className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">Secure Protocol v4.8</span>
                <div className="h-px w-8 bg-zinc-500" />
            </div>
        </div>
    );
}

function TimeUnit({ value, label, isMounted }: { value: number, label: string, isMounted: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1 group">
            <div className="text-[clamp(2.5rem,12vw,6rem)] font-black tabular-nums tracking-tighter italic leading-none group-hover:text-[#FF6200] transition-colors duration-500">
                {isMounted ? String(value).padStart(2, '0') : '00'}
            </div>
            <div className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] md:tracking-[0.4em] text-zinc-600 italic">
                {label}
            </div>
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return (
        <div className={`text-3xl md:text-5xl font-black text-zinc-800/50 animate-pulse ${className}`}>/</div>
    );
}
