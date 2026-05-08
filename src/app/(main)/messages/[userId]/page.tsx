import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ChatWindow } from '@/components/messages/ChatWindow'

interface Props { params: Promise<{ userId: string }> }

export default async function ConversationPage({ params }: Props) {
  const { userId: otherUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: otherUser } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, city, neighborhood')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversationId } = await (supabase as any)
    .rpc('get_or_create_conversation', { other_user_id: otherUserId })

  if (!conversationId) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(id, username, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <div className="flex flex-col h-full max-h-[100dvh]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.85)' }}
      >
        <Link
          href="/messages"
          className="flex items-center justify-center w-9 h-9 rounded-full transition hover:opacity-80"
          style={{ color: 'var(--text)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={otherUser.avatar_url} name={otherUser.full_name ?? otherUser.username} size="md" />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
              {otherUser.full_name ?? otherUser.username}
            </p>
            {(otherUser.neighborhood || otherUser.city) && (
              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                {otherUser.neighborhood ?? otherUser.city}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          conversationId={conversationId}
          currentUserId={user.id}
          otherUser={otherUser}
          initialMessages={messages ?? []}
        />
      </div>
    </div>
  )
}
