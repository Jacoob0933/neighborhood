'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, X, Image as ImageIcon } from 'lucide-react'
import type { PostCategory } from '@/types/database'
import imageCompression from 'browser-image-compression'

const CATEGORIES: { value: PostCategory; label: string; emoji: string }[] = [
  { value: 'general', label: 'General', emoji: '💬' },
  { value: 'events', label: 'Event', emoji: '🎉' },
  { value: 'marketplace', label: 'Marketplace', emoji: '🛍️' },
  { value: 'lost_found', label: 'Lost & Found', emoji: '🔍' },
]

const inputStyle = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'var(--bg-2)',
  color: 'var(--text)',
  padding: '12px 16px',
  fontSize: '14px',
  outline: 'none',
}

export default function NewPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [images, setImages] = useState<{ preview: string; file: File }[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingImages(true)

    const newImages = await Promise.all(
      files.slice(0, 4 - images.length).map(async file => {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })
        const preview = URL.createObjectURL(compressed)
        return { preview, file: compressed }
      })
    )

    setImages(prev => [...prev, ...newImages])
    setUploadingImages(false)
    e.target.value = ''
  }

  function removeImage(index: number) {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
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

    // Upload images to Supabase Storage
    const imageUrls: string[] = []
    for (const { file } of images) {
      const ext = file.type === 'image/webp' ? 'webp' : file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
        imageUrls.push(publicUrl)
      }
    }

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
    <div>
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full transition"
          style={{ color: 'var(--text)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={18} />
        </button>
        <h1 className="text-base font-bold flex-1" style={{ color: 'var(--text)' }}>New Post</h1>
        <button
          form="post-form"
          type="submit"
          disabled={loading || !title.trim() || !body.trim()}
          className="px-5 py-1.5 rounded-full text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ background: '#1d9bf0' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
        </button>
      </div>

      <form id="post-form" onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
        {/* Category */}
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => {
            const active = category === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition text-sm font-medium"
                style={{
                  border: `1px solid ${active ? '#1d9bf0' : 'var(--border)'}`,
                  background: active ? 'rgba(29,155,240,0.1)' : 'var(--bg-2)',
                  color: active ? '#1d9bf0' : 'var(--text-2)',
                }}
              >
                <span className="text-base">{cat.emoji}</span>
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={120}
            style={inputStyle}
            placeholder="What's happening?"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Details</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={5}
            style={{ ...inputStyle, resize: 'none' }}
            placeholder="Share more details with your neighbors..."
          />
        </div>

        {/* Event details */}
        {category === 'events' && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>📅 Event details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Date *</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required
                  style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Time</label>
                <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                  style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Location name</label>
              <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                placeholder="e.g. Central Park" style={{ ...inputStyle, padding: '8px 12px' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Max attendees</label>
              <input type="number" value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} min={1}
                placeholder="Unlimited" style={{ ...inputStyle, padding: '8px 12px' }} />
            </div>
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
            Photos <span style={{ color: 'var(--text-3)' }}>(up to 4)</span>
          </label>

          {images.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl"
                    style={{ border: '1px solid var(--border)' }}
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--text)', color: 'var(--bg)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 4 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-2)',
                  color: 'var(--text-2)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#1d9bf0')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {uploadingImages
                  ? <Loader2 size={15} className="animate-spin" />
                  : <ImageIcon size={15} />}
                {uploadingImages ? 'Compressing...' : 'Add photos'}
              </button>
            </>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
            Precise location <span style={{ color: 'var(--text-3)' }}>(optional)</span>
          </label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition"
            style={{
              border: `1px solid ${location ? '#1d9bf0' : 'var(--border)'}`,
              background: location ? 'rgba(29,155,240,0.1)' : 'var(--bg-2)',
              color: location ? '#1d9bf0' : 'var(--text-2)',
            }}
          >
            {detectingLocation ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Pin my location'}
          </button>
        </div>

        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
