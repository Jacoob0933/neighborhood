'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

export default function EditProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      }
      setLoading(false)
    }
    load()
  }, [router])

  function detectLocation() {
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetectingLocation(false)
      },
      () => setDetectingLocation(false)
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
      full_name: fullName,
      username,
      bio,
      city,
      neighborhood,
      updated_at: new Date().toISOString(),
    }

    if (coords) {
      update.location = `POINT(${coords.lng} ${coords.lat})`
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
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
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Edit Profile</h1>
        </div>
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
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={inputStyle}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              required
              minLength={3}
              style={inputStyle}
              placeholder="username"
            />
          </div>
        </div>

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

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>GPS LOCATION</label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition"
            style={{
              background: coords ? 'rgba(29,155,240,0.12)' : 'var(--bg-2)',
              border: `1px solid ${coords ? '#1d9bf0' : 'var(--border)'}`,
              color: coords ? '#1d9bf0' : 'var(--text-2)',
            }}
          >
            {detectingLocation ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Update GPS location'}
          </button>
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
