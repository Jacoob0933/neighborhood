'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, X, ImageIcon, CalendarDays, Users, Clock } from 'lucide-react'
import type { PostCategory } from '@/types/database'
import imageCompression from 'browser-image-compression'

const CATEGORIES: {
  value: PostCategory
  label: string
  emoji: string
  desc: string
  color: string
  bg: string
  placeholder: { title: string; body: string }
}[] = [
  {
    value: 'general',
    label: 'General',
    emoji: '💬',
    desc: 'Anything on your mind',
    color: '#58a6ff',
    bg: 'rgba(88,166,255,0.13)',
    placeholder: { title: "What's on your mind?", body: 'Share something with your neighbors…' },
  },
  {
    value: 'events',
    label: 'Event',
    emoji: '🎉',
    desc: 'Organize local events',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.13)',
    placeholder: { title: 'Event name', body: 'Tell neighbors what to expect…' },
  },
  {
    value: 'marketplace',
    label: 'Marketplace',
    emoji: '🛍️',
    desc: 'Buy, sell, give away',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.13)',
    placeholder: { title: 'What are you selling?', body: 'Price, condition, pickup info…' },
  },
  {
    value: 'lost_found',
    label: 'Lost & Found',
    emoji: '🔍',
    desc: 'Help find things & pets',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.13)',
    placeholder: { title: 'What was lost or found?', body: 'Describe it and where you last saw it…' },
  },
  {
    value: 'promo',
    label: 'Promo',
    emoji: '📢',
    desc: 'Business, café, barber…',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.13)',
    placeholder: { title: 'Your offer or announcement', body: 'Tell neighbors about your business…' },
  },
]

