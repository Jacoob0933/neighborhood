'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const categories = [
  { value: 'all', label: 'For You' },
  { value: 'general', label: '💬 General' },
  { value: 'events', label: '🎉 Events' },
  { value: 'marketplace', label: '🛍️ Marketplace' },
  { value: 'lost_found', label: '🔍 Lost & Found' },
  { value: 'promo', label: '📢 Promo' },
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
    <div className="flex overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--border)' }}>
      {categories.map(({ value, label }) => {
        const active = current === value
        return (
          <button
            key={value}
            onClick={() => select(value)}
            className="relative shrink-0 px-4 py-3.5 text-sm transition-colors"
            style={{
              color: active ? 'var(--text)' : 'var(--text-3)',
              fontWeight: active ? 600 : 400,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)' }}
          >
            {label}
            {active && (
              <span
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
