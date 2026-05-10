'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const categories = [
  { value: 'all',         label: 'For You',      emoji: '✨', color: '#1d9bf0' },
  { value: 'general',     label: 'General',      emoji: '💬', color: '#58a6ff' },
  { value: 'events',      label: 'Events',       emoji: '🎉', color: '#c084fc' },
  { value: 'marketplace', label: 'Marketplace',  emoji: '🛍️', color: '#fbbf24' },
  { value: 'lost_found',  label: 'Lost & Found', emoji: '🔍', color: '#f87171' },
  { value: 'promo',       label: 'Promo',        emoji: '📢', color: '#4ade80' },
]

export function CategoryFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('category') ?? 'all'

  function select(value: string) {
    const p = new URLSearchParams(params.toString())
    if (value === 'all') p.delete('category')
    else p.set('category', value)
    router.push(`/feed?${p.toString()}`)
  }

  return (
    <div className="flex overflow-x-auto no-scrollbar">
      {categories.map(({ value, label, emoji, color }) => {
        const active = current === value
        return (
          <button
            key={value}
            onClick={() => select(value)}
            className="relative shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm transition-all"
            style={{
              color: active ? color : 'var(--text-3)',
              fontWeight: active ? 600 : 400,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <span style={{ fontSize: 13 }}>{emoji}</span>
            {label}
            {active && (
              <span
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                style={{ background: color }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
