import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black font-sans relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6600]/10 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF5500]/10 rounded-full blur-[120px] opacity-20" />
            </div>

            <div className="max-w-md w-full text-center space-y-8 relative z-10">

                {/* Glitch Effect 404 */}
                <div className="relative mx-auto h-40 w-40 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-[#FF6600]/10 rounded-full animate-pulse group-hover:bg-[#FF6600]/20 transition-all duration-500"></div>
                    <div className="absolute inset-0 border border-[#FF6600]/20 rounded-full scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-700"></div>

                    <div className="relative h-28 w-28 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.1)]">
                        <Search className="h-12 w-12 text-[#FF6600]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-400 to-zinc-700 leading-none">
                        404
                    </h1>
                    <h2 className="text-xl font-black uppercase tracking-[0.2em] text-[#FF6600]">
                        Signal Lost
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-[280px] mx-auto leading-relaxed border-l-2 border-[#FF6600]/50 pl-4 text-left">
                        The requested node is offline or has been decommissioned from the MarketBridge network.
                    </p>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-4">
                    <Button variant="outline" asChild className="h-14 font-bold uppercase tracking-widest text-xs border-white/10 text-white hover:bg-white/5 hover:border-[#FF6600]/50">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return
                        </Link>
                    </Button>
                    <Button asChild className="h-14 font-bold uppercase tracking-widest text-xs bg-[#FF6600] text-black hover:bg-[#FF6600] hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,184,0,0.3)]">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                <div className="pt-12 flex justify-center opacity-50">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        System Diagnostics v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
