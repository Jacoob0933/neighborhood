'use client'

import Link from 'next/link'

const categories = [
  { emoji: '💬', label: 'General',     href: '/feed?category=general',     color: '#58a6ff', bg: 'rgba(88,166,255,0.12)'  },
  { emoji: '🎉', label: 'Events',      href: '/feed?category=events',      color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  { emoji: '🛍️', label: 'Marketplace', href: '/feed?category=marketplace', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  { emoji: '🔍', label: 'Lost & Found',href: '/feed?category=lost_found',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  { emoji: '📢', label: 'Promo',       href: '/feed?category=promo',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
]

function CategoryLink({ emoji, label, href, color, bg }: typeof categories[0]) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
      style={{ color: 'var(--text-2)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = bg
        e.currentTarget.style.color = color
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-2)'
      }}
    >
      <span
        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 transition-all"
        style={{ background: 'var(--bg-3)', fontSize: 16 }}
      >
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
          background: 'linear-gradient(135deg, rgba(29,155,240,0.14) 0%, rgba(13,110,253,0.06) 100%)',
          border: '1.5px solid rgba(29,155,240,0.22)',
        }}
      >
        {/* glow */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: '#1d9bf0', filter: 'blur(30px)', opacity: 0.1 }}
        />
        <div className="relative">
          <p className="text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: '#1d9bf0' }}>
            🏘️ Welcome
          </p>
          <h3 className="font-black text-sm mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.2px' }}>
            Your neighborhood, your voice.
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Share events, sell things, find lost pets, or just say hi to the people around you.
          </p>
          <Link
            href="/posts/new"
            className="inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
          >
            ✏️ Post something
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-bold text-sm mb-3 px-1" style={{ color: 'var(--text)' }}>
          Browse categories
        </h3>
        <div className="space-y-0.5">
          {categories.map(cat => <CategoryLink key={cat.label} {...cat} />)}
        </div>
      </div>

      <p className="text-xs px-1" style={{ color: 'var(--text-3)' }}>
        neighbr · neighbr.xyz
      </p>
    </div>
  )
}
