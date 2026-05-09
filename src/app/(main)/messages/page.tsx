import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, PenSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { MessagesListRealtime } from '@/components/messages/MessagesListRealtime'

// Always render fresh - never cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Step 1: get conversation IDs for this user
  const { data: myParticipations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  console.log('[Messages] user.id:', user.id)
  console.log('[Messages] myParticipations:', myParticipations)
  console.log('[Messages] partError:', partError)

  const convIds = (myParticipations ?? []).map(p => p.conversation_id)

  if (convIds.length === 0) {
    return (
      <>
        <MessagesListRealtime userId={user.id} conversationIds={[]} />
        <EmptyState />
        <div style={{ position: 'fixed', bottom: 60, left: 10, right: 10, padding: 12, fontSize: 11, background: '#1a1a2e', color: '#f91880', borderRadius: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          DEBUG: user.id={user.id} | participations={JSON.stringify(myParticipations)} | error={partError?.message ?? 'none'}
        </div>
      </>
    )
  }

  // Step 2: get all participants in those conversations
  const { data: allParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds)

  // Step 3: get profiles for all other users
  const otherUserIds = [...new Set(
    (allParticipants ?? [])
      .filter(p => p.user_id !== user.id)
      .map(p => p.user_id)
  )]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', otherUserIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  // Step 4: get last message for each conversation
  const { data: allMessages } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  // Group: last message per conversation
  const lastMsgMap: Record<string, typeof allMessages extends (infer T)[] | null ? T : never> = {}
  for (const msg of allMessages ?? []) {
    if (!lastMsgMap[msg.conversation_id]) lastMsgMap[msg.conversation_id] = msg
  }

  // Build conversation list
  const conversations = convIds
    .map(convId => {
      const otherParticipant = (allParticipants ?? []).find(
        p => p.conversation_id === convId && p.user_id !== user.id
      )
      const otherProfile = otherParticipant ? profileMap[otherParticipant.user_id] : null
      const lastMsg = lastMsgMap[convId]
      return { convId, otherProfile, lastMsg, otherUserId: otherParticipant?.user_id }
    })
    .filter(c => c.otherProfile)
    .sort((a, b) => {
      const aTime = a.lastMsg ? new Date(a.lastMsg.created_at).getTime() : 0
      const bTime = b.lastMsg ? new Date(b.lastMsg.created_at).getTime() : 0
      return bTime - aTime
    })

  if (conversations.length === 0) return <EmptyState />

  return (
    <div>
      <MessagesListRealtime userId={user.id} conversationIds={convIds} />
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(6,6,10,0.88)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
        <PenSquare size={18} style={{ color: 'var(--text-2)' }} />
      </div>

      <div>
        {conversations.map(({ convId, otherProfile, lastMsg, otherUserId }) => (
          <Link
            key={convId}
            href={`/messages/${otherUserId}`}
            className="flex items-center gap-3 px-4 py-3.5 transition post-row"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="relative shrink-0">
              <Avatar
                src={otherProfile!.avatar_url}
                name={otherProfile!.full_name ?? otherProfile!.username}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                  {otherProfile!.full_name ?? otherProfile!.username ?? 'User'}
                </span>
                {lastMsg && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
                    {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                {lastMsg
                  ? (lastMsg.sender_id === user.id ? `You: ${lastMsg.body}` : lastMsg.body)
                  : 'No messages yet'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div>
      <div
        className="sticky top-0 z-30 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(6,6,10,0.88)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
      </div>
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
