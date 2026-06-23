'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface ListingMapProps {
    lat: number;
    lng: number;
    title?: string;
    zoom?: number;
}

export function ListingMap({ lat, lng, title, zoom = 14 }: ListingMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !mapRef.current || mapInstanceRef.current) return;

        const initMap = async () => {
            try {
                const L = (await import('leaflet')).default;

                // Fix default marker icon path issue with bundlers
                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });

                // Add Leaflet CSS
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

                const map = L.map(mapRef.current!, {
                    center: [lat, lng],
                    zoom,
                    scrollWheelZoom: false,
                    zoomControl: true,
                });

                L.tileLayer(
                    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                    {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 20,
                    }
                ).addTo(map);

                const marker = L.marker([lat, lng]).addTo(map);
                if (title) {
                    marker.bindPopup(`<strong style="font-family:monospace;text-transform:uppercase;font-size:11px">${title}</strong>`);
                }

                mapInstanceRef.current = map;
            } catch (err) {
                console.error('Map init failed:', err);
                setHasError(true);
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isClient, lat, lng, title, zoom]);

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!isClient) {
        return (
            <div className="h-[300px] w-full rounded-[2rem] bg-zinc-900 animate-pulse flex items-center justify-center border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Initializing Map Stream...</span>
            </div>
        );
    }

    if (googleApiKey) {
        return (
            <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
                <iframe
                    title={title || "Listing Location"}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=${googleApiKey}&q=${lat},${lng}&zoom=${zoom}`}
                />
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 px-3.5 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 z-[501]"
                >
                    <MapPin className="h-3.5 w-3.5 text-[#FF6200]" />
                    <span>Open in Google Maps</span>
                </a>
                <div className="absolute inset-0 pointer-events-none rounded-[2rem] ring-1 ring-inset ring-white/10 z-[500]" />
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="h-[300px] w-full rounded-[2rem] bg-zinc-900/50 flex flex-col items-center justify-center gap-3 border border-white/5">
                <MapPin className="h-8 w-8 text-zinc-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Map Signal Unavailable</span>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
            <div ref={mapRef} className="h-full w-full" />
            <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 px-3.5 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 z-[501]"
            >
                <MapPin className="h-3.5 w-3.5 text-[#FF6200]" />
                <span>Open in Google Maps</span>
            </a>
            {/* Aesthetic border overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-[2rem] ring-1 ring-inset ring-white/10 z-[500]" />
        </div>
    );
}
