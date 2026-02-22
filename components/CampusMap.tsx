"use client"
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import { haversineDistance } from '../lib/geo/utils'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

type Listing = { id: string; title: string; price: number; latitude: number; longitude: number; distance_km?: number }

export default function CampusMap({ initialLat, initialLon }: { initialLat: number; initialLon: number }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [radius, setRadius] = useState<number>(5)

  useEffect(() => {
    // Ensure Leaflet default icon URLs are set when using Next.js/static builds
    ;(async () => {
      try {
        const L = await import('leaflet')
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: (await import('leaflet/dist/images/marker-icon-2x.png')).default || '/marker-icon-2x.png',
          iconUrl: (await import('leaflet/dist/images/marker-icon.png')).default || '/marker-icon.png',
          shadowUrl: (await import('leaflet/dist/images/marker-shadow.png')).default || '/marker-shadow.png',
        })
      } catch (e) {
        // ignore if assets not resolvable in build; fallback icons OK
      }
    })()
  }, [])

  useEffect(() => {
    if (!initialLat || !initialLon) return
    fetch(`/api/listings/nearby?lat=${initialLat}&lon=${initialLon}&radius=${radius}`)
      .then(r => r.json())
      .then((d) => {
        setListings(d.listings || [])
      })
      .catch(() => setListings([]))
  }, [initialLat, initialLon, radius])

  // Cluster listings simply on the client without external deps
  function clusterListings(items: Listing[], clusterKm = 0.5) {
    const clusters: Array<{ lat: number; lon: number; items: Listing[] }> = []
    for (const it of items) {
      let placed = false
      for (const c of clusters) {
        const d = haversineDistance(c.lat, c.lon, Number(it.latitude), Number(it.longitude))
        if (d <= clusterKm) {
          c.items.push(it)
          // update cluster center (simple average)
          const lats = c.items.reduce((s, x) => s + Number(x.latitude), 0) / c.items.length
          const lons = c.items.reduce((s, x) => s + Number(x.longitude), 0) / c.items.length
          c.lat = lats
          c.lon = lons
          placed = true
          break
        }
      }
      if (!placed) {
        clusters.push({ lat: Number(it.latitude), lon: Number(it.longitude), items: [it] })
      }
    }
    return clusters
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ color: '#FF6200', fontWeight: 800 }}>Within</label>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ padding: 8, borderRadius: 8 }}>
          <option value={1}>1 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
        </select>
        <div style={{ color: '#FFFFFF', marginLeft: 'auto' }}>{listings.length} listings</div>
      </div>

      <div style={{ height: 320, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer center={[initialLat, initialLon]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[initialLat, initialLon]}>
            <Popup>You are here</Popup>
          </Marker>
          {listings.map((l) => (
            <Marker key={l.id} position={[Number(l.latitude), Number(l.longitude)]}>
              <Popup>
                <div style={{ color: '#000' }}>
                  <strong>{l.title}</strong>
                  <div>₦{l.price}</div>
                  <div>{(l.distance_km || 0).toFixed(2)} km</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {listings.map((l) => (
          <div key={l.id} style={{ background: '#111', border: '1px solid #222', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#FFFFFF', fontWeight: 800 }}>{l.title}</div>
            <div style={{ color: '#FF6200', fontWeight: 900 }}>₦{l.price}</div>
            <div style={{ color: '#999' }}>{(l.distance_km || 0).toFixed(2)} km away</div>
          </div>
        ))}
      </div>
    </div>
  )
}
