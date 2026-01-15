import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background font-sans">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="relative mx-auto h-32 w-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                    <div className="relative h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                        <Search className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-black tracking-tighter text-primary">404</h1>
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Endpoint Not Found</h2>
                    <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
                        The requested node is not responding or has been decommissioned from our network.
                    </p>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4">
                    <Button variant="outline" asChild className="h-12 font-bold uppercase tracking-widest text-xs">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <Button asChild className="h-12 font-bold uppercase tracking-widest text-xs bg-primary hover:bg-primary/90">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>

                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] pt-8">
                    MarketBridge Indexer v1.0
                </p>
            </div>
        </div>
    );
}
