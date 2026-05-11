'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, addDays, format } from 'date-fns'

const inputStyle = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
}

const lockedStyle = {
  ...inputStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
}

export default function EditProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [savedCoords, setSavedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Lock state
  const [fullNameLocked, setFullNameLocked] = useState(false)
  const [usernameUpdatedAt, setUsernameUpdatedAt] = useState<string | null>(null)
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null)
  const [hasExistingLocation, setHasExistingLocation] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name ?? '')
        setUsername(profile.username ?? '')
        setBio(profile.bio ?? '')
        setCity(profile.city ?? '')
        setNeighborhood(profile.neighborhood ?? '')
        setFullNameLocked(profile.full_name_locked ?? false)
        setUsernameUpdatedAt(profile.username_updated_at ?? null)
        setLocationUpdatedAt(profile.location_updated_at ?? null)
        const hasLoc = profile.lat != null && profile.lng != null
        setHasExistingLocation(hasLoc)
        if (hasLoc) {
          setSavedCoords({ lat: profile.lat as number, lng: profile.lng as number })
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  // Username cooldown: can change every 3 days
  const usernameCanChange = !usernameUpdatedAt ||
    differenceInDays(new Date(), new Date(usernameUpdatedAt)) >= 3

  const usernameNextChange = usernameUpdatedAt
    ? addDays(new Date(usernameUpdatedAt), 3)
    : null

  // GPS cooldown: can update every 30 days (after first save)
  const GPS_COOLDOWN_DAYS = 30
  const locationCanChange = !hasExistingLocation || !locationUpdatedAt ||
    differenceInDays(new Date(), new Date(locationUpdatedAt)) >= GPS_COOLDOWN_DAYS

  const locationNextChange = locationUpdatedAt && hasExistingLocation
    ? addDays(new Date(locationUpdatedAt), GPS_COOLDOWN_DAYS)
    : null

  function detectLocation() {
    if (!locationCanChange) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetectingLocation(false)
      },
      () => setDetectingLocation(false),
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const update: Record<string, unknown> = {
      bio,
      city,
      neighborhood,
      updated_at: new Date().toISOString(),
    }

    // Full name — only save if not locked
    if (!fullNameLocked) {
      update.full_name = fullName
      if (fullName.trim()) {
        update.full_name_locked = true
      }
    }

    // Username — only save if cooldown passed
    if (usernameCanChange) {
      update.username = username
      update.username_updated_at = new Date().toISOString()
    }

    if (coords && locationCanChange) {
      update.lat = coords.lat
      update.lng = coords.lng
      update.location_updated_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)

    if (updateError) {
      if (updateError.message.includes('profiles_username_unique') || updateError.message.includes('duplicate key')) {
        setError('This username is already taken. Please choose a different one.')
      } else {
        setError(updateError.message)
      }
      setSaving(false)
      return
    }

    router.push('/profile/me')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="animate-spin" size={28} style={{ color: '#1d9bf0' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/profile/me"
          className="flex items-center justify-center w-9 h-9 rounded-full transition hover:opacity-80"
          style={{ color: 'var(--text)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Edit Profile</h1>
        <div className="flex-1" />
        <button
          form="edit-form"
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1d9bf0' }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>

      <form id="edit-form" onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">

          {/* Full name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>FULL NAME</label>
              {fullNameLocked && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                  <Lock size={10} /> permanent
                </span>
              )}
            </div>
            <input
              type="text"
              value={fullName}
              onChange={e => !fullNameLocked && setFullName(e.target.value)}
              readOnly={fullNameLocked}
              style={fullNameLocked ? lockedStyle : inputStyle}
              placeholder="Your name"
            />
            {!fullNameLocked && fullName.trim() && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                ⚠️ After saving, this cannot be changed
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>USERNAME</label>
              {!usernameCanChange && usernameNextChange && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                  <Lock size={10} /> {format(usernameNextChange, 'MMM d')}
                </span>
              )}
            </div>
            <input
              type="text"
              value={username}
              onChange={e => usernameCanChange && setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              readOnly={!usernameCanChange}
              required
              minLength={3}
              style={!usernameCanChange ? lockedStyle : inputStyle}
              placeholder="username"
            />
            {!usernameCanChange && usernameNextChange && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                Can change on {format(usernameNextChange, 'MMMM d')}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>BIO</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            style={{ ...inputStyle, resize: 'none' }}
            placeholder="Tell your neighbors about yourself…"
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-3)' }}>{bio.length}/200</p>
        </div>

        {/* City + Neighborhood */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>CITY</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              style={inputStyle}
              placeholder="Prague"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>NEIGHBORHOOD</label>
            <input
              type="text"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              style={inputStyle}
              placeholder="Žižkov"
            />
          </div>
        </div>

        {/* GPS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>GPS LOCATION</label>
            {!locationCanChange && locationNextChange && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                <Lock size={10} /> can update {format(locationNextChange, 'MMM d')}
              </span>
            )}
          </div>
          {/* Current saved location pill — always visible when coords exist */}
          {savedCoords && !coords && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 text-xs"
              style={{ background: 'rgba(29,155,240,0.08)', border: '1px solid rgba(29,155,240,0.2)' }}
            >
              <MapPin size={12} style={{ color: '#1d9bf0', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-2)' }}>
                Saved GPS:&nbsp;
                <span className="font-mono font-semibold" style={{ color: '#1d9bf0' }}>
                  {savedCoords.lat.toFixed(5)}, {savedCoords.lng.toFixed(5)}
                </span>
              </span>
              <a
                href={`https://www.google.com/maps?q=${savedCoords.lat},${savedCoords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs underline shrink-0"
                style={{ color: '#1d9bf0' }}
              >
                View
              </a>
            </div>
          )}

          {/* New location just detected */}
          {coords && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 text-xs"
              style={{ background: 'rgba(0,186,124,0.08)', border: '1px solid rgba(0,186,124,0.3)' }}
            >
              <MapPin size={12} style={{ color: '#00ba7c', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-2)' }}>
                New GPS:&nbsp;
                <span className="font-mono font-semibold" style={{ color: '#00ba7c' }}>
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setCoords(null)}
                className="ml-auto text-xs shrink-0"
                style={{ color: 'var(--text-3)' }}
              >
                ✕ Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation || !locationCanChange}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition"
            style={{
              background: !locationCanChange ? 'var(--bg-2)' : 'var(--bg-2)',
              border: `1px solid ${!locationCanChange ? 'var(--border)' : 'var(--border)'}`,
              color: !locationCanChange ? 'var(--text-3)' : 'var(--text-2)',
              opacity: !locationCanChange ? 0.5 : 1,
              cursor: !locationCanChange ? 'not-allowed' : 'pointer',
            }}
          >
            {detectingLocation ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {!locationCanChange
              ? `Locked until ${locationNextChange ? format(locationNextChange, 'MMM d, yyyy') : '...'}`
              : coords
                ? 'Detect again'
                : hasExistingLocation
                  ? 'Update GPS'
                  : 'Detect location'}
          </button>
          {!locationCanChange && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              GPS can be updated once every {GPS_COOLDOWN_DAYS} days to prevent misuse.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(249,24,128,0.1)', color: '#f91880' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Link
            href="/profile/me"
            className="flex-1 text-center rounded-full px-4 py-3 text-sm font-bold transition hover:opacity-80"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1d9bf0' }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
