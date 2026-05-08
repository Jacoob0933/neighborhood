'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Trash2, Loader2 } from 'lucide-react'
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
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId })
      setLiked(true)
      setLikeCount(c => c + 1)
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
            disabled={!currentUserId || likeLoading}
            className="post-action-like flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition"
            style={{ color: liked ? '#f91880' : 'var(--text-3)' }}
          >
            <Heart size={16} fill={liked ? '#f91880' : 'none'} />
            <span>{liked ? 'Liked' : 'Like'}</span>
          </button>

          {/* Message author */}
          {currentUserId && !isAuthor && authorProfileId && (
            <Link
              href={`/messages/${authorProfileId}`}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition hover:opacity-90"
              style={{ background: '#1d9bf0', color: 'white' }}
            >
              Message
            </Link>
          )}

          {/* Delete — only for author */}
          {isAuthor && (
            <button
              onClick={() => setShowConfirm(true)}
              className="post-action-delete flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition"
              style={{ color: 'var(--text-3)' }}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Delete post?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
              This will permanently delete your post. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full py-2.5 text-sm font-bold transition hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={deletePost}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#f4212e' }}
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .post-action-btn:hover { color: #1d9bf0 !important; background: rgba(29,155,240,0.1); }
        .post-action-like:hover { color: #f91880 !important; background: rgba(249,24,128,0.1); }
        .post-action-delete:hover { color: #f4212e !important; background: rgba(244,33,46,0.1); }
      `}</style>
    </>
  )
}
