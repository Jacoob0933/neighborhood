'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { PostCategory } from '@/types/database'

const categories: { value: PostCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '🏘️' },
  { value: 'general', label: 'General', emoji: '💬' },
  { value: 'events', label: 'Events', emoji: '🎉' },
  { value: 'marketplace', label: 'Marketplace', emoji: '🛍️' },
  { value: 'lost_found', label: 'Lost & Found', emoji: '🔍' },
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
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {categories.map(({ value, label, emoji }) => (
        <button
          key={value}
          onClick={() => select(value)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            current === value
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
          }`}
        >
          <span>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
