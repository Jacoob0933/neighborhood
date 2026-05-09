'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  conversationIds: string[]
}

/**
 * Listens for new messages in any conversation the user is part of,
 * and refreshes the server component when one arrives.
 */
export function MessagesListRealtime({ userId, conversationIds }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (conversationIds.length === 0) {
      // Even with no conversations, listen for new participations
      const channel = createClient()
        .channel(`participations:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${userId}` },
          () => router.refresh()
        )
        .subscribe()
      return () => { channel.unsubscribe() }
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`messages-list:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as { conversation_id?: string }
          if (msg.conversation_id && conversationIds.includes(msg.conversation_id)) {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${userId}` },
        () => router.refresh()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [userId, conversationIds, router])

  return null
}
