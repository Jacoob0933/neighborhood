import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { EventAttendButton } from '@/components/events/EventAttendButton'
import { PostActions } from '@/components/posts/PostActions'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, city, neighborhood')
    .eq('id', post.author_id)
    .single()

  const { data: likes } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', id)

  const { data: event } = await supabase
    .from('events')
    .select('id, starts_at, ends_at, location_name, max_attendees')
    .eq('post_id', id)
    .maybeSingle()

  const { data: attendees } = event
    ? await supabase.from('event_attendees').select('user_id').eq('event_id', event.id)
    : { data: [] }

  const likeCount = likes?.length ?? 0
  const liked = likes?.some(l => l.user_id === user?.id) ?? false
  const attending = attendees?.some(a => a.user_id === user?.id) ?? false
  const attendeeCount = attendees?.length ?? 0
  const isVerified = profile?.username === 'neighborhoodofficial'
  const location = post.neighborhood || post.city

  return (
    <div className="fade-in">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(6,6,10,0.88)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/feed"
          className="tap flex items-center justify-center w-9 h-9 rounded-full transition"
          style={{ color: 'var(--text)', background: 'var(--bg-2)' }}
        >
          <ArrowLeft size={17} />
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
            className="w-full object-cover"
            loading="lazy"
            style={{ maxHeight: 360, objectFit: 'cover' }}
          />
        )}

        <div className="px-4 py-4">
          {/* Category + location */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <CategoryBadge category={post.category} />
            {location && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                <MapPin size={10} />
                {location}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold leading-snug mb-4" style={{ color: 'var(--text)' }}>
            {post.title}
          </h2>

          {/* Author row */}
          <div
            className="flex items-center gap-3 py-3 mb-4"
            style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
          >
            <Link href={`/profile/${profile?.id ?? post.author_id}`}>
              <Avatar src={profile?.avatar_url} name={profile?.full_name ?? profile?.username} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${profile?.id ?? post.author_id}`}
                className="font-semibold text-sm hover:underline inline-flex items-center gap-1"
                style={{ color: 'var(--text)' }}
              >
                {profile?.full_name ?? profile?.username ?? 'Anonymous'}
                {isVerified && (
                  <svg viewBox="0 0 22 22" width="15" height="15" fill="none">
                    <circle cx="11" cy="11" r="11" fill="#1d9bf0" />
                    <path d="M7 11.5l2.8 2.8 5.2-5.6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Link>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
            {user && post.author_id !== user.id && (
              <Link
                href={`/messages/${profile?.id}`}
                className="tap px-3.5 py-1.5 rounded-full text-xs font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                Message
              </Link>
            )}
          </div>

          {/* Body */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--text-2)' }}>
            {post.body}
          </p>

          {/* Extra images grid */}
          {post.image_urls && post.image_urls.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {post.image_urls.slice(1).map((url: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i} src={url} alt=""
                  className="w-full object-cover"
                  loading="lazy"
                  style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', aspectRatio: '1' }}
                />
              ))}
            </div>
          )}

          {/* Event card */}
          {event && (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(188,140,255,0.15)' }}
                >
                  <Calendar size={17} style={{ color: '#bc8cff' }} />
                </div>
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
                    attending={attending}
                    full={!!event.max_attendees && attendeeCount >= event.max_attendees && !attending}
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <PostActions
            postId={post.id}
            authorId={post.author_id}
            authorProfileId={profile?.id}
            currentUserId={user?.id}
            initialLikeCount={likeCount}
            initialLiked={liked}
          />
        </div>
      </article>
    </div>
  )
}
