"use client"
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import { haversineDistance } from '../lib/geo/utils'
import { MapPin, Check, Info, Navigation, Search, Map as MapIcon, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

type Listing = { id: string; title: string; price: number; latitude: number; longitude: number; distance_km?: number }

export default function CampusMap({ initialLat, initialLon }: { initialLat: number; initialLon: number }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [radius, setRadius] = useState<number>(5)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ; (async () => {
      try {
        const L = await import('leaflet')
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
        })
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  useEffect(() => {
    if (!initialLat || !initialLon) return
    setLoading(true)
    fetch(`/api/listings/nearby?lat=${initialLat}&lon=${initialLon}&radius=${radius}`)
      .then(r => r.json())
      .then((d) => {
        setListings(d.listings || [])
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [initialLat, initialLon, radius])

  return (
    <div className="flex flex-col gap-8 p-1">
      {/* ── Control Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center border border-[#FF6200]/20">
            <Search className="h-5 w-5 text-[#FF6200]" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-[#FF6200]">Radius Filter</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Within</span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-transparent border-b border-white/20 text-[#FF6200] font-black uppercase text-sm outline-none cursor-pointer focus:border-[#FF6200] transition-colors"
              >
                <option value={1} className="bg-black">1 km</option>
                <option value={5} className="bg-black">5 km</option>
                <option value={10} className="bg-black">10 km</option>
                <option value={20} className="bg-black">20 km</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Total Results</p>
            <p className="text-xl font-black text-white italic">{listings.length} <span className="text-xs uppercase text-[#FF6200]/60 not-italic">Items</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Map Container ── */}
        <div className="lg:col-span-2 h-[500px] rounded-[2.5rem] border border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none group-hover:bg-transparent transition-all duration-500" />
          <MapContainer center={[initialLat, initialLon]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[initialLat, initialLon]}>
              <Popup>
                <div className="bg-black text-white p-2 rounded-lg font-bold text-xs">YOU ARE HERE</div>
              </Popup>
            </Marker>
            {listings.map((l) => (
              <Marker key={l.id} position={[Number(l.latitude), Number(l.longitude)]}>
                <Popup>
                  <div className="bg-black text-white p-4 rounded-2xl min-w-[200px] border border-[#FF6200]/30">
                    <p className="text-[8px] font-black text-[#FF6200] uppercase tracking-widest mb-1">Campus Listing</p>
                    <h3 className="text-sm font-black uppercase italic mb-2">{l.title}</h3>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <span className="text-lg font-black italic">₦{l.price.toLocaleString()}</span>
                      <button className="h-8 px-4 bg-[#FF6200] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all">VIEW</button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-[#FF6200] animate-spin" />
            </div>
          )}
        </div>

        {/* ── Listings Sidebar ── */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {listings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <MapIcon className="h-12 w-12 text-white/10" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">No Listings Found in Area</p>
            </div>
          ) : (
            listings.map((l) => (
              <div key={l.id} className="group relative bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#FF6200]/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-black uppercase italic tracking-tighter text-white group-hover:text-[#FF6200] transition-colors">{l.title}</h3>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-3 w-3 text-[#FF6200]" />
                      <span className="text-[10px] font-bold text-white/40">{(l.distance_km || 0).toFixed(2)} KM AWAY</span>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-[#FF6200] shadow-[0_0_10px_#FF6200]" />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-black italic text-[#FF6200]">₦{l.price.toLocaleString()}</p>
                  <Link href={`/listings/${l.id}`} className="p-3 bg-white/10 rounded-2xl group-hover:bg-[#FF6200] group-hover:text-black transition-all">
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
