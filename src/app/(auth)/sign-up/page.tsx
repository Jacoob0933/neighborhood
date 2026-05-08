'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin } from 'lucide-react'

const inputStyle = {
  width: '100%',
  borderRadius: '9999px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  padding: '12px 20px',
  fontSize: '14px',
  outline: 'none',
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'location'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function detectLocation() {
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetecting(false)
      },
      () => {
        setError('Could not detect location. Please enter manually.')
        setDetecting(false)
      }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 'account') { setStep('location'); return }

    setError('')
    setLoading(true)
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user && (city || coords)) {
      const locationUpdate: Record<string, unknown> = { city, neighborhood }
      if (coords) locationUpdate.location = `POINT(${coords.lng} ${coords.lat})`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update(locationUpdate as any).eq('id', user.id)
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <>
      <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>
        {step === 'account' ? 'Join Neighborhood' : 'Where are you?'}
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>
        {step === 'account'
          ? 'Connect with people in your neighborhood'
          : 'We use this to show you posts within 20 km'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 'account' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>FULL NAME</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  required style={inputStyle} placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>USERNAME</label>
                <input type="text" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required minLength={3} style={inputStyle} placeholder="janesmith" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" style={inputStyle} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} autoComplete="new-password" style={inputStyle} placeholder="Min 8 characters" />
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-4 text-sm font-bold transition disabled:opacity-60"
              style={{
                border: `2px dashed ${coords ? '#1d9bf0' : 'var(--border)'}`,
                background: coords ? 'rgba(29,155,240,0.08)' : 'var(--bg-2)',
                color: coords ? '#1d9bf0' : 'var(--text-2)',
              }}
            >
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {coords ? '📍 Location detected!' : 'Auto-detect my location'}
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
              <span className="mx-3 text-xs" style={{ color: 'var(--text-3)' }}>or enter manually</span>
              <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>CITY</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                style={inputStyle} placeholder="Prague" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>
                NEIGHBORHOOD <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
                style={inputStyle} placeholder="Žižkov" />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm rounded-full px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1d9bf0' }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {step === 'account' ? 'Continue →' : 'Join Neighborhood'}
        </button>
      </form>

      {step === 'account' && (
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-2)' }}>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-bold hover:underline" style={{ color: '#1d9bf0' }}>
            Sign in
          </Link>
        </p>
      )}

      {step === 'location' && (
        <button
          type="button"
          onClick={() => setStep('account')}
          className="w-full text-center text-sm mt-4 transition hover:opacity-80"
          style={{ color: 'var(--text-3)' }}
        >
          ← Back
        </button>
      )}
    </>
  )
}
