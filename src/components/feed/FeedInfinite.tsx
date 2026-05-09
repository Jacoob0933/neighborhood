'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Post } from '@/types/database'
import { PostCard } from './PostCard'

interface FeedInfiniteProps {
  initialCursor: string | null
  category?: string
  scope?: 'nearby' | 'worldwide'
  currentUserId: string
}

function LoadingDots() {
  return (
    <div className="flex justify-center items-center gap-1.5 py-8">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--text-3)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}

export function FeedInfinite({ initialCursor, category, scope, currentUserId }: FeedInfiniteProps) {
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
    if (scope) params.set('scope', scope)

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
      { rootMargin: '300px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  return (
    <>
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {loading && <LoadingDots />}

      {done && posts.length > 0 && (
        <div className="text-center py-10 px-6">
          <div
            className="inline-block w-10 h-0.5 rounded-full mb-3"
            style={{ background: 'var(--border)' }}
          />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>You&apos;re all caught up</p>
        </div>
      )}
    </>
  )
}
