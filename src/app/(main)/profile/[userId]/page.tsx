import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, MessageCircle, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'

interface Props { params: Promise<{ userId: string }> }

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const profileId = userId === 'me' ? currentUser?.id : userId
  if (!profileId) notFound()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', profileId).single()

  if (!profile) notFound()

  const isOwnProfile = currentUser?.id === profileId

  const { data: posts } = await supabase
    .from('posts').select('*, post_likes(user_id)')
    .eq('author_id', profileId).order('created_at', { ascending: false }).limit(20)

  const { data: events } = await supabase
    .from('event_attendees').select('events(id, title, starts_at, location_name)')
    .eq('user_id', profileId).limit(5)

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold flex items-center gap-1" style={{ color: 'var(--text)' }}>
          {profile.full_name ?? profile.username}
          {profile.verified === true && (
            <svg viewBox="0 0 22 22" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="11" fill="#1d9bf0" />
              <path d="M7 11.5l2.8 2.8 5.2-5.6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{posts?.length ?? 0} posts</p>
      </div>

      {/* Cover / avatar area */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.username} size="lg" />
          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Settings size={14} /> Edit profile
            </Link>
          ) : (
            <Link
              href={`/messages/${profileId}`}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#1d9bf0' }}
            >
              <MessageCircle size={14} /> Message
            </Link>
          )}
        </div>

        <h2 className="text-lg font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
          {profile.full_name ?? profile.username}
          {profile.verified === true && (
            <svg viewBox="0 0 22 22" width="20" height="20" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="11" fill="#1d9bf0" />
              <path d="M7 11.5l2.8 2.8 5.2-5.6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>@{profile.username}</p>

        {profile.bio && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {(profile.neighborhood || profile.city) && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
              <MapPin size={11} />
              <span>{profile.neighborhood ?? profile.city}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
            <Calendar size={11} />
            <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-5 mt-4">
          {[
            { label: 'Posts', val: posts?.length ?? 0 },
            { label: 'Likes', val: posts?.reduce((s, p) => s + (p.post_likes?.length ?? 0), 0) ?? 0 },
            { label: 'Events', val: events?.length ?? 0 },
          ].map(({ label, val }) => (
            <div key={label}>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{val}</span>
              <span className="text-sm ml-1" style={{ color: 'var(--text-3)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events attending */}
      {events && events.length > 0 && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-3)' }}>GOING TO</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(events as any[]).map((ea) => {
              const ev = ea.events
              if (!ev) return null
              return (
                <Link key={ev.id} href={`/events/${ev.id}`}
                  className="shrink-0 px-3 py-2 rounded-xl transition"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
                >
                  <div className="text-xs font-medium" style={{ color: '#1d9bf0' }}>
                    {format(new Date(ev.starts_at), 'MMM d')}
                  </div>
                  <div className="text-sm font-semibold max-w-[140px] truncate mt-0.5" style={{ color: 'var(--text)' }}>
                    {ev.title}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        <p className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          {isOwnProfile ? 'YOUR POSTS' : 'POSTS'}
        </p>
        {!posts?.length ? (
          <div className="text-center py-16">
            <p style={{ color: 'var(--text-3)' }}>No posts yet.</p>
            {isOwnProfile && (
              <Link href="/posts/new" className="text-sm font-medium mt-2 block" style={{ color: '#1d9bf0' }}>
                Create your first post →
              </Link>
            )}
          </div>
        ) : (
          posts.map(post => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="flex items-start gap-3 px-4 py-3 transition"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={undefined}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{post.title}</h3>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-2)' }}>{post.body}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <CategoryBadge category={post.category} />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </span>
                  {(post.post_likes?.length ?? 0) > 0 && (
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>❤️ {post.post_likes.length}</span>
                  )}
                </div>
              </div>
              {post.image_urls?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image_urls[0]} alt="" loading="lazy"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  style={{ border: '1px solid var(--border)' }} />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
