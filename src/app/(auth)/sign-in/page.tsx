'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        setError('not_confirmed')
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
        setError('Wrong email or password. Try again.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      router.push('/feed')
      router.refresh()
    }
  }

  async function resendConfirmation() {
    if (!email) { setError('Enter your email above first.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setError('✓ Confirmation email sent! Check your inbox.')
    setLoading(false)
  }

  async function signInWithProvider(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <>
      <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>
        Sign in to Neighborhood
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
        Stay connected with your community
      </p>

      {/* OAuth buttons */}
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
        <span className="mx-3 text-xs" style={{ color: 'var(--text-3)' }}>or sign in with email</span>
        <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>

        {error && error !== 'not_confirmed' && (
          <div className="rounded-2xl px-4 py-2.5" style={{ background: error.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
            <p className="text-sm" style={{ color: error.startsWith('✓') ? '#4ade80' : '#f87171' }}>
              {error}
            </p>
          </div>
        )}

        {error === 'not_confirmed' && (
          <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <p className="text-sm mb-2" style={{ color: '#f87171' }}>
              Your email isn&apos;t confirmed yet. Check your inbox (and spam).
            </p>
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={loading}
              className="text-xs font-bold underline flex items-center gap-1"
              style={{ color: '#1d9bf0' }}
            >
              {loading && <Loader2 size={11} className="animate-spin" />}
              Resend confirmation email
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!oauthLoading}
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1d9bf0' }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Sign in
        </button>
      </form>

      <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-bold hover:underline" style={{ color: '#1d9bf0' }}>
            Sign up
          </Link>
        </p>
      </div>
    </>
  )
}
