import type { PostCategory } from '@/types/database'

const config: Record<PostCategory, { label: string; emoji: string; color: string; bg: string }> = {
  general:     { label: 'General',     emoji: '💬', color: '#58a6ff', bg: 'rgba(88,166,255,0.12)' },
  events:      { label: 'Event',       emoji: '🎉', color: '#bc8cff', bg: 'rgba(188,140,255,0.12)' },
  marketplace: { label: 'Marketplace', emoji: '🛍️', color: '#e3b341', bg: 'rgba(227,179,65,0.12)' },
  lost_found:  { label: 'Lost & Found',emoji: '🔍', color: '#f78166', bg: 'rgba(247,129,102,0.12)' },
}

export function CategoryBadge({ category }: { category: PostCategory }) {
  const { label, emoji, color, bg } = config[category]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color, background: bg }}
    >
      <span style={{ fontSize: '10px' }}>{emoji}</span>
      {label}
    </span>
  )
}
