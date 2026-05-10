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
  const [googleLoading, setGoogleLoading] = useState(false)

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

  async function signInWithGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
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
            <p className="text-sm" style={{ color: error.startsWith('✓') ? '#4ade80' : '#f87171' }}>{error}</p>
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
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1d9bf0' }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Sign in
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center my-5">
        <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
        <span className="mx-3 text-xs" style={{ color: 'var(--text-3)' }}>or</span>
        <div className="flex-grow" style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      {/* Google button below */}
      <button
        onClick={signInWithGoogle}
        disabled={loading || googleLoading}
        className="w-full flex items-center justify-center gap-3 rounded-full py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
      >
        {googleLoading
          ? <Loader2 size={16} className="animate-spin" />
          : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
        }
        Continue with Google
      </button>

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
