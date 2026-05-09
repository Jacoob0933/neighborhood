import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, PenSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { MessagesListRealtime } from '@/components/messages/MessagesListRealtime'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Conversation {
  conversation_id: string
  other_user_id: string
  other_username: string | null
  other_full_name: string | null
  other_avatar_url: string | null
  last_message_body: string | null
  last_message_sender_id: string | null
  last_message_created_at: string | null
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversations, error } = await (supabase as any).rpc('my_conversations')

  if (error) {
    return (
      <div>
        <Header />
        <div style={{ padding: 16, color: '#f91880', fontSize: 12, fontFamily: 'monospace' }}>
          Error: {error.message}
        </div>
      </div>
    )
  }

  const list = (conversations ?? []) as Conversation[]
  const convIds = list.map(c => c.conversation_id)

  if (list.length === 0) {
    return (
      <>
        <MessagesListRealtime userId={user.id} conversationIds={[]} />
        <EmptyState />
      </>
    )
  }

  return (
    <div>
      <MessagesListRealtime userId={user.id} conversationIds={convIds} />
      <Header />
      <div>
        {list.map(c => (
          <Link
            key={c.conversation_id}
            href={`/messages/${c.other_user_id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition post-row"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="relative shrink-0">
              <Avatar
                src={c.other_avatar_url}
                name={c.other_full_name ?? c.other_username ?? 'User'}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                  {c.other_full_name ?? c.other_username ?? 'User'}
                </span>
                {c.last_message_created_at && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
                    {formatDistanceToNow(new Date(c.last_message_created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                {c.last_message_body
                  ? (c.last_message_sender_id === user.id ? `You: ${c.last_message_body}` : c.last_message_body)
                  : 'No messages yet'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Header() {
  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md"
      style={{ background: 'rgba(6,6,10,0.88)', borderBottom: '1px solid var(--border)' }}
    >
      <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
      <PenSquare size={18} style={{ color: 'var(--text-2)' }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div>
      <Header />
      <div className="text-center py-20 px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--bg-2)' }}
        >
          <MessageCircle size={28} style={{ color: 'var(--text-3)' }} />
        </div>
        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>No messages yet</p>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Start a conversation by clicking Message on someone&apos;s post or profile.
        </p>
      </div>
    </div>
  )
}
