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

  // Fetch other user profile
  const { data: otherUser } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, city, neighborhood')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) notFound()

  // Get or create conversation via RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversationId } = await (supabase as any)
    .rpc('get_or_create_conversation', { other_user_id: otherUserId })

  if (!conversationId) notFound()

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(id, username, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <div className="flex flex-col h-full max-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <Link href="/messages" className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={otherUser.avatar_url} name={otherUser.full_name ?? otherUser.username} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">
              {otherUser.full_name ?? otherUser.username}
            </p>
            {(otherUser.neighborhood || otherUser.city) && (
              <p className="text-xs text-gray-400 truncate">
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
