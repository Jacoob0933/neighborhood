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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <ArrowLeft size={16} />
        Back to events
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.title} className="w-full h-56 object-cover" />
        )}

        <div className="p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Calendar size={16} className="text-purple-500 shrink-0" />
              <span>{format(starts, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Clock size={16} className="text-purple-500 shrink-0" />
              <span>
                {format(starts, 'h:mm a')}
                {event.ends_at && ` – ${format(new Date(event.ends_at), 'h:mm a')}`}
              </span>
            </div>
            {event.location_name && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <MapPin size={16} className="text-purple-500 shrink-0" />
                <span>{event.location_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Users size={16} className="text-purple-500 shrink-0" />
              <span>{count} attending{event.max_attendees ? ` · ${event.max_attendees} spots total` : ''}</span>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">{event.description}</p>
          )}

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
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Message organizer
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Attendees */}
        {event.event_attendees?.length > 0 && (
          <div className="border-t border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Attendees ({count})
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.event_attendees.map((a: { user_id: string; profiles?: { id: string; username?: string; full_name?: string; avatar_url?: string } }) => (
                <Link key={a.user_id} href={`/profile/${a.user_id}`}>
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-full pr-3 pl-1 py-1 hover:bg-gray-100 transition">
                    <Avatar src={a.profiles?.avatar_url} name={a.profiles?.full_name ?? a.profiles?.username} size="sm" />
                    <span className="text-xs font-medium text-gray-700">
                      {a.profiles?.full_name ?? a.profiles?.username ?? 'User'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
