import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { MapPin, Bell } from 'lucide-react'
import Link from 'next/link'
import type { PostCategory } from '@/types/database'
import { PostCard } from '@/components/feed/PostCard'
import { CategoryFilter } from '@/components/feed/CategoryFilter'

interface FeedPageProps {
  searchParams: Promise<{ category?: string }>
}

async function FeedPosts({ category }: { category?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('city, neighborhood, location')
    .eq('id', user.id)
    .single()

  let posts

  // If user has GPS location, use the 20km radius function
  if (profile?.location) {
    // location is stored as WKT; parse lat/lng from the POINT geometry
    const locStr = profile.location as unknown as string
    const match = locStr.match(/POINT\(([^ ]+) ([^ )]+)\)/)
    if (match) {
      const [, lng, lat] = match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('posts_near', {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_m: 20000,
        lim: 50,
        cat: category && category !== 'all' ? category : null,
      })
      posts = data
    }
  }

  // Fallback: city-based query
  if (!posts) {
    let query = supabase
      .from('posts')
      .select('*, profiles(id, username, full_name, avatar_url, city, neighborhood), post_likes(user_id)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (profile?.city) query = query.eq('city', profile.city)
    if (category && category !== 'all') query = query.eq('category', category as PostCategory)

    const { data } = await query
    posts = data
  }

  // If we used rpc, fetch profiles separately (rpc doesn't support joins)
  if (posts && posts.length > 0 && !posts[0].profiles) {
    const authorIds = [...new Set(posts.map((p: { author_id: string }) => p.author_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, city, neighborhood')
      .in('id', authorIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    const postIds = posts.map((p: { id: string }) => p.id)
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds)

    const likesByPost: Record<string, { user_id: string }[]> = {}
    for (const like of likes ?? []) {
      if (!likesByPost[like.post_id]) likesByPost[like.post_id] = []
      likesByPost[like.post_id].push({ user_id: like.user_id })
    }

    posts = posts.map((p: { id: string; author_id: string }) => ({
      ...p,
      profiles: profileMap[p.author_id],
      post_likes: likesByPost[p.id] ?? [],
    }))
  }

  if (!posts?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏡</p>
        <p className="font-medium text-gray-600">No posts in your area yet.</p>
        <p className="text-sm mt-1">Be the first to post!</p>
        <Link
          href="/posts/new"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
        >
          Create a post
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post: Parameters<typeof PostCard>[0]['post']) => (
        <PostCard key={post.id} post={post} currentUserId={user.id} />
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Community Feed</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <MapPin size={13} />
            <span>{locationLabel} · 20km radius</span>
          </div>
        </div>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition relative">
          <Bell size={20} />
        </button>
      </div>

      {/* Category filter */}
      <div className="mb-5">
        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>

      {/* Quick compose */}
      <Link
        href="/posts/new"
        className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 hover:border-green-300 transition-colors group"
      >
        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition">
          <span className="text-lg">✏️</span>
        </div>
        <span className="text-sm text-gray-400 group-hover:text-gray-600 transition">
          What&apos;s happening in {locationLabel}?
        </span>
      </Link>

      {/* Posts */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
            ))}
          </div>
        }
      >
        <FeedPosts category={params.category} />
      </Suspense>
    </div>
  )
}
