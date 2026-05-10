import type { PostCategory } from '@/types/database'

const config: Record<PostCategory, { label: string; emoji: string; color: string; bg: string }> = {
  general:     { label: 'General',     emoji: '💬', color: '#58a6ff', bg: 'rgba(88,166,255,0.13)'   },
  events:      { label: 'Event',       emoji: '🎉', color: '#c084fc', bg: 'rgba(192,132,252,0.13)'  },
  marketplace: { label: 'Marketplace', emoji: '🛍️', color: '#fbbf24', bg: 'rgba(251,191,36,0.13)'  },
  lost_found:  { label: 'Lost & Found',emoji: '🔍', color: '#f87171', bg: 'rgba(248,113,113,0.13)'  },
  promo:       { label: 'Promo',       emoji: '📢', color: '#4ade80', bg: 'rgba(74,222,128,0.13)'   },
}

export function CategoryBadge({ category }: { category: PostCategory }) {
  const { label, emoji, color, bg } = config[category]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color, background: bg, border: `1px solid ${color}30` }}
    >
      <span style={{ fontSize: '10px' }}>{emoji}</span>
      {label}
    </span>
  )
}
