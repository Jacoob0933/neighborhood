'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Globe, MapPin, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  hasLocation: boolean
  isVerified: boolean
}

export function ScopeToggle({ hasLocation, isVerified: _isVerified }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const scope = params.get('scope') ?? (hasLocation ? 'nearby' : 'worldwide')
  const [detecting, setDetecting] = useState(false)

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

  return (
    <div
      className="flex items-center p-1 rounded-full relative z-50"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', touchAction: 'manipulation' }}
    >
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

      <button
        type="button"
        onClick={() => navigate('worldwide')}
        className="flex items-center gap-1.5 px-4 py-2 md:py-1 rounded-full text-xs font-semibold transition active:scale-95"
        style={{
          background: scope === 'worldwide' ? 'var(--accent)' : 'transparent',
          color: scope === 'worldwide' ? 'white' : 'var(--text-2)',
          minHeight: 36,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'rgba(29,155,240,0.2)',
        }}
      >
        <Globe size={12} />
        World
      </button>
    </div>
  )
}
