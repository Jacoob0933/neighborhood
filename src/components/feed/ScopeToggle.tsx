'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Globe, MapPin, Loader2, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  hasLocation: boolean
  isVerified: boolean
}

export function ScopeToggle({ hasLocation, isVerified }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const scope = params.get('scope') ?? (hasLocation ? 'nearby' : 'worldwide')
  const [detecting, setDetecting] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  function navigate(value: 'nearby' | 'worldwide') {
    const p = new URLSearchParams(params.toString())
    if (value === 'nearby') p.delete('scope')
    else p.set('scope', value)
    router.push(`${pathname}?${p.toString()}`)
  }

  async function handleNearbyClick() {
    if (hasLocation) { navigate('nearby'); return }
    if (!navigator.geolocation) {
      alert('Your browser does not support GPS. Set your location in Profile → Edit.')
      return
    }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setDetecting(false); return }
        const { error } = await supabase
          .from('profiles')
          .update({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          .eq('id', user.id)
        setDetecting(false)
        if (error) { alert('Could not save location: ' + error.message); return }
        navigate('nearby')
        router.refresh()
      },
      err => {
        setDetecting(false)
        alert('Location denied. Allow location in browser settings or set it in Profile → Edit. (' + err.message + ')')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  function handleWorldClick() {
    if (!isVerified) {
      setShowPaywall(true)
      return
    }
    navigate('worldwide')
  }

  return (
    <>
      <div
        className="flex items-center p-1 rounded-full relative z-50"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', touchAction: 'manipulation' }}
      >
        {/* 30km button */}
        <button
          type="button"
          onClick={handleNearbyClick}
          disabled={detecting}
          className="flex items-center gap-1.5 px-4 py-2 md:py-1 rounded-full text-xs font-semibold transition active:scale-95 disabled:opacity-50"
          style={{
            background: scope === 'nearby' ? 'var(--accent)' : 'transparent',
            color: scope === 'nearby' ? 'white' : 'var(--text-2)',
            minHeight: 36,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'rgba(29,155,240,0.2)',
          }}
        >
          {detecting ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
          30km
        </button>

        {/* World button */}
        <button
          type="button"
          onClick={handleWorldClick}
          className="flex items-center gap-1.5 px-4 py-2 md:py-1 rounded-full text-xs font-semibold transition active:scale-95"
          style={{
            background: scope === 'worldwide' ? 'var(--accent)' : 'transparent',
            color: scope === 'worldwide' ? 'white' : isVerified ? 'var(--text-2)' : 'var(--text-3)',
            minHeight: 36,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'rgba(29,155,240,0.2)',
          }}
        >
          <Globe size={12} />
          World
          {!isVerified && <span style={{ fontSize: 10 }}>🔒</span>}
        </button>
      </div>

      {/* Paywall modal */}
      {showPaywall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPaywall(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 relative"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 p-1 rounded-full"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,155,240,0.15)' }}>
                <CheckCircle2 size={32} style={{ color: '#1d9bf0' }} />
              </div>
            </div>

            <h3 className="text-xl font-black text-center mb-2" style={{ color: 'var(--text)' }}>
              Get Verified ✓
            </h3>
            <p className="text-sm text-center mb-5" style={{ color: 'var(--text-2)' }}>
              Verified members can post and be seen <strong style={{ color: 'var(--text)' }}>worldwide</strong> — not just within 30km.
            </p>

            {/* Perks */}
            <div className="space-y-2.5 mb-6">
              {[
                '✓ Blue checkmark next to your name',
                '✓ Your posts visible to the whole world',
                '✓ Priority visibility in World feed',
                '✓ Support the Neighbr community',
              ].map((perk, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                  {perk}
                </div>
              ))}
            </div>

            <a
              href="mailto:hello@neighbr.xyz?subject=Verified%20badge"
              className="block w-full text-center rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
            >
              Get Verified →
            </a>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-3)' }}>
              Contact us to get your account verified
            </p>
          </div>
        </div>
      )}
    </>
  )
}
