import React from 'react';
import { Button } from '@/components/ui/button';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <div className="bg-muted/30 p-8 rounded-full mb-6">
                <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You are offline</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                It seems you've lost your internet connection. Please check your network settings and try again.
            </p>
            <Button onClick={() => window.location.reload()}>
                Try Again
            </Button>
        </div>
    );
}
