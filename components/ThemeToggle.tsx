'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-zinc-200 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-9 w-9 rounded-full border-zinc-200 bg-white/50 backdrop-blur-md hover:bg-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? (
                <Moon className="h-[1.2rem] w-[1.2rem] text-zinc-100 transition-all" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] text-zinc-900 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
