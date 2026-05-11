import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { MapPin, Compass } from 'lucide-react'
import Link from 'next/link'
import type { PostCategory } from '@/types/database'
import { PostCard } from '@/components/feed/PostCard'
import { CategoryFilter } from '@/components/feed/CategoryFilter'
import { FeedInfinite } from '@/components/feed/FeedInfinite'
import { ScopeToggle } from '@/components/feed/ScopeToggle'
import { getNearbyAuthorDistances } from '@/lib/nearby'

const PAGE_SIZE = 20
const RADIUS_M = 30_000 // 30km

interface FeedPageProps {
  searchParams: Promise<{ category?: string; scope?: string }>
}

async function FeedPosts({
  category,
  scope,
  userId,
  hasLocation,
  userLat,
  userLng,
}: {
  category?: string
  scope: 'nearby' | 'worldwide'
  userId: string
  hasLocation: boolean
  userLat: number | null
  userLng: number | null
}) {
  const supabase = await createClient()
  type RawPost = Record<string, unknown>

  let posts: RawPost[] = []
  let usedNearby = false

  // Filter by AUTHOR's profile GPS — not the post's location field.
  // We do the distance check in TypeScript (Haversine over a bounding-box
  // pre-filtered set of profiles) so the filter works even if no SQL RPC exists.
  // If the helper can't resolve any neighbors we return an empty list rather
  // than falling through to "show everything" (the previous silent-failure bug).
  let distanceById: Record<string, number> = {}
  if (scope === 'nearby' && hasLocation && userLat != null && userLng != null) {
    const distMap = await getNearbyAuthorDistances(supabase, userLat, userLng, RADIUS_M)
    usedNearby = true

    if (distMap && Object.keys(distMap).length > 0) {
      distanceById = distMap
      const nearbyIds = Object.keys(distMap)
      let query = supabase
        .from('posts')
        .select('*')
        .in('author_id', nearbyIds)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1)
      if (category && category !== 'all') query = query.eq('category', category as PostCategory)
      const { data } = await query
      posts = data ?? []
    } else {
      posts = []
    }
  }

  // Worldwide: global query (only verified authors)
  if (!usedNearby) {
    if (scope === 'worldwide') {
      const { data: vp } = await supabase.from('profiles').select('id').eq('verified', true)
      const verifiedIds = (vp ?? []).map((p: { id: string }) => p.id)

      if (verifiedIds.length === 0) {
        // No verified users — show nothing
        posts = []
      } else {
        let query = supabase
          .from('posts')
          .select('*')
          .in('author_id', verifiedIds)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE + 1)
        if (category && category !== 'all') query = query.eq('category', category as PostCategory)
        const { data: rawPosts } = await query
        posts = rawPosts ?? []
      }
    } else {
      // nearby fallback (no GPS) — show all posts
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1)

      if (category && category !== 'all') query = query.eq('category', category as PostCategory)

      const { data: rawPosts, error } = await query

      if (error) {
        if (error.message.includes('invalid input value for enum')) {
          return (
            <div className="text-center py-20 px-6">
              <p className="text-5xl mb-4">🚧</p>
              <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Coming soon</p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>This category is being set up.</p>
            </div>
          )
        }
        return (
          <div className="text-center py-20 px-6">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Feed error</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{error.message}</p>
          </div>
        )
      }

      posts = rawPosts ?? []
    }
  }

  // Enrich with profiles + likes
  if (posts.length > 0) {
    const authorIds = [...new Set(posts.map(p => p.author_id as string))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, city, neighborhood, verified')
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
      _distance_m: distanceById[p.author_id as string],
    }))
  }

  const hasMore = posts.length > PAGE_SIZE
  const pagePosts = hasMore ? posts.slice(0, PAGE_SIZE) : posts
  const nextCursor = hasMore
    ? (pagePosts[pagePosts.length - 1] as { created_at: string }).created_at
    : null

  if (!pagePosts.length) {
    if (scope === 'nearby' && hasLocation) {
      return (
        <div className="text-center py-20 px-6">
          <p className="text-5xl mb-4">🏘️</p>
          <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>No posts within 30km</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
            Be the first in your area, or expand your view.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/posts/new"
              className="inline-block px-5 py-2 rounded-full text-sm font-bold text-white hover:opacity-90 transition"
              style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
            >
              Post here
            </Link>
            <Link
              href={`/feed?scope=worldwide${category ? `&category=${category}` : ''}`}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold hover:opacity-80 transition"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Compass size={14} /> See worldwide
            </Link>
          </div>
        </div>
      )
    }
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
      <FeedInfinite
        initialCursor={nextCursor}
        category={category}
        scope={scope}
        currentUserId={userId}
      />
    </>
  )
}

