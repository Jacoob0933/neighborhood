'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
  authorId: string
  authorProfileId?: string
  currentUserId?: string
  initialLikeCount: number
  initialLiked: boolean
}

export function PostActions({ postId, authorId, currentUserId, initialLikeCount, initialLiked }: Props) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [likeLoading, setLikeLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isAuthor = currentUserId && authorId === currentUserId

  async function toggleLike() {
    if (!currentUserId || likeLoading) return
    setLikeLoading(true)
    const supabase = createClient()
    if (liked) {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: currentUserId })
      setLiked(false); setLikeCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId })
      setLiked(true); setLikeCount(c => c + 1)
    }
    setLikeLoading(false)
  }

  async function deletePost() {
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    router.push('/feed')
    router.refresh()
  }

  return (
    <>
      {/* Stats row */}
      {likeCount > 0 && (
        <div className="py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text-2)' }}>
            <strong style={{ color: 'var(--text)' }}>{likeCount}</strong> {likeCount === 1 ? 'like' : 'likes'}
          </span>
        </div>
      )}

      {/* Action bar */}
      <div
        className="flex items-center py-1"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Reply */}
        <button
          className="tap flex items-center gap-1.5 px-3 py-2 rounded-full text-sm flex-1 justify-center transition"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1d9bf0'; e.currentTarget.style.background = 'rgba(29,155,240,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <MessageCircle size={18} />
          <span className="text-xs font-medium">Reply</span>
        </button>

        {/* Like */}
        <button
          onClick={toggleLike}
          disabled={!currentUserId || likeLoading}
          className="tap flex items-center gap-1.5 px-3 py-2 rounded-full text-sm flex-1 justify-center transition"
          style={{ color: liked ? '#f91880' : 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f91880'; e.currentTarget.style.background = 'rgba(249,24,128,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = liked ? '#f91880' : 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span className="text-xs font-medium">{liked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Share */}
        <button
          className="tap flex items-center gap-1.5 px-3 py-2 rounded-full text-sm flex-1 justify-center transition"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00ba7c'; e.currentTarget.style.background = 'rgba(0,186,124,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Share2 size={18} />
          <span className="text-xs font-medium">Share</span>
        </button>

        {/* Delete — author only */}
        {isAuthor && (
          <button
            onClick={() => setShowConfirm(true)}
            className="tap flex items-center gap-1.5 px-3 py-2 rounded-full text-sm flex-1 justify-center transition"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f4212e'; e.currentTarget.style.background = 'rgba(244,33,46,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 size={18} />
            <span className="text-xs font-medium">Delete</span>
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 fade-in"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'var(--border)' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Delete post?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
              This will permanently delete your post. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="tap flex-1 rounded-full py-3 text-sm font-bold transition"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={deletePost}
                disabled={deleteLoading}
                className="tap flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: '#f4212e' }}
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
