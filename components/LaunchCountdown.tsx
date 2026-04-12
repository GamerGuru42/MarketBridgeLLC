import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { ArrowRight, ShieldCheck, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LaunchCountdown() {
    const router = useRouter();
    const sellerUrl = "https://marketbridge.com.ng/seller-onboard";
    // Target date: April 20th, 2026, 00:00:00
    const targetDate = new Date('2026-04-20T00:00:00').getTime();
    
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
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
        <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden font-heading selection:bg-[#FF6200] selection:text-black">
            {/* Cinematic Background with Genesis Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-[1.05] animate-subtle-zoom"
                style={{ backgroundImage: 'url("/media/genesis_bg.png")' }}
            />
            
            {/* Futuristic Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

            {/* Top Navigation / Status Bar */}
            <div className="absolute top-0 w-full p-8 flex justify-between items-start z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6200]">MarketBridge // Upcoming Launch</span>
                    </div>
                </div>

                {/* Seller Fast-Track HUD */}
                <div 
                    onClick={() => router.push('/seller-qr')}
                    className="hidden md:flex flex-col items-end gap-2 group cursor-pointer"
                >
                    <div className="bg-white p-2 rounded-xl group-hover:scale-105 transition-transform">
                        <QRCode value={sellerUrl} size={64} viewBox="0 0 64 64" />
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Recruitment Asset</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6200] group-hover:text-white transition-colors">Seller Fast-Track</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center space-y-12 md:space-y-20 pt-16 md:pt-0">
                
                {/* Genesis Branding */}
                <div className="space-y-4">
                    <h1 className="text-[clamp(2.5rem,12vw,6.5rem)] font-black uppercase tracking-tighter leading-[0.85] italic">
                        MarketBridge <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6200] to-[#FF9000]">Launch</span>
                    </h1>
                    <p className="text-zinc-500 font-medium tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-sm uppercase italic">
                        Abuja Campus Pilot // Launching Soon
                    </p>
                </div>

                {/* The Countdown Clock */}
                <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-12">
                    <TimeUnit value={timeLeft.days} label="Days" />
                    <Separator />
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <Separator className="hidden md:block" />
                    <TimeUnit value={timeLeft.minutes} label="Minutes" />
                    <Separator />
                    <TimeUnit value={timeLeft.seconds} label="Seconds" />
                </div>

                {/* Status HUD / Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                    <HUDCard 
                        icon={Zap} 
                        label="Platform Status" 
                        value="Ready" 
                    />
                    <HUDCard 
                        icon={Shield} 
                        label="Payment Security" 
                        value="Verified" 
                    />
                    <HUDCard 
                        icon={Globe} 
                        label="Available Locations" 
                        value="Abuja Hub" 
                    />
                </div>

                {/* CTA / Entry Logic */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                    <div className="flex flex-col items-center gap-6">
                        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-[0.3em] font-sans">
                            Official Launching at 12:00 Midnight // April 20, 2026
                        </p>
                        <Button 
                            onClick={() => router.push('/login')}
                            className="h-20 px-12 rounded-full bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-[0.4em] text-xs transition-all hover:scale-[1.05] shadow-[0_0_50px_rgba(255,98,0,0.3)] group"
                        >
                            Seller Login <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {/* Desktop QR Section */}
                    <div className="hidden md:flex items-center gap-8 pl-12 border-l border-white/10 text-left">
                        <div className="bg-white p-4 rounded-[1.5rem] shadow-2xl">
                            <QRCode value={sellerUrl} size={100} viewBox="0 0 100 100" />
                        </div>
                        <div className="max-w-[180px] space-y-2">
                            <div className="px-2 py-1 bg-[#FF6200]/20 rounded border border-[#FF6200]/30 inline-block">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#FF6200]">Become a Seller</span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 leading-relaxed">
                                Scan to create your <span className="text-[#FF6200]">Seller Account</span> and start earning now.
                            </p>
                            <p className="text-[8px] font-medium text-zinc-500 uppercase tracking-widest">
                                Valid university ID required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Bottom Tech Decals */}
            <div className="absolute bottom-10 w-full flex justify-center opacity-20 pointer-events-none">
                <div className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">
                    System Ver: 4.8.2 // Secured by MarketBridge Tech Group
                </div>
            </div>

            <style jsx global>{`
                @keyframes subtle-zoom {
                    from { transform: scale(1.05); }
                    to { transform: scale(1.15); }
                }
                .animate-subtle-zoom {
                    animation: subtle-zoom 30s infinite alternate ease-in-out;
                }
                @font-face {
                    font-family: 'Heading';
                    src: url('/fonts/Inter-BlackItalic.woff2') format('woff2');
                }
            `}</style>
        </div>
    );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
    return (
        <div className="flex flex-col items-center space-y-1 md:space-y-2 group">
            <div className="text-[clamp(2.5rem,15vw,7.5rem)] font-black tabular-nums tracking-tighter italic leading-none group-hover:text-[#FF6200] transition-colors duration-500">
                {String(value).padStart(2, '0')}
            </div>
            <div className="text-[9px] md:text-[12px] uppercase font-bold tracking-[0.2em] md:tracking-[0.4em] text-zinc-500 italic">
                {label}
            </div>
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return (
        <div className={`text-4xl md:text-6xl font-black text-zinc-800 animate-pulse ${className}`}>/</div>
    );
}

function HUDCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 flex items-center gap-5 hover:bg-white/[0.05] hover:border-[#FF6200]/30 transition-all cursor-crosshair group">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.05] group-hover:bg-[#FF6200]/10 flex items-center justify-center transition-colors">
                <Icon className="h-6 w-6 text-zinc-600 group-hover:text-[#FF6200] transition-colors" />
            </div>
            <div className="text-left">
                <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500 mb-1">{label}</p>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-100">{value}</p>
            </div>
        </div>
    );
}
