'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
  authorId: string
  authorProfileId?: string
  currentUserId?: string
  initialLikeCount: number
  initialLiked: boolean
}

export function PostActions({ postId, authorId, authorProfileId, currentUserId, initialLikeCount, initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)

  async function toggleLike() {
    if (!currentUserId || loading) return
    setLoading(true)
    const supabase = createClient()
    if (liked) {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: currentUserId })
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
    setLoading(false)
  }

  return (
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
        {/* Reply — placeholder */}
        <button
          className="post-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition"
          style={{ color: 'var(--text-3)' }}
        >
          <MessageCircle size={16} />
          <span>Reply</span>
        </button>

        {/* Like */}
        <button
          onClick={toggleLike}
          disabled={!currentUserId || loading}
          className="post-action-like flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition"
          style={{ color: liked ? '#f91880' : 'var(--text-3)' }}
        >
          <Heart size={16} fill={liked ? '#f91880' : 'none'} />
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Message author */}
        {currentUserId && authorId !== currentUserId && authorProfileId && (
          <Link
            href={`/messages/${authorProfileId}`}
            className="px-4 py-1.5 rounded-full text-sm font-bold transition hover:opacity-90"
            style={{ background: '#1d9bf0', color: 'white' }}
          >
            Message
          </Link>
        )}
      </div>

      <style>{`
        .post-action-btn:hover { color: #1d9bf0 !important; background: rgba(29,155,240,0.1); }
        .post-action-like:hover { color: #f91880 !important; background: rgba(249,24,128,0.1); }
      `}</style>
    </div>
  )
}
