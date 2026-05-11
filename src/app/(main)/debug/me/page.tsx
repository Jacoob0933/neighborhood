import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getNearbyAuthorDistances, haversineMeters } from '@/lib/nearby'

const RADIUS_M = 30_000

// Tiny diagnostic page to find out exactly what GPS state both test accounts have
// and why the nearby filter sees / doesn't see another user.
//
// Open `/debug/me` from each account. It shows:
//  - your own profile's saved lat/lng
//  - every OTHER profile in the DB with their lat/lng
//  - the great-circle distance from you to each of them
//  - whether they fall inside the 30km radius
//
// This tells you instantly whether (a) the other account actually has GPS
// saved, (b) the saved coordinates are wrong, or (c) the math is correct
// and you're really within 30km of each other.

export default async function DebugMePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div style={{ padding: 32, color: '#ccc' }}>Sign in first.</div>
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('id, username, full_name, lat, lng, city, neighborhood, verified, location_updated_at')
    .eq('id', user.id)
    .single()

  const { data: others } = await supabase
    .from('profiles')
    .select('id, username, full_name, lat, lng, city, neighborhood, verified')
    .neq('id', user.id)

  const myLat = me?.lat as number | null
  const myLng = me?.lng as number | null

  const nearbyMap = myLat != null && myLng != null
    ? await getNearbyAuthorDistances(supabase, myLat, myLng, RADIUS_M)
    : null

  return (
    <div style={{ padding: '20px 16px 60px', color: '#dde' }}>
      <Link href="/feed" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: '#1d9bf0', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        marginBottom: 16,
      }}>
        <ArrowLeft size={14} /> Back to feed
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#fff' }}>
        GPS Debug
      </h1>
      <p style={{ fontSize: 13, color: '#789', marginBottom: 24 }}>
        Radius: 30 km · Haversine in TypeScript
      </p>

      <Section title="YOU">
        <Row label="username" value={me?.username ?? '—'} />
        <Row label="full name" value={me?.full_name ?? '—'} />
        <Row label="city" value={me?.city ?? '—'} />
        <Row label="neighborhood" value={me?.neighborhood ?? '—'} />
        <Row
          label="gps"
          value={myLat != null && myLng != null ? 'saved ✓' : '— NOT SET'}
          warn={myLat == null || myLng == null}
        />
        <Row label="verified" value={me?.verified ? 'yes' : 'no'} />
        <Row label="location_updated_at" value={me?.location_updated_at ?? '—'} mono />
      </Section>

      <Section title={`OTHER USERS (${others?.length ?? 0})`}>
        {(others ?? []).length === 0 && (
          <p style={{ color: '#789', fontSize: 13 }}>No other profiles in the DB.</p>
        )}
        {(others ?? []).map(o => {
          const oLat = o.lat as number | null
          const oLng = o.lng as number | null
          const hasGps = oLat != null && oLng != null
          const dist = hasGps && myLat != null && myLng != null
            ? haversineMeters(myLat, myLng, oLat as number, oLng as number)
            : null
          const inRadius = dist != null && dist <= RADIUS_M
          return (
            <div key={o.id} style={{
              padding: '10px 12px',
              marginBottom: 8,
              border: `1px solid ${inRadius ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background: inRadius ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>
                {o.full_name ?? o.username ?? o.id}
                {o.verified ? ' ✓' : ''}
              </div>
              <div style={{ color: '#789', fontSize: 12 }}>
                {o.city ?? '—'}{o.neighborhood ? ` · ${o.neighborhood}` : ''}
              </div>
              <div style={{ color: hasGps ? '#aab' : '#f87171', fontSize: 12, marginTop: 4 }}>
                {hasGps ? 'GPS: saved ✓' : 'NO GPS — would not appear in nearby feed'}
              </div>
              {dist != null && (
                <div style={{
                  display: 'inline-block',
                  marginTop: 6,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: inRadius ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.15)',
                  color: inRadius ? '#4ade80' : '#f87171',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {(dist / 1000).toFixed(2)} km {inRadius ? '· within 30km ✓' : '· outside 30km ✗'}
                </div>
              )}
            </div>
          )
        })}
      </Section>

      <Section title="NEARBY FILTER RESULT">
        {nearbyMap == null ? (
          <p style={{ color: '#f87171', fontSize: 13 }}>
            Helper returned null — could not query profiles.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: '#aab' }}>
            {Object.keys(nearbyMap).length} author(s) qualify as nearby.
            Posts from these authors are the ONLY ones shown in nearby feed.
          </p>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      marginBottom: 28,
      padding: 16,
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.025)',
    }}>
      <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: '#789', marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value, mono, warn }: { label: string; value: string; mono?: boolean; warn?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      fontSize: 13,
    }}>
      <span style={{ color: '#789', fontSize: 12 }}>{label}</span>
      <span style={{
        color: warn ? '#f87171' : '#dde',
        fontFamily: mono ? 'monospace' : 'inherit',
        textAlign: 'right',
        wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  )
}
