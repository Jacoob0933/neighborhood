'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, CheckCircle2, RefreshCw } from 'lucide-react'

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

  function detectLocation() {
    setDetecting(true)
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support GPS. Try a different browser.')
      setDetecting(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetecting(false)
      },
      err => {
        if (err.code === 1) {
          setGpsError('Permission denied. Allow location access in your browser settings and try again.')
        } else if (err.code === 2) {
          setGpsError('Location unavailable. Make sure GPS is on and try again.')
        } else {
          setGpsError('Location request timed out. Try again.')
        }
        setDetecting(false)
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false }
    )
  }

  async function signInWithProvider(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 'account') { setStep('location'); return }

    setError('')
    setLoading(true)
    const supabase = createClient()

    const metadata: Record<string, unknown> = { username, full_name: fullName }
    if (coords) { metadata.lat = coords.lat; metadata.lng = coords.lng }

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

    if (!signUpData.session) {
      setStep('check_email')
      setLoading(false)
      return
    }

    const userId = signUpData.user?.id
    if (userId) {
      const profileData: Record<string, unknown> = { id: userId, username, full_name: fullName }
      if (coords) { profileData.lat = coords.lat; profileData.lng = coords.lng }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles').upsert(profileData, { onConflict: 'id' })
    }

    router.push('/feed')
    router.refresh()
  }

  async function resendEmail() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
  }

  // ── Check email screen ────────────────────────────────────────────────────
  if (step === 'check_email') {
    return (
      <>
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,155,240,0.15)' }}>
            <CheckCircle2 size={32} style={{ color: '#1d9bf0' }} />
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2 text-center" style={{ color: 'var(--text)' }}>Check your email</h2>
        <p className="text-sm mb-2 text-center" style={{ color: 'var(--text-2)' }}>
          We sent a confirmation link to{' '}
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{email}</span>.
        </p>
        <p className="text-xs mb-6 text-center" style={{ color: 'var(--text-3)' }}>
          Don&apos;t see it? Check spam. Links expire after 24 hours.
        </p>

        <Link
          href="/sign-in"
          className="block w-full text-center rounded-full py-3 text-sm font-bold transition hover:opacity-90 mb-3"
          style={{ background: '#1d9bf0', color: 'white' }}
        >
          Go to sign in
        </Link>

        <button
          onClick={resendEmail}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition hover:opacity-80 disabled:opacity-50"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'transparent' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Resend confirmation email
        </button>
      </>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <>
      <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>
        {step === 'account' ? 'Join Neighborhood' : 'Where are you?'}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
        {step === 'account'
          ? 'Connect with people in your neighborhood'
          : 'We use your location to show posts within 30 km'}
      </p>

      {/* OAuth — only on account step */}
      {step === 'account' && (
        <>
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => signInWithProvider('google')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 rounded-full py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
            >
              {oauthLoading === 'google'
                ? <Loader2 size={16} className="animate-spin" />
                : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              }
              Continue with Google
            </button>

            <button
              onClick={() => signInWithProvider('apple')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 rounded-full py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
            >
              {oauthLoading === 'apple'
                ? <Loader2 size={16} className="animate-spin" />
                : <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.8-107.7C103.6 740.3 69 665.2 69 593.9c0-199 129.4-303.5 256.5-303.5 66.1 0 121.2 43.4 162.6 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
              }
              Continue with Apple
            </button>
          </div>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
            <span className="mx-3 text-xs" style={{ color: 'var(--text-3)' }}>or sign up with email</span>
            <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
          </div>
        </>
      )}

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
          /* ── Location step — auto-detect only ── */
          <div className="space-y-4">
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-3 rounded-full px-4 py-5 text-sm font-bold transition disabled:opacity-60"
              style={{
                border: `2px dashed ${coords ? '#1d9bf0' : gpsError ? '#ef4444' : 'var(--border)'}`,
                background: coords ? 'rgba(29,155,240,0.08)' : gpsError ? 'rgba(239,68,68,0.06)' : 'var(--bg-2)',
                color: coords ? '#1d9bf0' : gpsError ? '#f87171' : 'var(--text-2)',
              }}
            >
              {detecting
                ? <Loader2 size={18} className="animate-spin" />
                : coords
                  ? <MapPin size={18} style={{ color: '#1d9bf0' }} />
                  : <MapPin size={18} />
              }
              {detecting
                ? 'Detecting location…'
                : coords
                  ? '📍 Location detected!'
                  : gpsError
                    ? 'Try again'
                    : 'Auto-detect my location'}
            </button>

            {gpsError && (
              <p className="text-xs text-center px-2" style={{ color: '#f87171' }}>
                {gpsError}
              </p>
            )}

            {coords && (
              <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
                ✓ GPS coordinates saved. You&apos;ll see posts within 30 km.
              </p>
            )}

            {!coords && !detecting && (
              <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
                You can also set this later in your profile settings.
              </p>
            )}
          </div>
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
