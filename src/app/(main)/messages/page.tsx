import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: participations } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations(
        id,
        created_at,
        conversation_participants(
          user_id,
          profiles(id, username, full_name, avatar_url)
        ),
        messages(id, body, created_at, sender_id)
      )
    `)
    .eq('user_id', user.id)
    .order('conversation_id', { ascending: false })

  type ConvRow = {
    conversation_id: string
    conversations: {
      id: string
      created_at: string
      conversation_participants: {
        user_id: string
        profiles: { id: string; username: string; full_name: string | null; avatar_url: string | null } | null
      }[]
      messages: { id: string; body: string; created_at: string; sender_id: string }[]
    } | null
  }

  const conversations = (participations as ConvRow[] | null)
    ?.map(p => {
      const conv = p.conversations
      if (!conv) return null
      const other = conv.conversation_participants.find(cp => cp.user_id !== user.id)
      const messages = [...(conv.messages ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const lastMessage = messages[0]
      return { conv, other, lastMessage }
    })
    .filter(Boolean) ?? []

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>No messages yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Start a conversation by messaging someone from a post.
          </p>
        </div>
      ) : (
        <div>
          {conversations.map(item => {
            if (!item) return null
            const { conv, other, lastMessage } = item
            const otherProfile = other?.profiles

            return (
              <Link
                key={conv.id}
                href={`/messages/${other?.user_id}`}
                className="flex items-center gap-3 px-4 py-3 transition"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Avatar
                  src={otherProfile?.avatar_url}
                  name={otherProfile?.full_name ?? otherProfile?.username}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {otherProfile?.full_name ?? otherProfile?.username ?? 'User'}
                    </span>
                    {lastMessage && (
                      <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-3)' }}>
                        {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {lastMessage
                      ? `${lastMessage.sender_id === user.id ? 'You: ' : ''}${lastMessage.body}`
                      : 'No messages yet'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
