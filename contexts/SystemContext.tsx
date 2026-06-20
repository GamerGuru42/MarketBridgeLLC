'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const DEMO_TRANSACTION_LIMIT = 5000;
export const DEMO_DURATION_DAYS = 30;

interface SystemSettings {
    isDemoMode: boolean;
    demoStartDate: string | null;
    daysLeft: number;
    isExpired: boolean;
    launchDate: string;
}

const defaultSettings: SystemSettings = {
    isDemoMode: false,
    demoStartDate: null,
    daysLeft: 30,
    isExpired: false,
    launchDate: '2026-04-20T00:00:00+01:00',
};

const SystemContext = createContext<SystemSettings>(defaultSettings);

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        async function fetchSettings() {
            try {
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
                    const launchStr = data.demo_start_date || '2026-04-20T00:00:00+01:00';
                    const start = new Date(launchStr).getTime();
                    const now = new Date().getTime();
                    const diffMs = now - start;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const daysLeft = Math.max(0, DEMO_DURATION_DAYS - diffDays);
                    const isExpired = daysLeft <= 0;

                    setSettings({
                        isDemoMode: isDemo,
                        demoStartDate: launchStr,
                        daysLeft,
                        isExpired,
                        launchDate: data.launch_date || '2026-04-20T00:00:00+01:00',
                    });
                }
            } catch (err) {
                console.error("Error in SystemProvider:", err);
            }
        }

        fetchSettings();

        const channel = supabase
            .channel('system_settings_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings', filter: 'id=eq.global' }, (payload) => {
                const newData = payload.new as any;
                if (!newData) return;

                const isDemo = newData.is_demo_mode;
                const launchStr = newData.demo_start_date || '2026-04-20T00:00:00+01:00';
                const start = new Date(launchStr).getTime();
                const now = new Date().getTime();
                const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, DEMO_DURATION_DAYS - diffDays);
                const isExpired = daysLeft <= 0;

                setSettings({
                    isDemoMode: isDemo,
                    demoStartDate: launchStr,
                    daysLeft,
                    isExpired,
                    launchDate: newData.launch_date || '2026-04-20T00:00:00+01:00',
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
        </SystemContext.Provider>
    );
};

export const useSystem = () => useContext(SystemContext);
