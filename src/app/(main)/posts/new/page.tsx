'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, X, Image as ImageIcon } from 'lucide-react'
import type { PostCategory } from '@/types/database'

const CATEGORIES: { value: PostCategory; label: string; emoji: string; description: string }[] = [
  { value: 'general', label: 'General', emoji: '💬', description: 'General discussion' },
  { value: 'events', label: 'Event', emoji: '🎉', description: 'Local events' },
  { value: 'marketplace', label: 'Marketplace', emoji: '🛍️', description: 'Buy, sell, give away' },
  { value: 'lost_found', label: 'Lost & Found', emoji: '🔍', description: 'Missing or found items' },
]

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Event-specific fields
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')

  function detectLocation() {
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetectingLocation(false)
      },
      () => setDetectingLocation(false)
    )
  }

  function addImageUrl() {
    if (newImageUrl.trim()) {
      setImageUrls(prev => [...prev, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('city, neighborhood')
      .eq('id', user.id)
      .single()

    const postData: Record<string, unknown> = {
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      category,
      image_urls: imageUrls,
      city: profile?.city,
      neighborhood: profile?.neighborhood,
    }

    if (location) {
      postData.location = `POINT(${location.lng} ${location.lat})`
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()

    if (postError) {
      setError(postError.message)
      setLoading(false)
      return
    }

    // Create event record if category is events
    if (category === 'events' && eventDate) {
      const startsAt = new Date(`${eventDate}T${eventTime || '00:00'}`)
      await supabase.from('events').insert({
        post_id: post.id,
        organizer_id: user.id,
        title: title.trim(),
        description: body.trim(),
        location_name: eventLocation || null,
        starts_at: startsAt.toISOString(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      })
    }

    router.push(`/posts/${post.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
        >
          <X size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition ${
                  category === cat.value
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <div>
                  <div className="text-sm font-medium">{cat.label}</div>
                  <div className="text-xs opacity-70">{cat.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={120}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            placeholder="What's on your mind?"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Details</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={5}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
            placeholder="Add more details..."
          />
        </div>

        {/* Event-specific fields */}
        {category === 'events' && (
          <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-100">
            <p className="text-sm font-medium text-purple-700">📅 Event details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Event location</label>
              <input
                type="text"
                value={eventLocation}
                onChange={e => setEventLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="e.g. Central Park, Pavilion B"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max attendees</label>
              <input
                type="number"
                value={maxAttendees}
                onChange={e => setMaxAttendees(e.target.value)}
                min={1}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Images <span className="font-normal text-gray-400">(optional, paste URLs)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={e => setNewImageUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-600"
            >
              <ImageIcon size={18} />
            </button>
          </div>
          {imageUrls.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Precise location</label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition ${
              location
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-green-300'
            }`}
          >
            {detectingLocation ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Pin my location'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !body.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 active:scale-[0.98] transition disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Publish Post
          </button>
        </div>
      </form>
    </div>
  )
}
