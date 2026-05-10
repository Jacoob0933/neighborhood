'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Pre-fill name from Google
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/sign-in'); return }
      const meta = data.user.user_metadata ?? {}
      setName(meta.full_name ?? meta.name ?? '')
      setAvatarUrl(meta.avatar_url ?? meta.picture ?? '')
    })
  }, [router])

  function detectLocation() {
    setDetecting(true)
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support GPS.')
      setDetecting(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetecting(false)
      },
      err => {
        if (err.code === 1) setGpsError('Permission denied. Allow location in browser settings.')
        else if (err.code === 2) setGpsError('Location unavailable. Make sure GPS is on.')
        else setGpsError('Timed out. Try again.')
        setDetecting(false)
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false }
    )
  }

  async function handleContinue() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const update: Record<string, unknown> = {}
    if (coords) { update.lat = coords.lat; update.lng = coords.lng }

    if (Object.keys(update).length > 0) {
      await supabase.from('profiles').update(update).eq('id', user.id)
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <>
      {/* Avatar from Google */}
      {avatarUrl && (
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full" referrerPolicy="no-referrer" />
        </div>
      )}

      <h2 className="text-2xl font-black mb-1 text-center" style={{ color: 'var(--text)' }}>
        Hey{name ? `, ${name.split(' ')[0]}` : ''}! 👋
      </h2>
      <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-2)' }}>
        One last step — let us know where you are so we can show you posts nearby.
      </p>

      {/* GPS button */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={detecting}
        className="w-full flex items-center justify-center gap-3 rounded-full px-4 py-5 text-sm font-bold transition disabled:opacity-60 mb-4"
        style={{
          border: `2px dashed ${coords ? '#1d9bf0' : gpsError ? '#ef4444' : 'var(--border)'}`,
          background: coords ? 'rgba(29,155,240,0.08)' : gpsError ? 'rgba(239,68,68,0.06)' : 'var(--bg-2)',
          color: coords ? '#1d9bf0' : gpsError ? '#f87171' : 'var(--text-2)',
        }}
      >
        {detecting ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
        {detecting ? 'Detecting location…' : coords ? '📍 Location detected!' : gpsError ? 'Try again' : 'Auto-detect my location'}
      </button>

      {gpsError && <p className="text-xs text-center mb-3 px-2" style={{ color: '#f87171' }}>{gpsError}</p>}
      {coords && <p className="text-xs text-center mb-3" style={{ color: 'var(--text-3)' }}>✓ You&apos;ll see posts within 30 km.</p>}
      {!coords && !detecting && !gpsError && (
        <p className="text-xs text-center mb-3" style={{ color: 'var(--text-3)' }}>You can set this later in profile settings.</p>
      )}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: '#1d9bf0' }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {coords ? 'Go to Neighborhood →' : 'Skip for now →'}
      </button>
    </>
  )
}