export default function NewPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
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

  const activeCat = CATEGORIES.find(c => c.value === category)!
  const canPost = title.trim().length >= 2 && body.trim().length >= 3

  function detectLocation() {
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDetectingLocation(false)
      },
      () => setDetectingLocation(false),
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    )
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingImages(true)
    const newImages = await Promise.all(
      files.slice(0, 4 - images.length).map(async file => {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true,
        })
        return { preview: URL.createObjectURL(compressed), file: compressed }
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
    if (!canPost) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('posts').select('id', { count: 'exact', head: true })
      .eq('author_id', user.id).gte('created_at', oneHourAgo)
    if ((recentCount ?? 0) >= 5) {
      setError('Posting too fast — max 5 posts per hour.')
      setLoading(false); return
    }

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString()
    const { count: veryRecentCount } = await supabase
      .from('posts').select('id', { count: 'exact', head: true })
      .eq('author_id', user.id).gte('created_at', thirtySecondsAgo)
    if ((veryRecentCount ?? 0) >= 1) {
      setError('Please wait 30 seconds before posting again.')
      setLoading(false); return
    }

    const { data: profile } = await supabase
      .from('profiles').select('city, neighborhood').eq('id', user.id).single()

    const imageUrls: string[] = []
    for (const { file } of images) {
      const ext = file.type === 'image/webp' ? 'webp' : file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-images').upload(path, file, { contentType: file.type, upsert: false })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
        imageUrls.push(publicUrl)
      }
    }

    const postData: Record<string, unknown> = {
      author_id: user.id, title: title.trim(), body: body.trim(),
      category, image_urls: imageUrls,
      city: profile?.city, neighborhood: profile?.neighborhood,
    }
    if (location) postData.location = `POINT(${location.lng} ${location.lat})`

    const { data: post, error: postError } = await supabase
      .from('posts').insert(postData).select().single()

    if (postError) {
      setError(postError.message); setLoading(false); return
    }

    if (category === 'events' && eventDate) {
      const startsAt = new Date(`${eventDate}T${eventTime || '00:00'}`)
      await supabase.from('events').insert({
        post_id: post.id, organizer_id: user.id,
        title: title.trim(), description: body.trim(),
        location_name: eventLocation || null,
        starts_at: startsAt.toISOString(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      })
    }

    router.push(`/posts/${post.id}`)
  }

  const inputBase = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    width: '100%',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: 'rgba(8,8,15,0.9)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="tap flex items-center justify-center w-9 h-9 rounded-full transition"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={18} />
        </button>

        <div className="flex-1">
          <span className="text-base font-bold" style={{ color: 'var(--text)' }}>New Post</span>
        </div>

        <button
          form="post-form"
          type="submit"
          disabled={loading || !canPost}
          className="tap flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold text-white transition"
          style={{
            background: canPost
              ? `linear-gradient(135deg, ${activeCat.color}, ${activeCat.color}cc)`
              : 'var(--bg-3)',
            color: canPost ? 'white' : 'var(--text-3)',
            transition: 'all 200ms ease',
          }}
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Post
        </button>
      </div>

      <form id="post-form" onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Category picker ── */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            Category
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => {
              const active = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className="tap shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-left transition-all"
                  style={{
                    border: `1.5px solid ${active ? cat.color : 'var(--border)'}`,
                    background: active ? cat.bg : 'var(--bg-2)',
                    color: active ? cat.color : 'var(--text-2)',
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: active ? `0 0 18px ${cat.color}28` : 'none',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold whitespace-nowrap">{cat.label}</div>
                    <div className="text-xs whitespace-nowrap" style={{ color: active ? `${cat.color}99` : 'var(--text-3)' }}>
                      {cat.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Compose area ── */}
        <div className="flex-1 px-4 pt-5 pb-2 space-y-4">

          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder={activeCat.placeholder.title}
              style={{
                ...inputBase,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-0.3px',
                lineHeight: 1.3,
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', marginLeft: 0 }} />

          {/* Body */}
          <div>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={e => {
                setBody(e.target.value)
                // auto-grow
                if (bodyRef.current) {
                  bodyRef.current.style.height = 'auto'
                  bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px'
                }
              }}
              required
              rows={4}
              maxLength={2000}
              placeholder={activeCat.placeholder.body}
              style={{
                ...inputBase,
                fontSize: 15,
                lineHeight: 1.65,
                resize: 'none',
                minHeight: 120,
              }}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs" style={{ color: body.length > 1800 ? '#f87171' : 'var(--text-3)' }}>
                {body.length}/2000
              </span>
            </div>
          </div>

          {/* ── Event fields ── */}
          {category === 'events' && (
            <div
              className="rounded-2xl p-4 space-y-4 pop-in"
              style={{ background: 'rgba(192,132,252,0.07)', border: '1.5px solid rgba(192,132,252,0.25)' }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c084fc' }}>
                <CalendarDays size={15} />
                Event details
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-3)' }}>Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    style={{
                      width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                      background: 'var(--bg-2)', color: 'var(--text)',
                      padding: '9px 12px', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-3)' }}>Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    style={{
                      width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                      background: 'var(--bg-2)', color: 'var(--text)',
                      padding: '9px 12px', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  <MapPin size={11} /> Venue name
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  placeholder="e.g. Central Park, Café Noma…"
                  style={{
                    width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--bg-2)', color: 'var(--text)',
                    padding: '9px 12px', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  <Users size={11} /> Max attendees
                </label>
                <input
                  type="number"
                  value={maxAttendees}
                  onChange={e => setMaxAttendees(e.target.value)}
                  min={1}
                  placeholder="Leave blank for unlimited"
                  style={{
                    width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--bg-2)', color: 'var(--text)',
                    padding: '9px 12px', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Image previews ── */}
          {images.length > 0 && (
            <div className="flex gap-2.5 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative group pop-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt=""
                    className="object-cover"
                    loading="lazy"
                    style={{
                      width: 88, height: 88,
                      borderRadius: 14,
                      border: '1.5px solid var(--border)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                    style={{ background: '#1a1a2e', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add more */}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="tap flex flex-col items-center justify-center gap-1 rounded-2xl"
                  style={{
                    width: 88, height: 88,
                    border: '2px dashed var(--border)',
                    color: 'var(--text-3)',
                    background: 'var(--bg-2)',
                    fontSize: 11,
                  }}
                >
                  {uploadingImages
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><ImageIcon size={16} /><span>Add</span></>}
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm pop-in"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── Bottom action bar ── */}
        <div
          className="sticky bottom-0 flex items-center gap-1 px-3 py-3 backdrop-blur-md"
          style={{
            background: 'rgba(8,8,15,0.92)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {/* Photo button */}
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
            disabled={images.length >= 4 || uploadingImages}
            className="tap flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition"
            style={{
              color: images.length > 0 ? activeCat.color : 'var(--text-2)',
              background: images.length > 0 ? activeCat.bg : 'transparent',
              opacity: images.length >= 4 ? 0.4 : 1,
            }}
            title="Add photos"
          >
            {uploadingImages
              ? <Loader2 size={16} className="animate-spin" />
              : <ImageIcon size={16} />}
            {images.length > 0 && <span className="text-xs font-bold">{images.length}/4</span>}
          </button>

          {/* Location button */}
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="tap flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition"
            style={{
              color: location ? '#4ade80' : 'var(--text-2)',
              background: location ? 'rgba(74,222,128,0.12)' : 'transparent',
            }}
            title={location ? 'Location pinned' : 'Pin location'}
          >
            {detectingLocation
              ? <Loader2 size={16} className="animate-spin" />
              : <MapPin size={16} />}
            {location && <span className="text-xs font-bold">Pinned</span>}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clock hint */}
          {category === 'events' && eventDate && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>
              <Clock size={12} />
              {eventDate}{eventTime ? ` ${eventTime}` : ''}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
