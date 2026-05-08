'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Props {
  eventId: string
  userId: string
  attending: boolean
  full: boolean
}

export function EventAttendButton({ eventId, userId, attending: initialAttending, full }: Props) {
  const [attending, setAttending] = useState(initialAttending)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    if (attending) {
      await supabase.from('event_attendees').delete().match({ event_id: eventId, user_id: userId })
      setAttending(false)
    } else {
      await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId })
      setAttending(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || (full && !attending)}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition"
      style={attending
        ? { background: '#1d9bf0', color: 'white' }
        : full
        ? { background: 'var(--bg-2)', color: 'var(--text-3)', cursor: 'not-allowed', border: '1px solid var(--border)' }
        : { background: 'transparent', color: '#1d9bf0', border: '1px solid #1d9bf0' }
      }
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {attending ? 'Going ✓' : full ? 'Full' : 'Attend'}
    </button>
  )
}
