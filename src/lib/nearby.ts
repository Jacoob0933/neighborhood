// Geographic helpers for the "nearby" feed filter.
//
// We deliberately do the distance filter in TypeScript instead of relying on a
// Supabase RPC. The RPC approach silently fell through to "show everything"
// whenever the function was missing or returned an error, which made buggy
// installs leak posts from outside the 30 km radius. Doing it here is bulletproof:
// as long as the `profiles` table has lat/lng for the author, the filter applies.

import type { SupabaseClient } from '@supabase/supabase-js'

export const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * Return the set of profile IDs whose lat/lng is within `radiusM` of (lat,lng).
 * Uses a bounding-box pre-filter for the SQL query, then Haversine for the
 * accurate ring filter in JS.
 *
 * Returns null if the helper can't run (caller should fall back to empty results
 * rather than show everything).
 */
export async function getNearbyAuthorIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  lat: number,
  lng: number,
  radiusM: number,
): Promise<string[] | null> {
  const map = await getNearbyAuthorDistances(supabase, lat, lng, radiusM)
  if (!map) return null
  return Object.keys(map)
}

/**
 * Same as getNearbyAuthorIds but returns a map of {authorId -> distanceMeters}.
 * Used to show distance pills on each post for debugging and UX.
 */
export async function getNearbyAuthorDistances(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  lat: number,
  lng: number,
  radiusM: number,
): Promise<Record<string, number> | null> {
  // Bounding box. 1° latitude ≈ 111 km. 1° longitude shrinks with cos(lat).
  const latDeg = radiusM / 111_000
  const cosLat = Math.max(0.01, Math.cos((lat * Math.PI) / 180))
  const lngDeg = radiusM / (111_000 * cosLat)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('lat', lat - latDeg)
    .lte('lat', lat + latDeg)
    .gte('lng', lng - lngDeg)
    .lte('lng', lng + lngDeg)

  if (error || !data) return null

  const out: Record<string, number> = {}
  for (const p of data) {
    const pLat = p.lat as number | null
    const pLng = p.lng as number | null
    if (pLat == null || pLng == null) continue
    const d = haversineMeters(lat, lng, pLat, pLng)
    if (d <= radiusM) out[p.id as string] = d
  }
  return out
}
