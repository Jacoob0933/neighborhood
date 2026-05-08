import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, MessageCircle, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import type { Post } from '@/types/database'

interface Props { params: Promise<{ userId: string }> }

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // "me" alias
  const profileId = userId === 'me' ? currentUser?.id : userId
  if (!profileId) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!profile) notFound()

  const isOwnProfile = currentUser?.id === profileId

  const { data: posts } = await supabase
    .from('posts')
    .select('*, post_likes(user_id)')
    .eq('author_id', profileId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: events } = await supabase
    .from('event_attendees')
    .select('events(id, title, starts_at, location_name)')
    .eq('user_id', profileId)
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-start gap-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name ?? profile.username}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {profile.full_name ?? profile.username}
                </h1>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  <Settings size={14} />
                  Edit
                </Link>
              ) : (
                <Link
                  href={`/messages/${profileId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 transition"
                >
                  <MessageCircle size={14} />
                  Message
                </Link>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {(profile.neighborhood || profile.city) && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} />
                  <span>{profile.neighborhood ?? profile.city}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={11} />
                <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{posts?.length ?? 0}</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {posts?.reduce((sum, p) => sum + (p.post_likes?.length ?? 0), 0) ?? 0}
            </div>
            <div className="text-xs text-gray-400">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{events?.length ?? 0}</div>
            <div className="text-xs text-gray-400">Events</div>
          </div>
        </div>
      </div>

      {/* Upcoming events attended */}
      {events && events.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">Going to</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(events as any[]).map((ea: { events: { id: string; title: string; starts_at: string; location_name: string | null } | null }) => {
              const ev = ea.events
              if (!ev) return null
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="shrink-0 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:shadow-sm transition"
                >
                  <div className="text-xs font-medium text-purple-600">
                    {format(new Date(ev.starts_at), 'MMM d')}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 max-w-[140px] truncate mt-0.5">
                    {ev.title}
                  </div>
                  {ev.location_name && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin size={10} />
                      <span className="truncate max-w-[120px]">{ev.location_name}</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">
          {isOwnProfile ? 'Your posts' : 'Posts'}
        </h2>
        {!posts?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p>No posts yet.</p>
            {isOwnProfile && (
              <Link href="/posts/new" className="text-green-600 text-sm font-medium hover:underline mt-1 block">
                Create your first post →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{post.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post.body}</p>
                  </div>
                  {post.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image_urls[0]}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <CategoryBadge category={post.category} />
                  <span className="text-xs text-gray-400">
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </span>
                  {post.post_likes?.length > 0 && (
                    <span className="text-xs text-gray-400">❤️ {post.post_likes.length}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
