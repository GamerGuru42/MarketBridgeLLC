'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SystemSettings {
    isDemoMode: boolean;
    demoStartDate: string | null;
    daysLeft: number;
    isExpired: boolean;
}

const defaultSettings: SystemSettings = {
    isDemoMode: false,
    demoStartDate: null,
    daysLeft: 30,
    isExpired: false,
};

const SystemContext = createContext<SystemSettings>(defaultSettings);

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        async function fetchSettings() {
            try {
                // Fetch the system settings from the database
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('*')
                    .eq('id', 'global')
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error("Failed to fetch system settings", error);
                    return;
                }

                if (mounted && data) {
                    const isDemo = data.is_demo_mode;
                    let daysLeft = 30;
                    let isExpired = false;

                    if (isDemo && data.demo_start_date) {
                        const start = new Date(data.demo_start_date).getTime();
                        const now = new Date().getTime();
                        const diffMs = now - start;
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        daysLeft = Math.max(0, 30 - diffDays);
                        isExpired = daysLeft <= 0;
                    }

                    setSettings({
                        isDemoMode: isDemo,
                        demoStartDate: data.demo_start_date,
                        daysLeft,
                        isExpired,
                    });
                }
            } catch (err) {
                console.error("Error in SystemProvider:", err);
            }
        }

        fetchSettings();

        // Optional: subscribe to database changes for real-time updates
        const channel = supabase
            .channel('system_settings_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings', filter: 'id=eq.global' }, (payload) => {
                const newData = payload.new as any;
                if (!newData) return;

                const isDemo = newData.is_demo_mode;
                let daysLeft = 30;
                let isExpired = false;

                if (isDemo && newData.demo_start_date) {
                    const start = new Date(newData.demo_start_date).getTime();
                    const now = new Date().getTime();
                    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                    daysLeft = Math.max(0, 30 - diffDays);
                    isExpired = daysLeft <= 0;
                }

                setSettings({
                    isDemoMode: isDemo,
                    demoStartDate: newData.demo_start_date,
                    daysLeft,
                    isExpired,
                });
            })
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <SystemContext.Provider value={settings}>
            {children}
            {settings.isDemoMode && settings.isExpired && (
                <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <span className="text-destructive text-4xl">⏱️</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic text-destructive">Demo Expired</h1>
                        <p className="text-muted-foreground font-medium">The 30-day private beta period for MarketBridge has officially concluded. Thank you to everyone who participated in the testing phase!</p>
                        <div className="bg-muted p-4 rounded-xl border border-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Official launch sequence initiating soon.</p>
                        </div>
                    </div>
                </div>
            )}
        </SystemContext.Provider>
    );
};

export const useSystem = () => useContext(SystemContext);