function FeedSkeleton() {
  return (
    <div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="skeleton h-3.5 rounded-full" style={{ width: '30%' }} />
              <div className="skeleton h-3 rounded-full" style={{ width: '15%' }} />
            </div>
            <div className="skeleton h-3.5 rounded-full" style={{ width: '80%' }} />
            <div className="skeleton h-3 rounded-full" style={{ width: '100%' }} />
            <div className="skeleton h-3 rounded-full" style={{ width: '65%' }} />
            {i % 3 === 0 && (
              <div className="skeleton w-full rounded-xl mt-1" style={{ height: 160 }} />
            )}
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

  // Check if user has GPS location set
  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('city, neighborhood, lat, lng, verified')
    .eq('id', user.id)
    .single() : { data: null }

  const hasLocation = profile?.lat != null && profile?.lng != null
  const userLat = profile?.lat ?? null
  const userLng = profile?.lng ?? null
  const isVerified = profile?.verified === true
  const scope: 'nearby' | 'worldwide' =
    params.scope === 'worldwide' ? 'worldwide' : (hasLocation ? 'nearby' : 'worldwide')

  const locationLabel = profile?.neighborhood || profile?.city || 'Set location'

  // For the debug pill below the header — count nearby authors so we can show it
  let nearbyAuthorCount: number | null = null
  if (scope === 'nearby' && hasLocation && userLat != null && userLng != null) {
    const dist = await getNearbyAuthorDistances(supabase, userLat, userLng, RADIUS_M)
    nearbyAuthorCount = dist ? Object.keys(dist).length : null
  }

  return (
    <div>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(6,6,10,0.88)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-black tracking-tight shrink-0" style={{ color: 'var(--text)' }}>Home</h1>
          <ScopeToggle hasLocation={hasLocation} isVerified={isVerified} />
        </div>

        {/* Location row */}
        <div className="flex items-center justify-between px-4 pb-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: 'var(--text-3)' }}>
            <MapPin size={10} style={{ color: 'var(--accent)' }} />
            <span className="truncate">
              {scope === 'nearby'
                ? `${locationLabel} · within 30km${nearbyAuthorCount != null ? ` · ${nearbyAuthorCount} neighbors` : ''}`
                : 'Showing posts worldwide'}
            </span>
          </div>
        </div>

        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>

      {/* Set location banner */}
      {!hasLocation && (
        <Link
          href="/profile/edit"
          className="flex items-center gap-3 px-4 py-3 fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(29,155,240,0.1), rgba(29,155,240,0.05))',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(29,155,240,0.2)' }}
          >
            <MapPin size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Set your location</p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>See posts from neighbors within 30km</p>
          </div>
          <span className="text-xs font-bold shrink-0" style={{ color: 'var(--accent)' }}>Setup →</span>
        </Link>
      )}

      {/* Quick compose bar */}
      <Link
        href="/posts/new"
        className="flex items-center gap-3 px-4 py-3.5 transition-colors"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
          style={{ background: 'var(--bg-2)' }}
        >
          ✏️
        </div>
        <span className="text-sm flex-1" style={{ color: 'var(--text-3)' }}>
          What&apos;s happening{locationLabel !== 'Set location' ? ` in ${locationLabel}?` : '?'}
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
        {user && (
          <FeedPosts
            category={params.category}
            scope={scope}
            userId={user.id}
            hasLocation={hasLocation}
            userLat={userLat}
            userLng={userLng}
          />
        )}
      </Suspense>
    </div>
  )
}
