'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Globe, MapPin } from 'lucide-react'

interface Props {
  hasLocation: boolean
}

export function ScopeToggle({ hasLocation }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const scope = params.get('scope') ?? (hasLocation ? 'nearby' : 'worldwide')

  function setScope(value: 'nearby' | 'worldwide') {
    const p = new URLSearchParams(params.toString())
    if (value === 'nearby') p.delete('scope')
    else p.set('scope', value)
    router.push(`${pathname}?${p.toString()}`)
  }

  return (
    <div
      className="flex items-center p-1 rounded-full relative z-50"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        touchAction: 'manipulation',
      }}
    >
      <button
        type="button"
        onClick={() => setScope('nearby')}
        disabled={!hasLocation}
        className="flex items-center gap-1.5 px-4 py-2 md:py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        style={{
          background: scope === 'nearby' ? 'var(--accent)' : 'transparent',
          color: scope === 'nearby' ? 'white' : 'var(--text-2)',
          minHeight: 36,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'rgba(29,155,240,0.2)',
        }}
      >
        <MapPin size={12} />
        30km
      </button>
      <button
        type="button"
        onClick={() => setScope('worldwide')}
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
