'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if configured
    console.error('Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card p-8 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight mb-3">
          Something went wrong
        </h2>
        <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-8">
          We've encountered an unexpected error. Our team has been notified. 
          Please try refreshing the page or head back to the marketplace.
        </p>
        
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6200] hover:bg-[#FF7A29] text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl transition-all"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          
          <Link
            href="/marketplace"
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground font-bold tracking-widest uppercase text-xs py-4 rounded-xl transition-all"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
