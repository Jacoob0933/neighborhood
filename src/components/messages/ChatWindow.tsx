'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Check } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
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

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'MMM d, HH:mm')
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

export function ChatWindow({ conversationId, currentUserId, otherUser, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length <= initialMessages.length ? 'instant' : 'smooth' })
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async payload => {
          const newMsg = payload.new as ChatMessage
          // Don't add if it's from us (we already added optimistically)
          if (newMsg.sender_id === currentUserId) return
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()
          setMessages(prev => {
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

    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
    }])

    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body: text })
      .select().single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? (data as unknown as ChatMessage) : m))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  // Group messages with date dividers
  const rendered: { type: 'divider'; label: string } | ChatMessage[] = []
  const items: Array<{ type: 'divider'; label: string } | { type: 'msg'; msg: ChatMessage }> = []
  let lastDate = ''
  for (const msg of messages) {
    const d = new Date(msg.created_at)
    const dateKey = format(d, 'yyyy-MM-dd')
    if (dateKey !== lastDate) {
      const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d')
      items.push({ type: 'divider', label })
      lastDate = dateKey
    }
    items.push({ type: 'msg', msg })
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Avatar src={otherUser.avatar_url} name={otherUser.full_name ?? otherUser.username} size="xl" />
            <p className="font-semibold text-sm mt-3 mb-1" style={{ color: 'var(--text)' }}>
              {otherUser.full_name ?? otherUser.username}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Say hello 👋
            </p>
          </div>
        )}

        {items.map((item, i) => {
          if (item.type === 'divider') {
            return <DateDivider key={`div-${i}`} label={item.label} />
          }
          const msg = item.msg
          const isMe = msg.sender_id === currentUserId
          const isTemp = msg.id.startsWith('temp-')
          const prevItem = items[i - 1]
          const prevMsg = prevItem?.type === 'msg' ? prevItem.msg : null
          const nextItem = items[i + 1]
          const nextMsg = nextItem?.type === 'msg' ? nextItem.msg : null
          const isFirst = !prevMsg || prevMsg.sender_id !== msg.sender_id
          const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}
            >
              {/* Other user avatar */}
              {!isMe && (
                <div className="w-6 shrink-0 self-end">
                  {isLast && (
                    <Avatar src={otherUser.avatar_url} name={otherUser.full_name ?? otherUser.username} size="sm" />
                  )}
                </div>
              )}

              <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className="px-3.5 py-2 text-sm leading-relaxed break-words"
                  style={{
                    background: isMe ? '#1d9bf0' : 'var(--bg-2)',
                    color: isMe ? 'white' : 'var(--text)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                    opacity: isTemp ? 0.6 : 1,
                    borderRadius: isMe
                      ? `18px 18px ${isLast ? '4px' : '18px'} 18px`
                      : `18px 18px 18px ${isLast ? '4px' : '18px'}`,
                  }}
                >
                  {msg.body}
                </div>
                {/* Timestamp + delivered on last message from me */}
                {isMe && isLast && (
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {formatMsgTime(msg.created_at)}
                    </span>
                    {!isTemp && <Check size={10} style={{ color: 'var(--text-3)' }} />}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input bar */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2.5 px-3 py-3 pb-safe"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={`Message ${otherUser.full_name ?? otherUser.username}…`}
          className="flex-1 rounded-full px-4 py-2.5 text-sm focus:outline-none transition"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          autoFocus
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="tap w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-40"
          style={{ background: body.trim() ? '#1d9bf0' : 'var(--bg-3)', transition: 'background 200ms' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
