import { createClient } from '@/lib/supabase/server'
import { format, isFuture } from 'date-fns'
import Link from 'next/link'
import { MapPin, Clock, Users } from 'lucide-react'
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Local Events</h1>
        <Link
          href="/posts/new"
          className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
        >
          + Create
        </Link>
      </div>

      {!events?.length ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-gray-600">No upcoming events yet.</p>
          <p className="text-sm text-gray-400 mt-1">Organize something for your neighborhood!</p>
          <Link
            href="/posts/new"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
          >
            Create an event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const attending = event.event_attendees?.some((a: { user_id: string }) => a.user_id === user?.id)
            const count = event.event_attendees?.length ?? 0
            const full = !!event.max_attendees && count >= event.max_attendees && !attending
            const starts = new Date(event.starts_at)

            return (
              <div key={event.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Date block */}
                  <div className="shrink-0 w-12 text-center bg-purple-50 rounded-xl py-2">
                    <div className="text-xs font-medium text-purple-500 uppercase">
                      {format(starts, 'MMM')}
                    </div>
                    <div className="text-xl font-bold text-purple-700 leading-none">
                      {format(starts, 'd')}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/events/${event.id}`} className="font-semibold text-gray-900 hover:text-green-700 transition">
                      {event.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{format(starts, 'h:mm a')}</span>
                      </div>
                      {event.location_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          <span className="truncate">{event.location_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={12} />
                        <span>{count} going{event.max_attendees ? ` / ${event.max_attendees}` : ''}</span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={event.profiles?.avatar_url}
                      name={event.profiles?.full_name ?? event.profiles?.username}
                      size="sm"
                    />
                    <span className="text-xs text-gray-500">
                      by {event.profiles?.full_name ?? event.profiles?.username}
                    </span>
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
