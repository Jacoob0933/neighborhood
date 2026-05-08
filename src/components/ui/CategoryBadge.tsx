import type { PostCategory } from '@/types/database'

const config: Record<PostCategory, { label: string; className: string }> = {
  general: { label: 'General', className: 'bg-blue-50 text-blue-700' },
  events: { label: 'Event', className: 'bg-purple-50 text-purple-700' },
  marketplace: { label: 'Marketplace', className: 'bg-amber-50 text-amber-700' },
  lost_found: { label: 'Lost & Found', className: 'bg-red-50 text-red-700' },
}

export function CategoryBadge({ category }: { category: PostCategory }) {
  const { label, className } = config[category]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
