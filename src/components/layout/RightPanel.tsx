'use client'

import Link from 'next/link'

const categories = [
  { emoji: '💬', label: 'General',     href: '/feed?category=general',     color: '#58a6ff' },
  { emoji: '🎉', label: 'Events',      href: '/feed?category=events',      color: '#bc8cff' },
  { emoji: '🛍️', label: 'Marketplace', href: '/feed?category=marketplace', color: '#e3b341' },
  { emoji: '🔍', label: 'Lost & Found',href: '/feed?category=lost_found',  color: '#f78166' },
  { emoji: '📢', label: 'Promo',       href: '/feed?category=promo',       color: '#3fb950' },
]

function CategoryLink({ emoji, label, href, color }: typeof categories[0]) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
      style={{ color: 'var(--text-2)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-hover)'
        e.currentTarget.style.color = color
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-2)'
      }}
    >
      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: 'var(--bg-3)' }}>
        {emoji}
      </span>
      {label}
    </Link>
  )
}

export function RightPanel() {
  return (
    <div className="sticky top-5 space-y-4">
      {/* Welcome card */}
      <div
        className="rounded-2xl p-5 overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(29,155,240,0.15) 0%, rgba(13,110,253,0.08) 100%)',
          border: '1px solid rgba(29,155,240,0.2)',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 pointer-events-none"
          style={{ background: '#1d9bf0', filter: 'blur(20px)' }}
        />
        <p className="text-xs font-semibold mb-1" style={{ color: '#1d9bf0' }}>WELCOME</p>
        <h3 className="font-bold text-sm mb-1.5" style={{ color: 'var(--text)' }}>Your neighborhood, your voice.</h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Share local events, sell things, find lost pets, or just connect with people around you.
        </p>
        <Link
          href="/posts/new"
          className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-white transition hover:opacity-90"
          style={{ background: '#1d9bf0' }}
        >
          Post something
        </Link>
      </div>

      {/* Categories */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Browse by category</h3>
        <div className="space-y-1">
          {categories.map(cat => <CategoryLink key={cat.label} {...cat} />)}
        </div>
      </div>

      <p className="text-xs px-1" style={{ color: 'var(--text-3)' }}>
        Neighborhood · Your local community
      </p>
    </div>
  )
}
