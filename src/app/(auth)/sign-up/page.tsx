'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, CheckCircle2 } from 'lucide-react'

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
  const [step, setStep] = useState<'account' | 'location' | 'check_email'>('account')
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

    // Pass ALL profile data via metadata so an auth trigger can persist it
    // even when email-confirmation is enabled (no session at signup time).
    const metadata: Record<string, unknown> = {
      username,
      full_name: fullName,
    }
    if (city) metadata.city = city
    if (neighborhood) metadata.neighborhood = neighborhood
    if (coords) {
      metadata.lat = coords.lat
      metadata.lng = coords.lng
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // No session = email confirmation required
    if (!signUpData.session) {
      setStep('check_email')
      setLoading(false)
      return
    }

    // Has session = signed in immediately. Make sure profile is set up
    // (covers case where the auth trigger isn't installed yet).
    const userId = signUpData.user?.id
    if (userId) {
      const profileData: Record<string, unknown> = {
        id: userId,
        username,
        full_name: fullName,
        city: city || null,
        neighborhood: neighborhood || null,
      }
      if (coords) {
        profileData.lat = coords.lat
        profileData.lng = coords.lng
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles').upsert(profileData, { onConflict: 'id' })
    }

    router.push('/feed')
    router.refresh()
  }

  if (step === 'check_email') {
    return (
      <>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,155,240,0.15)' }}>
            <CheckCircle2 size={32} style={{ color: '#1d9bf0' }} />
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2 text-center" style={{ color: 'var(--text)' }}>Check your email</h2>
        <p className="text-sm mb-6 text-center" style={{ color: 'var(--text-2)' }}>
          We sent a confirmation link to <span style={{ color: 'var(--text)', fontWeight: 600 }}>{email}</span>.
          Click the link in the email to activate your account.
        </p>
        <p className="text-xs mb-6 text-center" style={{ color: 'var(--text-3)' }}>
          Don&apos;t see it? Check your spam folder.
        </p>
        <Link
          href="/sign-in"
          className="block w-full text-center rounded-full py-3 text-sm font-bold transition hover:opacity-90"
          style={{ background: '#1d9bf0', color: 'white' }}
        >
          Go to sign in
        </Link>
      </>
    )
  }

  return (
    <>
      <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>
        {step === 'account' ? 'Join Neighborhood' : 'Where are you?'}
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>
        {step === 'account'
          ? 'Connect with people in your neighborhood'
          : 'We use this to show you posts within 30 km'}
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
          <p className="text-sm rounded-2xl px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
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
