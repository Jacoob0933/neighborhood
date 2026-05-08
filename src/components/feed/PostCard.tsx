'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, MapPin, MoreHorizontal, Share } from 'lucide-react'
import type { Post } from '@/types/database'
import { Avatar } from '@/components/ui/Avatar'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { createClient } from '@/lib/supabase/client'

interface PostCardProps {
  post: Post
  currentUserId: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const likedByMe = post.post_likes?.some(l => l.user_id === currentUserId) ?? false
  const [liked, setLiked] = useState(likedByMe)
  const [likeCount, setLikeCount] = useState(post.post_likes?.length ?? 0)

  async function toggleLike() {
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
  const location = post.neighborhood || post.city

  return (
    <article
      className="post-row flex gap-3 px-4 py-3 cursor-pointer"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <Link href={`/profile/${author?.id ?? ''}`} className="shrink-0 mt-0.5">
        <Avatar src={author?.avatar_url} name={author?.full_name ?? author?.username} size="md" />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <Link
              href={`/profile/${author?.id ?? ''}`}
              className="font-bold text-sm hover:underline"
              style={{ color: 'var(--text)' }}
            >
              {author?.full_name ?? author?.username ?? 'Anonymous'}
            </Link>
            <span style={{ color: 'var(--text-3)' }} className="text-sm">·</span>
            <span style={{ color: 'var(--text-3)' }} className="text-sm shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            {location && (
              <div className="flex items-center gap-0.5" style={{ color: 'var(--text-3)' }}>
                <MapPin size={10} />
                <span className="text-xs truncate max-w-20">{location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CategoryBadge category={post.category} />
            <button
              className="p-1.5 rounded-full transition"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <Link href={`/posts/${post.id}`}>
          <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text)' }}>{post.title}</p>
          <p className="text-sm mt-0.5 leading-relaxed line-clamp-4" style={{ color: 'var(--text-2)' }}>{post.body}</p>
        </Link>

        {/* Image */}
        {post.image_urls?.[0] && (
          <Link href={`/posts/${post.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_urls[0]}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="mt-3 w-full max-h-72 object-cover rounded-2xl"
              style={{ border: '1px solid var(--border)' }}
            />
          </Link>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 -ml-2">
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm transition group"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1d9bf0'; e.currentTarget.style.background = 'rgba(29,155,240,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <MessageCircle size={17} />
            <span className="text-xs">Reply</span>
          </Link>

          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm transition"
            style={{ color: liked ? '#f91880' : 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f91880'; e.currentTarget.style.background = 'rgba(249,24,128,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = liked ? '#f91880' : 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
          </button>

          <button
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm transition"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00ba7c'; e.currentTarget.style.background = 'rgba(0,186,124,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Share size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}
