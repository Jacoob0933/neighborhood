import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { PostCategory } from '@/types/database'

const PAGE_SIZE = 20
const RADIUS_M = 30_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const category = searchParams.get('category')
  const scope = searchParams.get('scope') ?? 'worldwide'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ posts: [], nextCursor: null }, { status: 401 })

  type RawPost = Record<string, unknown>
  let posts: RawPost[] = []
  let usedNearby = false

  // Get the user's stored lat/lng directly from profile
  // (do NOT call get_my_coords RPC — it reads PostGIS geography column which is not synced)
  const { data: profile } = await supabase
    .from('profiles')
    .select('lat, lng')
    .eq('id', user.id)
    .single()

  const userLat = profile?.lat ?? null
  const userLng = profile?.lng ?? null
  const hasLocation = userLat != null && userLng != null

  // Try nearby query if scope=nearby and user has GPS saved
  if (scope === 'nearby' && hasLocation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('posts_near', {
      lat: userLat,
      lng: userLng,
      radius_m: RADIUS_M,
      lim: PAGE_SIZE + 1,
      cat: category && category !== 'all' ? category : null,
      cur: cursor || null,
    })
    if (!error && Array.isArray(data)) {
      posts = data
      usedNearby = true
    }
  }

  // Worldwide: only show posts from verified users
  if (!usedNearby && scope === 'worldwide') {
    const { data: vp } = await supabase
      .from('profiles')
      .select('id')
      .eq('verified', true)
    const verifiedIds = (vp ?? []).map((p: { id: string }) => p.id)

    if (verifiedIds.length === 0) {
      posts = []
    } else {
      let query = supabase
        .from('posts')
        .select('*')
        .in('author_id', verifiedIds)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1)

      if (category && category !== 'all') query = query.eq('category', category as PostCategory)
      if (cursor) query = query.lt('created_at', cursor)

      const { data } = await query
      posts = data ?? []
    }
    usedNearby = true // mark as handled
  }

  // Nearby fallback (no GPS) — show all posts
  if (!usedNearby) {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (category && category !== 'all') query = query.eq('category', category as PostCategory)
    if (cursor) query = query.lt('created_at', cursor)

    const { data } = await query
    posts = data ?? []
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
    }))
  }

  const hasMore = posts.length > PAGE_SIZE
  const pagePosts = hasMore ? posts.slice(0, PAGE_SIZE) : posts
  const nextCursor = hasMore
    ? (pagePosts[pagePosts.length - 1] as { created_at: string }).created_at
    : null

  return NextResponse.json({ posts: pagePosts, nextCursor })
}
