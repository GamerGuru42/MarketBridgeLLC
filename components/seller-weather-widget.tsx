'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CloudRain, Sun, Droplets, Loader2, Cloud } from 'lucide-react';

interface WeatherData {
    temp: number;
    humidity: number;
    description: string;
    isRaining: boolean;
}

export function SellerWeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Abuja coordinates
                const lat = 9.0765;
                const lon = 7.3986;
                const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

                if (!apiKey) {
                    // Fallback to static Abuja averages if no key is configured
                    setWeather({ temp: 32, humidity: 65, description: 'Partly Cloudy', isRaining: false });
                    setLoading(false);
                    return;
                }

                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
                if (!res.ok) throw new Error('Weather fetch failed');
                const data = await res.json();

                const isRaining = data.weather[0]?.main.toLowerCase().includes('rain');

                setWeather({
                    temp: Math.round(data.main.temp),
                    humidity: data.main.humidity,
                    description: data.weather[0]?.description,
                    isRaining
                });
            } catch (err) {
                console.error("Failed to load weather widget:", err);
                // Fallback on error
                setWeather({ temp: 30, humidity: 60, description: 'Clear', isRaining: false });
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Auto-refresh every 30 mins
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !weather) {
        return (
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 rounded-3xl flex items-center justify-center min-h-[100px]">
                <Loader2 className="h-5 w-5 animate-spin text-[#FF6200]" />
            </Card>
        );
    }

    return (
        <Card className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 shadow-sm p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${weather.isRaining ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' : 'bg-[#FF6200]/10 text-[#FF6200]'}`}>
                    {weather.isRaining ? <CloudRain className="h-6 w-6" /> : (weather.temp > 28 ? <Sun className="h-6 w-6" /> : <Cloud className="h-6 w-6" />)}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Abuja Campus Weather</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{weather.temp}°C</h3>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 capitalize">{weather.description}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{weather.humidity}% Humidity</span>
                </div>
                {weather.isRaining && (
                    <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md uppercase tracking-wide">
                        Protect Deliveries
                    </span>
                )}
            </div>
        </Card>
    );
}
