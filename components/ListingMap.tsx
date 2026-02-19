'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

interface ListingMapProps {
    lat: number;
    lng: number;
    title?: string;
    zoom?: number;
}

export function ListingMap({ lat, lng, title, zoom = 14 }: ListingMapProps) {
    const [isClient, setIsClient] = useState(false);
    const [customIcon, setCustomIcon] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        // Leaflet needs to be imported on the client
        const L = require('leaflet');
        setCustomIcon(new L.Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }));
    }, []);

    if (!isClient || !customIcon) {
        return (
            <div className="h-[300px] w-full rounded-[2rem] bg-zinc-900 animate-pulse flex items-center justify-center border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Initializing Map Stream...</span>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative z-0">
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%', background: '#09090b' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <Marker position={[lat, lng]} icon={customIcon}>
                    {title && (
                        <Popup className="custom-popup">
                            <span className="font-bold text-xs uppercase tracking-tight">{title}</span>
                        </Popup>
                    )}
                </Marker>
            </MapContainer>

            {/* Overlay for aesthetic */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-[2rem] z-10" />
        </div>
    );
}
