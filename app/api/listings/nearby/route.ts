import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase/server'
import { haversineDistance } from '../../../../lib/geo/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lon = parseFloat(searchParams.get('lon') || '')
  const radius = parseFloat(searchParams.get('radius') || '5') // km

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient({})

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id,title,price,latitude,longitude,created_at')
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = (listings || [])
    .filter((l: any) => l.latitude != null && l.longitude != null)
    .map((l: any) => {
      const dist = haversineDistance(lat, lon, Number(l.latitude), Number(l.longitude))
      return { ...l, distance_km: dist }
    })
    .filter((l: any) => l.distance_km <= radius)
    .sort((a: any, b: any) => a.distance_km - b.distance_km)

  return NextResponse.json({ listings: results })
}
