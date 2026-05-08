'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin } from 'lucide-react'

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
      options: {
        data: { username, full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Update profile with location
    const { data: { user } } = await supabase.auth.getUser()
    if (user && (city || coords)) {
      const locationUpdate: Record<string, unknown> = { city, neighborhood }
      if (coords) {
        // PostGIS geography stored as WKT
        locationUpdate.location = `POINT(${coords.lng} ${coords.lat})`
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update(locationUpdate as any).eq('id', user.id)
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        {step === 'account' ? 'Create your account' : 'Where are you?'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {step === 'account'
          ? 'Join your neighborhood community'
          : 'We use this to show you local posts within 20km'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 'account' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  minLength={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  placeholder="janesmith"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                placeholder="Min 8 characters"
              />
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-300 bg-green-50 px-4 py-4 text-sm font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-60"
            >
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {coords ? '📍 Location detected!' : 'Auto-detect my location'}
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-3 text-xs text-gray-400 shrink-0">or enter manually</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                placeholder="San Francisco"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Neighborhood <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                placeholder="Mission District"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {step === 'account' ? 'Continue →' : 'Join Neighborhood'}
        </button>
      </form>

      {step === 'account' && (
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      )}

      {step === 'location' && (
        <button
          type="button"
          onClick={() => setStep('account')}
          className="w-full text-center text-sm text-gray-500 mt-4 hover:text-gray-700 transition"
        >
          ← Back
        </button>
      )}
    </>
  )
}
