'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Coordinates, findNearestUniversity, UniversityNode, ABUJA_UNIVERSITIES } from '@/lib/location';

interface LocationContextType {
    coords: Coordinates | null;
    city: string | null;
    region: string | null;
    nearestUniversity: { node: UniversityNode; distance: number } | null;
    isAbuja: boolean;
    loading: boolean;
    error: string | null;
    consentStatus: 'prompt' | 'granted' | 'denied';
    showDialog: boolean;
    setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
    requestLocation: () => Promise<void>;
    giveConsent: () => void;
    denyConsent: () => void;
    setManualLocation: (node: UniversityNode | 'global') => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// ── Trusted list of Abuja-area city names / regions from IP APIs ──
// These vary by provider; we normalize them all to "Abuja"
const ABUJA_ALIASES = [
    'abuja', 'fct', 'federal capital territory', 'abuja municipal',
    'garki', 'wuse', 'maitama', 'gwarinpa', 'kubwa', 'kuje',
    'bwari', 'gwagwalada', 'nyanya', 'lugbe', 'lokogoma',
    'asokoro', 'durumi', 'jabi', 'utako', 'apo', 'karu', 'kado',
    'central area', 'central business district'
];

function isAbujaCity(city: string | null, region: string | null): boolean {
    const normalized = [city, region]
        .filter(Boolean)
        .map(s => s!.toLowerCase().trim());
    return normalized.some(s => ABUJA_ALIASES.some(alias => s.includes(alias)));
}

/** Fetch city/region from bigdatacloud (primary) or ipapi.co (fallback).
 *  Returns { city, region, lat, lng } or null on failure.
 */
async function fetchIpLocation(): Promise<{ city: string; region: string; lat: number; lng: number } | null> {
    // Try bigdatacloud first (no CORS issues, free)
    try {
        const res = await fetch('https://api.bigdatacloud.net/data/client-ip');
        const ipData = await res.json();
        const ip = ipData.ipString;

        if (ip) {
            const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/ip-geolocation?ip=${ip}&localityLanguage=en&key=free`
            );
            const geoData = await geoRes.json();
            if (geoData.location?.latitude) {
                return {
                    city: geoData.location.city || geoData.location.localityName || '',
                    region: geoData.location.principalSubdivision || geoData.location.countryName || '',
                    lat: geoData.location.latitude,
                    lng: geoData.location.longitude,
                };
            }
        }
    } catch (_) { /* fall through */ }

    // Fallback: ipapi.co (reliable, free up to 1k/day)
    try {
        const res = await fetch('https://ipapi.co/json/');
        const d = await res.json();
        if (d.latitude) {
            return {
                city: d.city || '',
                region: d.region || d.country_name || '',
                lat: d.latitude,
                lng: d.longitude,
            };
        }
    } catch (_) { /* fall through */ }

    return null;
}

/** Reverse-geocode coordinates to get city/region via bigdatacloud (free) */
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; region: string }> {
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        const d = await res.json();
        return {
            city: d.city || d.locality || d.localityInfo?.administrative?.[3]?.name || '',
            region: d.principalSubdivision || '',
        };
    } catch {
        return { city: '', region: '' };
    }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [city, setCity] = useState<string | null>(null);
    const [region, setRegion] = useState<string | null>(null);
    const [nearestUniversity, setNearestUniversity] = useState<{ node: UniversityNode; distance: number } | null>(null);
    const [isAbuja, setIsAbuja] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [consentStatus, setConsentStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [showDialog, setShowDialog] = useState(false);
    const hasInitialized = useRef(false);

    const updateProximity = useCallback((currentCoords: Coordinates) => {
        const nearest = findNearestUniversity(currentCoords);
        setNearestUniversity(nearest);
        // Within 15km of any Abuja campus = campus node; also accept Abuja city center
        const inAbuja = (nearest && nearest.distance < 15) || false;
        setIsAbuja(inAbuja);
        return nearest;
    }, []);

    const fallbackToIp = useCallback(async () => {
        try {
            // Check if user manually selected a preferred node from a previous session
            const savedNode = typeof localStorage !== 'undefined' ? localStorage.getItem('mb-preferred-node') : null;
            if (savedNode && savedNode !== 'global') {
                const uni = ABUJA_UNIVERSITIES.find(u => u.id === savedNode);
                if (uni) {
                    setCoords(uni.coords);
                    setCity(uni.name);
                    setRegion('Abuja, FCT');
                    setNearestUniversity({ node: uni, distance: 0 });
                    setIsAbuja(true);
                    setLoading(false);
                    return;
                }
            }

            const data = await fetchIpLocation();
            if (data) {
                const ipCoords = { lat: data.lat, lng: data.lng };
                setCoords(ipCoords);

                let resolvedCity = data.city;
                let resolvedRegion = data.region;

                // ── Abuja FCT correction (Nigeria-wide prioritizing Abuja) ──
                // Precision IP check: if coordinates fall within the general FCT/Abuja bounding box, 
                // we forcefully normalize to Abuja to satisfy campus priority.
                const isInAbujaBounds = (
                    data.lat >= 8.5 && data.lat <= 9.6 &&
                    data.lng >= 6.9 && data.lng <= 7.9
                );

                if (isInAbujaBounds) {
                    resolvedCity = 'Abuja';
                    resolvedRegion = 'Federal Capital Territory';
                }

                setCity(resolvedCity || null);
                setRegion(resolvedRegion || null);
                updateProximity(ipCoords);
            }
        } catch (e) {
            console.error('IP Geoloc failed', e);
        } finally {
            setLoading(false);
        }
    }, [updateProximity]);

    const requestLocation = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!('geolocation' in navigator)) {
            setError('Geolocation is not supported by this browser.');
            await fallbackToIp();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCoords(newCoords);

                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('mb-location-coords', JSON.stringify(newCoords));
                    localStorage.setItem('mb-location-consent', 'granted');
                }
                setConsentStatus('granted');
                updateProximity(newCoords);

                // Reverse geocode for city name
                const geo = await reverseGeocode(newCoords.lat, newCoords.lng);
                setCity(geo.city || null);
                // Normalize FCT/Abuja from reverse geocode
                const normalizedRegion = (geo.region?.toLowerCase().includes('federal capital') || geo.region?.toLowerCase().includes('fct'))
                    ? 'Federal Capital Territory'
                    : (geo.region || null);
                setRegion(normalizedRegion);
                setLoading(false);
            },
            async (err) => {
                console.warn('Geolocation denied:', err.message);
                setError('Location access denied – using approximate detection');
                await fallbackToIp();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [fallbackToIp, updateProximity]);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        if (typeof window === 'undefined') return;

        const savedConsent = localStorage.getItem('mb-location-consent') as 'granted' | 'denied' | null;
        const initialStatus = savedConsent || 'prompt';
        setConsentStatus(initialStatus);

        // Restore cached coords for instant UI
        const savedCoords = localStorage.getItem('mb-location-coords');
        if (savedCoords) {
            try {
                const parsed = JSON.parse(savedCoords);
                setCoords(parsed);
                updateProximity(parsed);
            } catch { /* ignore parse error */ }
        }

        // Always do IP detection for base region, but don't ask for GPS if prompt
        if (initialStatus === 'granted') {
            requestLocation();
        } else {
            fallbackToIp();
        }
    }, [requestLocation, fallbackToIp, updateProximity]);

    const giveConsent = useCallback(() => {
        localStorage.setItem('mb-location-consent', 'granted');
        setConsentStatus('granted');
        requestLocation();
    }, [requestLocation]);

    const denyConsent = useCallback(() => {
        localStorage.setItem('mb-location-consent', 'denied');
        setConsentStatus('denied');
        fallbackToIp();
    }, [fallbackToIp]);

    const setManualLocation = useCallback((target: UniversityNode | 'global') => {
        if (typeof localStorage === 'undefined') return;

        if (target === 'global') {
            setIsAbuja(false);
            setNearestUniversity(null);
            setCity(null);
            setRegion('Nigeria');
            localStorage.setItem('mb-preferred-node', 'global');
        } else {
            setCoords(target.coords);
            setNearestUniversity({ node: target, distance: 0 });
            setIsAbuja(true);
            setCity(target.name);
            setRegion('Abuja, FCT');
            localStorage.setItem('mb-preferred-node', target.id);
            localStorage.setItem('mb-location-coords', JSON.stringify(target.coords));
        }
        setShowDialog(false);
        setLoading(false);
    }, []);

    return (
        <LocationContext.Provider value={{
            coords, city, region, nearestUniversity, isAbuja, loading, error,
            consentStatus, showDialog, setShowDialog, requestLocation, giveConsent, denyConsent, setManualLocation,
        }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
