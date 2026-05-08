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

  // Minimal query — just the post itself, no joins
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  // Fetch author profile separately
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, city, neighborhood, is_verified')
    .eq('id', post.author_id)
    .single()

  // Fetch likes separately
  const { data: likes } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', id)

  // Fetch linked event separately
  const { data: event } = await supabase
    .from('events')
    .select('id, starts_at, ends_at, location_name, max_attendees')
    .eq('post_id', id)
    .maybeSingle()

  // Fetch attendees separately
  const { data: attendees } = event
    ? await supabase.from('event_attendees').select('user_id').eq('event_id', event.id)
    : { data: [] }

  const likeCount = likes?.length ?? 0
  const liked = likes?.some(l => l.user_id === user?.id) ?? false
  const attending = attendees?.some(a => a.user_id === user?.id) ?? false
  const attendeeCount = attendees?.length ?? 0

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/feed"
          className="flex items-center justify-center w-9 h-9 rounded-full transition hover:opacity-80"
          style={{ color: 'var(--text)' }}
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
            <Link href={`/profile/${profile?.id ?? post.author_id}`}>
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name ?? profile?.username}
                size="md"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${profile?.id ?? post.author_id}`}
                className="font-bold text-sm hover:underline inline-flex items-center gap-1"
                style={{ color: 'var(--text)' }}
              >
                {profile?.full_name ?? profile?.username ?? 'Anonymous'}
                {(profile as { is_verified?: boolean })?.is_verified && (
                  <svg viewBox="0 0 22 22" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="11" fill="#1d9bf0" />
                    <path d="M7 11.5l2.8 2.8 5.2-5.6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
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
                <img
                  key={i} src={url} alt=""
                  className="w-full h-28 object-cover rounded-xl"
                  loading="lazy"
                  style={{ border: '1px solid var(--border)' }}
                />
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
                    attending={attending}
                    full={!!event.max_attendees && attendeeCount >= event.max_attendees && !attending}
                  />
                )}
              </div>
            </div>
          )}

          {/* Stats + actions */}
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
