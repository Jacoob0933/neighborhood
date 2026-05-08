'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, MapPin, MoreHorizontal } from 'lucide-react'
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
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
  }

  const author = post.profiles
  const location = post.neighborhood || post.city

  return (
    <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      {post.image_urls?.[0] && (
        <Link href={`/posts/${post.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_urls[0]}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        </Link>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/profile/${author?.id ?? ''}`}>
              <Avatar src={author?.avatar_url} name={author?.full_name ?? author?.username} size="sm" />
            </Link>
            <div className="min-w-0">
              <Link href={`/profile/${author?.id ?? ''}`} className="text-sm font-medium text-gray-900 hover:underline truncate block">
                {author?.full_name ?? author?.username ?? 'Anonymous'}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                {location && (
                  <>
                    <MapPin size={10} />
                    <span className="truncate">{location}</span>
                    <span>·</span>
                  </>
                )}
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CategoryBadge category={post.category} />
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <Link href={`/posts/${post.id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-700 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3">{post.body}</p>
        </Link>

        {post.is_resolved && (
          <span className="inline-block mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            ✓ Resolved
          </span>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>

          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MessageCircle size={16} />
            <span>Reply</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
