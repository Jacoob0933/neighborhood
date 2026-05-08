import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import type { Post } from '@/types/database'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(id, username, full_name, avatar_url, city, neighborhood),
      post_likes(user_id),
      events(id, starts_at, ends_at, location_name, max_attendees, event_attendees(user_id))
    `)
    .eq('id', id)
    .single()

  if (!post) notFound()

  const p = post as Post & {
    events?: {
      id: string
      starts_at: string
      ends_at: string | null
      location_name: string | null
      max_attendees: number | null
      event_attendees: { user_id: string }[]
    }[]
  }

  const event = p.events?.[0]
  const attending = event?.event_attendees?.some(a => a.user_id === user?.id)
  const attendeeCount = event?.event_attendees?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={16} />
        Back to feed
      </Link>

      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {post.image_urls?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_urls[0]} alt={post.title} className="w-full max-h-72 object-cover" />
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={post.category} />
            {post.is_resolved && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                ✓ Resolved
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Link href={`/profile/${post.profiles?.id}`}>
              <Avatar src={post.profiles?.avatar_url} name={post.profiles?.full_name ?? post.profiles?.username} size="md" />
            </Link>
            <div>
              <Link href={`/profile/${post.profiles?.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                {post.profiles?.full_name ?? post.profiles?.username}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                {(post.neighborhood || post.city) && (
                  <>
                    <MapPin size={10} />
                    <span>{post.neighborhood || post.city}</span>
                    <span>·</span>
                  </>
                )}
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            {user && post.author_id !== user.id && (
              <Link
                href={`/messages/${post.profiles?.id}`}
                className="ml-auto px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition"
              >
                Message
              </Link>
            )}
          </div>

          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.body}</p>

          {/* Event card */}
          {event && (
            <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-900">
                    {format(new Date(event.starts_at), 'EEEE, MMMM d · h:mm a')}
                  </p>
                  {event.location_name && (
                    <p className="text-sm text-purple-700 mt-0.5">{event.location_name}</p>
                  )}
                  <p className="text-xs text-purple-500 mt-1">
                    {attendeeCount} going
                    {event.max_attendees ? ` · ${event.max_attendees - attendeeCount} spots left` : ''}
                  </p>
                </div>
                {user && (
                  <EventAttendButton
                    eventId={event.id}
                    userId={user.id}
                    attending={!!attending}
                    full={!!event.max_attendees && attendeeCount >= event.max_attendees && !attending}
                  />
                )}
              </div>
            </div>
          )}

          {/* Extra images */}
          {post.image_urls && post.image_urls.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {post.image_urls.slice(1).map((url: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

// Client component for the attend/leave button
import { EventAttendButton } from '@/components/events/EventAttendButton'
