'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Post } from '@/types/database'
import { PostCard } from './PostCard'
import { Loader2 } from 'lucide-react'

interface FeedInfiniteProps {
  initialCursor: string | null
  category?: string
  currentUserId: string
}

export function FeedInfinite({ initialCursor, category, currentUserId }: FeedInfiniteProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(!initialCursor)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || done || !cursor) return
    setLoading(true)

    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    if (category && category !== 'all') params.set('category', category)

    const res = await fetch(`/api/feed?${params.toString()}`)
    if (!res.ok) { setLoading(false); return }

    const { posts: newPosts, nextCursor } = await res.json()
    setPosts(prev => [...prev, ...newPosts])
    setCursor(nextCursor)
    if (!nextCursor) setDone(true)
    setLoading(false)
  }, [loading, done, cursor, category])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  return (
    <>
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-3)' }} />
        </div>
      )}

      {done && posts.length > 0 && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>
          You&apos;ve seen all nearby posts
        </p>
      )}
    </>
  )
}
