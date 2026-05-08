'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const categories = [
  { value: 'all', label: 'For You' },
  { value: 'general', label: 'General' },
  { value: 'events', label: 'Events' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'lost_found', label: 'Lost & Found' },
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
      {categories.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => select(value)}
          className="relative shrink-0 px-5 py-4 text-sm font-medium transition-colors"
          style={{
            color: current === value ? 'var(--text)' : 'var(--text-2)',
            fontWeight: current === value ? 700 : 500,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {label}
          {current === value && (
            <span
              className="absolute bottom-0 left-4 right-4 h-1 rounded-full"
              style={{ background: '#1d9bf0' }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
