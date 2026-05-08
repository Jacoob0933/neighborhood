import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import type { PostCategory } from '@/types/database'
import { PostCard } from '@/components/feed/PostCard'
import { CategoryFilter } from '@/components/feed/CategoryFilter'
import { FeedInfinite } from '@/components/feed/FeedInfinite'

const PAGE_SIZE = 20

interface FeedPageProps {
  searchParams: Promise<{ category?: string }>
}

async function FeedPosts({ category, userId }: { category?: string; userId: string }) {
  const supabase = await createClient()

  type RawPost = Record<string, unknown>

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (category && category !== 'all') query = query.eq('category', category as PostCategory)

  const { data: rawPosts, error } = await query

  if (error) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Feed error</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{error.message}</p>
      </div>
    )
  }

  let posts: RawPost[] = rawPosts ?? []

  if (posts.length > 0) {
    const authorIds = [...new Set(posts.map(p => p.author_id as string))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, city, neighborhood')
      .in('id', authorIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    const postIds = posts.map(p => p.id as string)
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds)

    const likesByPost: Record<string, { user_id: string }[]> = {}
    for (const like of likes ?? []) {
      if (!likesByPost[like.post_id]) likesByPost[like.post_id] = []
      likesByPost[like.post_id].push({ user_id: like.user_id })
    }

    posts = posts.map(p => ({
      ...p,
      profiles: profileMap[p.author_id as string],
      post_likes: likesByPost[p.id as string] ?? [],
    }))
  }

  const hasMore = posts.length > PAGE_SIZE
  const pagePosts = hasMore ? posts.slice(0, PAGE_SIZE) : posts
  const nextCursor = hasMore
    ? (pagePosts[pagePosts.length - 1] as { created_at: string }).created_at
    : null

  if (!pagePosts.length) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-5xl mb-4">🏡</p>
        <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Nothing here yet</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Be the first to post something!</p>
        <Link
          href="/posts/new"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
        >
          Create a post
        </Link>
      </div>
    )
  }

  return (
    <>
      {(pagePosts as unknown as Parameters<typeof PostCard>[0]['post'][]).map(post => (
        <PostCard key={post.id} post={post} currentUserId={userId} />
      ))}
      <FeedInfinite initialCursor={nextCursor} category={category} currentUserId={userId} />
    </>
  )
}

function FeedSkeleton() {
  return (
    <div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Avatar skeleton */}
          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <div className="skeleton h-3.5 rounded-full" style={{ width: '30%' }} />
              <div className="skeleton h-3 rounded-full" style={{ width: '15%' }} />
            </div>
            {/* Title */}
            <div className="skeleton h-3.5 rounded-full" style={{ width: '80%' }} />
            {/* Body */}
            <div className="skeleton h-3 rounded-full" style={{ width: '100%' }} />
            <div className="skeleton h-3 rounded-full" style={{ width: '65%' }} />
            {/* Image placeholder for some */}
            {i % 3 === 0 && (
              <div className="skeleton w-full rounded-xl mt-1" style={{ height: 160 }} />
            )}
            {/* Action row */}
            <div className="flex gap-3 pt-1">
              <div className="skeleton h-3 rounded-full w-8" />
              <div className="skeleton h-3 rounded-full w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('city, neighborhood')
    .eq('id', user.id)
    .single() : { data: null }

  const locationLabel = profile?.neighborhood || profile?.city || 'Your area'

  return (
    <div>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(6,6,10,0.88)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>Home</h1>
          <div
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ color: 'var(--text-2)', background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            <MapPin size={10} style={{ color: 'var(--accent)' }} />
            <span>{locationLabel}</span>
          </div>
        </div>
        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>

      {/* Quick compose bar */}
      <Link
        href="/posts/new"
        className="flex items-center gap-3 px-4 py-3.5 transition-colors"
        style={{ borderBottom: '1px solid var(--border)' }}
        onMouseEnter={undefined}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
          style={{ background: 'var(--bg-2)' }}
        >
          ✏️
        </div>
        <span className="text-sm flex-1" style={{ color: 'var(--text-3)' }}>
          What&apos;s happening in {locationLabel}?
        </span>
        <span
          className="text-xs font-bold px-3.5 py-1.5 rounded-full shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
        >
          Post
        </span>
      </Link>

      {/* Feed posts */}
      <Suspense fallback={<FeedSkeleton />}>
        {user && <FeedPosts category={params.category} userId={user.id} />}
      </Suspense>
    </div>
  )
}
