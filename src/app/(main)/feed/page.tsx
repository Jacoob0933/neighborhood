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

  // Step 1: fetch posts only (no joins — avoids schema cache issues)
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

  // Step 2: enrich with profiles + likes separately
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
        <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>No posts in your area yet.</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Be the first to post something!</p>
        <Link
          href="/posts/new"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#1d9bf0' }}
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
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-black" style={{ color: 'var(--text)' }}>Home</h1>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
            <MapPin size={11} />
            <span>{locationLabel}</span>
          </div>
        </div>
        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>

      {/* Quick compose */}
      <Link
        href="/posts/new"
        className="flex items-center gap-3 px-4 py-3 group transition-colors"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-2)', color: 'var(--text-3)' }}
        >
          <span className="text-lg">✏️</span>
        </div>
        <span className="text-sm flex-1" style={{ color: 'var(--text-3)' }}>
          What&apos;s happening in {locationLabel}?
        </span>
        <span
          className="text-xs font-bold px-4 py-1.5 rounded-full shrink-0"
          style={{ background: '#1d9bf0', color: 'white' }}
        >
          Post
        </span>
      </Link>

      {/* Posts with skeleton loading */}
      <Suspense
        fallback={
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-full shrink-0 animate-pulse" style={{ background: 'var(--bg-2)' }} />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-3 rounded-full animate-pulse w-1/4" style={{ background: 'var(--bg-2)' }} />
                  <div className="h-3 rounded-full animate-pulse w-full" style={{ background: 'var(--bg-2)' }} />
                  <div className="h-3 rounded-full animate-pulse w-3/4" style={{ background: 'var(--bg-2)' }} />
                </div>
              </div>
            ))}
          </div>
        }
      >
        {user && <FeedPosts category={params.category} userId={user.id} />}
      </Suspense>
    </div>
  )
}
