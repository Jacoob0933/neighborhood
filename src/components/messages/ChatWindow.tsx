'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/types/database'

interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  profiles?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
}

interface Props {
  conversationId: string
  currentUserId: string
  otherUser: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  initialMessages: ChatMessage[]
}

export function ChatWindow({ conversationId, currentUserId, otherUser, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          const newMsg = payload.new as ChatMessage
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()

          setMessages(prev => {
            // Avoid duplicates (we optimistically add our own messages)
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, { ...newMsg, profiles: profile ?? undefined }]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text || sending) return

    setSending(true)
    setBody('')

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body: text })
      .select()
      .single()

    // Replace optimistic message with real one
    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? (data as unknown as ChatMessage) : m))
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            Say hello to {otherUser.full_name ?? otherUser.username}!
          </p>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const showAvatar = !isMe && (i === 0 || messages[i - 1].sender_id !== msg.sender_id)

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <div className="w-7 shrink-0">
                  {showAvatar && (
                    <Avatar
                      src={otherUser.avatar_url}
                      name={otherUser.full_name ?? otherUser.username}
                      size="sm"
                    />
                  )}
                </div>
              )}

              <div className={`group max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-green-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                  } ${msg.id.startsWith('temp-') ? 'opacity-60' : ''}`}
                >
                  {msg.body}
                </div>
                <span className="text-[10px] text-gray-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white"
      >
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={`Message ${otherUser.full_name ?? otherUser.username}…`}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          autoFocus
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition disabled:opacity-50 disabled:scale-100 shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
