import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Heart, MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { EventAttendButton } from '@/components/events/EventAttendButton'
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
  const likeCount = post.post_likes?.length ?? 0

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/feed"
          className="flex items-center justify-center w-9 h-9 rounded-full transition"
          style={{ color: 'var(--text)' }}
          onMouseEnter={undefined}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Post</h1>
      </div>

      <article>
        {/* Hero image */}
        {post.image_urls?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_urls[0]}
            alt={post.title}
            className="w-full max-h-80 object-cover"
            loading="lazy"
          />
        )}

        <div className="px-4 py-4">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/profile/${post.profiles?.id}`}>
              <Avatar src={post.profiles?.avatar_url} name={post.profiles?.full_name ?? post.profiles?.username} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${post.profiles?.id}`}
                className="font-bold text-sm hover:underline block"
                style={{ color: 'var(--text)' }}
              >
                {post.profiles?.full_name ?? post.profiles?.username ?? 'Anonymous'}
              </Link>
              <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
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
            <CategoryBadge category={post.category} />
          </div>

          {/* Title + body */}
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{post.title}</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{post.body}</p>

          {/* Extra images */}
          {post.image_urls && post.image_urls.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {post.image_urls.slice(1).map((url: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-full h-28 object-cover rounded-xl" loading="lazy"
                  style={{ border: '1px solid var(--border)' }} />
              ))}
            </div>
          )}

          {/* Event card */}
          {event && (
            <div
              className="mt-5 rounded-xl p-4"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <Calendar size={18} style={{ color: '#1d9bf0' }} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {format(new Date(event.starts_at), 'EEEE, MMMM d · h:mm a')}
                  </p>
                  {event.location_name && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{event.location_name}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
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

          {/* Stats + actions */}
          <div
            className="flex items-center justify-between mt-5 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-3)' }}>
              {likeCount > 0 && (
                <span><strong style={{ color: 'var(--text)' }}>{likeCount}</strong> likes</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Reply */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1d9bf0'; e.currentTarget.style.background = 'rgba(29,155,240,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
              >
                <MessageCircle size={16} />
                <span>Reply</span>
              </button>

              {/* Like */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f91880'; e.currentTarget.style.background = 'rgba(249,24,128,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
              >
                <Heart size={16} />
                <span>Like</span>
              </button>

              {/* Message author */}
              {user && post.author_id !== user.id && (
                <Link
                  href={`/messages/${post.profiles?.id}`}
                  className="px-4 py-1.5 rounded-full text-sm font-bold transition hover:opacity-90"
                  style={{ background: '#1d9bf0', color: 'white' }}
                >
                  Message
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
