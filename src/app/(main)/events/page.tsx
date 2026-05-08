import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { MapPin, Clock, Users, PlusCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EventAttendButton } from '@/components/events/EventAttendButton'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      profiles(id, username, full_name, avatar_url),
      event_attendees(user_id)
    `)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(30)

  return (
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Events</h1>
        <Link
          href="/posts/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#1d9bf0' }}
        >
          <PlusCircle size={14} />
          Create
        </Link>
      </div>

      {!events?.length ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>No upcoming events yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Organize something for your neighborhood!</p>
          <Link
            href="/posts/new"
            className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#1d9bf0' }}
          >
            Create an event
          </Link>
        </div>
      ) : (
        <div>
          {events.map(event => {
            const attending = event.event_attendees?.some((a: { user_id: string }) => a.user_id === user?.id)
            const count = event.event_attendees?.length ?? 0
            const full = !!event.max_attendees && count >= event.max_attendees && !attending
            const starts = new Date(event.starts_at)

            return (
              <div
                key={event.id}
                className="px-4 py-4 transition"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Date block */}
                  <div
                    className="shrink-0 w-12 text-center rounded-xl py-2"
                    style={{ background: 'rgba(29,155,240,0.12)' }}
                  >
                    <div className="text-xs font-semibold uppercase" style={{ color: '#1d9bf0' }}>
                      {format(starts, 'MMM')}
                    </div>
                    <div className="text-xl font-bold leading-none" style={{ color: '#1d9bf0' }}>
                      {format(starts, 'd')}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-semibold text-sm hover:underline block"
                      style={{ color: 'var(--text)' }}
                    >
                      {event.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                        <Clock size={11} />
                        <span>{format(starts, 'h:mm a')}</span>
                      </div>
                      {event.location_name && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                          <MapPin size={11} />
                          <span className="truncate max-w-[150px]">{event.location_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                        <Users size={11} />
                        <span>{count} going{event.max_attendees ? ` / ${event.max_attendees}` : ''}</span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-2)' }}>
                        {event.description}
                      </p>
                    )}
                  </div>

                  {user && (
                    <EventAttendButton
                      eventId={event.id}
                      userId={user.id}
                      attending={!!attending}
                      full={full}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 ml-15">
                  <Avatar
                    src={event.profiles?.avatar_url}
                    name={event.profiles?.full_name ?? event.profiles?.username}
                    size="sm"
                  />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    by {event.profiles?.full_name ?? event.profiles?.username}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
