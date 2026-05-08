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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/feed'); router.refresh() }
  }

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

  return (
    <>
      <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>
        Sign in to Neighbr
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>
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

        {error && (
          <p className="text-sm text-red-400 rounded-xl px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--text)' }}
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
