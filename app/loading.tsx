import { Loader2 } from "lucide-react";

export default function RootLoading() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
            <div className="relative flex flex-col items-center gap-4">
                <div className="h-20 w-20 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold tracking-tight animate-pulse">Loading Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Accessing MarketBridge Secure Network...</p>
                </div>
            </div>
        </div>
    );
}
