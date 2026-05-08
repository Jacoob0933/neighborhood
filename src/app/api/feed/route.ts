import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { PostCategory } from '@/types/database'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') // created_at ISO string of last loaded post
  const category = searchParams.get('category')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ posts: [], nextCursor: null }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('city, neighborhood, location')
    .eq('id', user.id)
    .single()

  type RawPost = Record<string, unknown>
  let posts: RawPost[] | null = null

  // Use GPS RPC only for the first page (no cursor); subsequent pages use city-based cursor query
  if (!cursor && profile?.location) {
    const locStr = profile.location as unknown as string
    const match = locStr.match(/POINT\(([^ ]+) ([^ )]+)\)/)
    if (match) {
      const [, lng, lat] = match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('posts_near', {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_m: 20000,
        lim: PAGE_SIZE + 1,
        cat: category && category !== 'all' ? category : null,
      })
      posts = data
    }
  }

  if (!posts) {
    let query = supabase
      .from('posts')
      .select('*, profiles(id, username, full_name, avatar_url, city, neighborhood), post_likes(user_id)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (category && category !== 'all') query = query.eq('category', category as PostCategory)
    if (cursor) query = query.lt('created_at', cursor)

    const { data } = await query
    posts = data
  }

  // Enrich RPC results with profiles + likes
  if (posts && posts.length > 0 && !posts[0].profiles) {
    const authorIds = [...new Set(posts.map(p => p.author_id as string))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, city, neighborhood, is_verified')
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

  const hasMore = (posts?.length ?? 0) > PAGE_SIZE
  const pagePosts = hasMore ? posts!.slice(0, PAGE_SIZE) : (posts ?? [])
  const nextCursor = hasMore
    ? (pagePosts[pagePosts.length - 1] as { created_at: string }).created_at
    : null

  return NextResponse.json({ posts: pagePosts, nextCursor })
}
