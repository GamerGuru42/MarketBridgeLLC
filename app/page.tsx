"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
    const router = useRouter()
    const publicEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SECTION === 'true'

    const [consentVisible, setConsentVisible] = useState(true)
    const [userLocation, setUserLocation] = useState<{ city?: string; region?: string; lat?: number; lon?: number } | null>(null)
    const [highlightCampus, setHighlightCampus] = useState(false)

    // Auto-redirect logged in users to appropriate section
    useEffect(() => {
        ;(async () => {
            try {
                const supabase = createClient()
                const { data: sessionData } = await supabase.auth.getSession()
                const session = sessionData?.session
                if (session?.user) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('id,university,is_verified_seller,role')
                        .eq('id', session.user.id)
                        .single()

                    if (user) {
                        // Seller/student users -> campus
                        if (user.role === 'student_seller' || user.university) {
                            router.replace('/campus')
                            return
                        }

                        // Otherwise, if public enabled, send to public
                        if (publicEnabled) {
                            router.replace('/public')
                            return
                        }

                        // Default to campus when public is disabled
                        router.replace('/campus')
                        return
                    }
                }
            } catch (e) {
                console.error('Auto-redirect failed', e)
            }
        })()
    }, [router, publicEnabled])

    // Location detection flow triggered when consent modal accepted
    useEffect(() => {
        let cancelled = false
        const runIpLookup = async () => {
            try {
                const res = await fetch('https://ipapi.co/json')
                const data = await res.json()
                if (!cancelled) setUserLocation({ city: data.city, region: data.region, lat: Number(data.latitude), lon: Number(data.longitude) })
            } catch (e) {
                if (!cancelled) setUserLocation(null)
            }
        }

        if (!consentVisible) {
            // try browser geolocation first
            if (navigator?.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (p) => {
                        if (cancelled) return
                        setUserLocation({ lat: p.coords.latitude, lon: p.coords.longitude })
                    },
                    () => runIpLookup(),
                    { maximumAge: 1000 * 60 * 5, timeout: 5000 }
                )
            } else {
                runIpLookup()
            }
        }

        return () => { cancelled = true }
    }, [consentVisible])

    // If location is Abuja or near known campuses, emphasize campus card
    useEffect(() => {
        if (!userLocation) return
        const city = (userLocation.city || '').toLowerCase()
        if (city.includes('abuja') || city.includes('fct') || city.includes('federal capital')) {
            setHighlightCampus(true)
            return
        }

        // simple radius check around Abuja center
        if (userLocation.lat && userLocation.lon) {
            const dLat = Math.abs(userLocation.lat - 9.0765)
            const dLon = Math.abs(userLocation.lon - 7.3986)
            if (dLat <= 0.5 && dLon <= 0.8) setHighlightCampus(true)
        }
    }, [userLocation])

    return (
        <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <main style={{ width: '100%', maxWidth: 1100, padding: 28 }}>
                <h1 style={{ color: '#FF6200', fontSize: 36, fontWeight: 900, textAlign: 'center', marginBottom: 24 }}>CHOOSE YOUR MARKETPLACE</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                        <div
                            role="button"
                            onClick={() => router.push('/campus')}
                            aria-label="Enter Campus Marketplace"
                            style={{
                                background: '#000',
                                border: `2px solid ${highlightCampus ? '#FF6200' : '#222'}`,
                                padding: 28,
                                borderRadius: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>Campus Marketplace (Students Only)</div>
                            <div style={{ color: '#FFFFFF', opacity: 0.9 }}>Buy & sell safely with verified student sellers in Abuja universities</div>
                            <div style={{ marginTop: 8 }}>
                                <button style={{ background: '#FF6200', color: '#FFFFFF', border: 'none', padding: '12px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 800 }}>ENTER CAMPUS</button>
                            </div>
                        </div>
                    </div>

                    {publicEnabled && (
                        <div
                            role="button"
                            onClick={() => router.push('/public')}
                            aria-label="Enter Public Marketplace"
                            style={{
                                background: '#000',
                                border: '2px solid #222',
                                padding: 28,
                                borderRadius: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>Public Marketplace</div>
                            <div style={{ color: '#FFFFFF', opacity: 0.9 }}>Buy & sell anything in Nigeria – open to everyone</div>
                            <div style={{ marginTop: 8 }}>
                                <button style={{ background: '#FF6200', color: '#FFFFFF', border: 'none', padding: '12px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 800 }}>ENTER PUBLIC</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Consent modal (simple, no extra text) */}
                {consentVisible && (
                    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                        <div style={{ background: '#000', border: '2px solid #FF6200', padding: 20, borderRadius: 12, width: 480, maxWidth: '94%' }}>
                            <div style={{ fontWeight: 800, color: '#FF6200', marginBottom: 8 }}>Allow location to show nearby campus listings?</div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button onClick={() => setConsentVisible(false)} style={{ background: '#111', color: '#FFFFFF', padding: '8px 12px', borderRadius: 8, border: '1px solid #222' }}>Deny</button>
                                <button onClick={() => setConsentVisible(false)} style={{ background: '#FF6200', color: '#FFFFFF', padding: '8px 12px', borderRadius: 8 }}>Allow</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
