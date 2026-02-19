'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Coordinates, findNearestUniversity, UniversityNode } from '@/lib/location';

interface LocationContextType {
    coords: Coordinates | null;
    city: string | null;
    region: string | null;
    nearestUniversity: { node: UniversityNode; distance: number } | null;
    isAbuja: boolean;
    loading: boolean;
    error: string | null;
    consentGiven: boolean;
    showDialog: boolean;
    setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
    requestLocation: () => Promise<void>;
    setManualLocation: (node: UniversityNode | 'global') => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [city, setCity] = useState<string | null>(null);
    const [region, setRegion] = useState<string | null>(null);
    const [nearestUniversity, setNearestUniversity] = useState<{ node: UniversityNode; distance: number } | null>(null);
    const [isAbuja, setIsAbuja] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [consentGiven, setConsentGiven] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('mb-location-consent') === 'true';
        setConsentGiven(consent);

        const savedCoords = localStorage.getItem('mb-location-coords');
        if (savedCoords) {
            try {
                const parsed = JSON.parse(savedCoords);
                setCoords(parsed);
                updateProximity(parsed);
            } catch (e) {
                console.error("Failed to parse saved coords", e);
            }
        }

        if (consent) {
            requestLocation();
        } else {
            fallbackToIp();
        }
    }, []);

    const updateProximity = (currentCoords: Coordinates) => {
        const nearest = findNearestUniversity(currentCoords);
        setNearestUniversity(nearest);

        // If within 25km of any Abuja uni, we consider them in Abuja region
        const inAbuja = (nearest && nearest.distance < 25) || false;
        setIsAbuja(inAbuja);
    };

    const requestLocation = async () => {
        setLoading(true);
        setError(null);

        if (!("geolocation" in navigator)) {
            setError("Geolocation is not supported by this browser.");
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
                localStorage.setItem('mb-location-coords', JSON.stringify(newCoords));
                localStorage.setItem('mb-location-consent', 'true');
                setConsentGiven(true);
                updateProximity(newCoords);

                try {
                    // Get city/region from reverse geocode
                    const res = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${newCoords.lat}&longitude=${newCoords.lng}&localityLanguage=en`);
                    setCity(res.data.city || res.data.locality);
                    setRegion(res.data.principalSubdivision);
                } catch (e) {
                    console.error("Reverse geocode failed", e);
                }
                setLoading(false);
            },
            async (err) => {
                console.warn("Geolocation denied", err);
                setError(err.message);
                await fallbackToIp();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const fallbackToIp = async () => {
        try {
            const res = await axios.get('https://ipapi.co/json/');
            const ipCoords = { lat: res.data.latitude, lng: res.data.longitude };
            setCoords(ipCoords);
            setCity(res.data.city);
            setRegion(res.data.region);
            updateProximity(ipCoords);
        } catch (e) {
            console.error("IP Geoloc failed", e);
        } finally {
            setLoading(false);
        }
    };

    const setManualLocation = (target: UniversityNode | 'global') => {
        if (target === 'global') {
            setIsAbuja(false);
            setNearestUniversity(null);
            localStorage.setItem('mb-preferred-node', 'global');
        } else {
            setCoords(target.coords);
            setNearestUniversity({ node: target, distance: 0 });
            setIsAbuja(true);
            localStorage.setItem('mb-preferred-node', target.id);
            localStorage.setItem('mb-location-coords', JSON.stringify(target.coords));
        }
        setShowDialog(false);
    };

    return (
        <LocationContext.Provider value={{
            coords, city, region, nearestUniversity, isAbuja, loading, error, consentGiven, showDialog, setShowDialog, requestLocation, setManualLocation
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
