'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, MapPin, MoreHorizontal, Share2 } from 'lucide-react'
import type { Post, PostCategory } from '@/types/database'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { createClient } from '@/lib/supabase/client'

const CAT_COLOR: Record<PostCategory, string> = {
  general:     '#58a6ff',
  events:      '#c084fc',
  marketplace: '#fbbf24',
  lost_found:  '#f87171',
  promo:       '#4ade80',
}

interface PostCardProps {
  post: Post
  currentUserId: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const likedByMe = post.post_likes?.some(l => l.user_id === currentUserId) ?? false
  const [liked, setLiked] = useState(likedByMe)
  const [likeCount, setLikeCount] = useState(post.post_likes?.length ?? 0)
  const [heartAnim, setHeartAnim] = useState(false)

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!liked) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 400) }
    const supabase = createClient()
    if (liked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserId })
      setLiked(false); setLikeCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      setLiked(true); setLikeCount(c => c + 1)
    }
  }

  const author = post.profiles
  const isVerified = author?.verified === true
  const location = post.neighborhood || post.city
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
  const hasImages = post.image_urls && post.image_urls.length > 0

  const catColor = CAT_COLOR[post.category]

  return (
    <article
      className="post-row flex gap-3 px-4 py-4 fade-in"
      style={{
        borderBottom: '1px solid var(--border)',
        borderLeft: `3px solid ${catColor}44`,
        paddingLeft: 13,
      }}
    >
      {/* Avatar column */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 40 }}>
        <Link href={`/profile/${author?.id ?? ''}`} onClick={e => e.stopPropagation()} className="tap">
          <Avatar src={author?.avatar_url} name={author?.full_name ?? author?.username} size="md" />
        </Link>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 min-w-0">
            <Link
              href={`/profile/${author?.id ?? ''}`}
              onClick={e => e.stopPropagation()}
              className="font-semibold text-sm hover:underline inline-flex items-center gap-1 shrink-0"
              style={{ color: 'var(--text)' }}
            >
              {author?.full_name ?? author?.username ?? 'Anonymous'}
              {isVerified && (
                <svg viewBox="0 0 22 22" width="15" height="15" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="11" fill="#1d9bf0" />
                  <path d="M7 11.5l2.8 2.8 5.2-5.6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Link>
            {author?.username && (
              <span className="text-xs truncate max-w-[100px]" style={{ color: 'var(--text-3)' }}>
                @{author.username}
              </span>
            )}
            <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>· {timeAgo}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <CategoryBadge category={post.category} />
            <button
              className="tap p-1.5 rounded-full"
              style={{ color: 'var(--text-3)' }}
              onClick={e => e.preventDefault()}
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Post content */}
        <Link href={`/posts/${post.id}`} className="block">
          <h3
            className="font-semibold text-sm leading-snug mt-1"
            style={{ color: 'var(--text)' }}
          >
            {post.title}
          </h3>
          <p
            className="text-sm mt-1 leading-relaxed line-clamp-3"
            style={{ color: 'var(--text-2)' }}
          >
            {post.body}
          </p>
        </Link>

        {/* Image(s) */}
        {hasImages && (
          <Link href={`/posts/${post.id}`} className="block mt-3">
            {post.image_urls!.length === 1 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image_urls![0]}
                alt={post.title}
                loading="lazy"
                decoding="async"
                className="w-full object-cover"
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  maxHeight: 320,
                  aspectRatio: '16/9',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: post.image_urls!.length >= 2 ? '1fr 1fr' : '1fr' }}
              >
                {post.image_urls!.slice(0, 4).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      aspectRatio: '1',
                      objectFit: 'cover',
                    }}
                  />
                ))}
              </div>
            )}
          </Link>
        )}

        {/* Location pill */}
        {location && (
          <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--text-3)' }}>
            <MapPin size={11} />
            <span className="text-xs">{location}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-0 mt-2.5 -ml-2">
          {/* Reply */}
          <Link
            href={`/posts/${post.id}`}
            onClick={e => e.stopPropagation()}
            className="tap flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs transition group"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1d9bf0'; e.currentTarget.style.background = 'rgba(29,155,240,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <MessageCircle size={16} />
          </Link>

          {/* Like */}
          <button
            onClick={toggleLike}
            className="tap flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs transition"
            style={{ color: liked ? '#f91880' : 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f91880'; e.currentTarget.style.background = 'rgba(249,24,128,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = liked ? '#f91880' : 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} className={heartAnim ? 'heart-pop' : ''} />
            {likeCount > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{likeCount}</span>}
          </button>

          {/* Share */}
          <button
            className="tap flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs transition"
            style={{ color: 'var(--text-3)' }}
            onClick={e => { e.preventDefault(); e.stopPropagation() }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00ba7c'; e.currentTarget.style.background = 'rgba(0,186,124,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}
