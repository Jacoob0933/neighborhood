import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Users, Calendar } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EventAttendButton } from '@/components/events/EventAttendButton'

interface Props { params: Promise<{ id: string }> }

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      profiles(id, username, full_name, avatar_url, city, neighborhood),
      event_attendees(user_id, profiles(id, username, full_name, avatar_url))
    `)
    .eq('id', id)
    .single()

  if (!event) notFound()

  const attending = event.event_attendees?.some((a: { user_id: string }) => a.user_id === user?.id)
  const count = event.event_attendees?.length ?? 0
  const full = !!event.max_attendees && count >= event.max_attendees && !attending
  const starts = new Date(event.starts_at)

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/events"
          className="flex items-center justify-center w-9 h-9 rounded-full transition hover:opacity-80"
          style={{ color: 'var(--text)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Event</h1>
      </div>

      <article>
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.title} className="w-full max-h-64 object-cover" />
        )}

        <div className="px-4 py-4">
          {/* Title */}
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>{event.title}</h2>

          {/* Details */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
              <Calendar size={15} style={{ color: '#1d9bf0' }} className="shrink-0" />
              <span>{format(starts, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
              <Clock size={15} style={{ color: '#1d9bf0' }} className="shrink-0" />
              <span>
                {format(starts, 'h:mm a')}
                {event.ends_at && ` – ${format(new Date(event.ends_at), 'h:mm a')}`}
              </span>
            </div>
            {event.location_name && (
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
                <MapPin size={15} style={{ color: '#1d9bf0' }} className="shrink-0" />
                <span>{event.location_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
              <Users size={15} style={{ color: '#1d9bf0' }} className="shrink-0" />
              <span>{count} attending{event.max_attendees ? ` · ${event.max_attendees} spots total` : ''}</span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-5" style={{ color: 'var(--text-2)' }}>
              {event.description}
            </p>
          )}

          {/* Organizer */}
          <div className="flex items-center gap-2.5 mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <Link href={`/profile/${event.profiles?.id}`}>
              <Avatar
                src={event.profiles?.avatar_url}
                name={event.profiles?.full_name ?? event.profiles?.username}
                size="md"
              />
            </Link>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Organized by</p>
              <Link
                href={`/profile/${event.profiles?.id}`}
                className="text-sm font-semibold hover:underline"
                style={{ color: 'var(--text)' }}
              >
                {event.profiles?.full_name ?? event.profiles?.username}
              </Link>
            </div>
          </div>

          {/* Actions */}
          {user && (
            <div className="flex gap-3">
              <EventAttendButton
                eventId={event.id}
                userId={user.id}
                attending={!!attending}
                full={full}
              />
              {event.organizer_id !== user.id && (
                <Link
                  href={`/messages/${event.profiles?.id}`}
                  className="px-4 py-2 rounded-full text-sm font-bold transition hover:opacity-80"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  Message organizer
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Attendees */}
        {event.event_attendees?.length > 0 && (
          <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            <h2 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-3)' }}>
              ATTENDEES ({count})
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.event_attendees.map((a: { user_id: string; profiles?: { id: string; username?: string; full_name?: string; avatar_url?: string } }) => (
                <Link key={a.user_id} href={`/profile/${a.user_id}`}>
                  <div
                    className="flex items-center gap-1.5 rounded-full pr-3 pl-1 py-1 transition hover:opacity-80"
                    style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
                  >
                    <Avatar src={a.profiles?.avatar_url} name={a.profiles?.full_name ?? a.profiles?.username} size="sm" />
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {a.profiles?.full_name ?? a.profiles?.username ?? 'User'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
