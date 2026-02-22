import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const CampusMap = dynamic(() => import('../../components/CampusMap'), { ssr: false })

export default function CampusIndex() {
    const [lat, setLat] = useState<number | null>(null)
    const [lon, setLon] = useState<number | null>(null)

    useEffect(() => {
        if (!navigator?.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude)
                setLon(pos.coords.longitude)
            },
            () => {
                // fallback to ip-based or default campus center (Abuja)
                setLat(9.0765)
                setLon(7.3986)
            },
            { maximumAge: 1000 * 60 * 5 }
        )
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' }}>
                <div style={{ fontWeight: 700, color: '#FF6200', fontSize: 20 }}>MarketBridge</div>
                <div style={{ color: '#FF6200', fontSize: 12, fontWeight: 800 }}>MarketBridge Campus Beta – Testing Phase</div>
            </header>

            <main style={{ padding: 28, maxWidth: 980, margin: '0 auto' }}>
                <h2 style={{ color: '#FF6200', fontSize: 22, fontWeight: 900 }}>Campus Marketplace</h2>
                <p style={{ color: '#FFFFFF', opacity: 0.9, marginTop: 8 }}>Browse verified campus listings in your area.</p>

                <div style={{ marginTop: 20 }}>
                    {lat && lon ? (
                        <CampusMap initialLat={lat} initialLon={lon} />
                    ) : (
                        <div style={{ color: '#777' }}>Detecting location…</div>
                    )}
                </div>
            </main>

            <footer style={{ padding: 18, textAlign: 'center', borderTop: '1px solid #111', marginTop: 40 }}>
                <div>
                    <a href="mailto:support@marketbridge.com.ng" style={{ color: '#FF6200', textDecoration: 'none', marginRight: 12 }}>Tech Support: support@marketbridge.com.ng</a>
                    <a href="mailto:ops-support@marketbridge.com.ng" style={{ color: '#FF6200', textDecoration: 'none' }}>Ops Support: ops-support@marketbridge.com.ng</a>
                </div>
            </footer>
        </div>
    )
}
