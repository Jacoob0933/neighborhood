'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bell, Lock, Eye, EyeOff, MapPin, MessageCircle,
  Trash2, Loader2, ChevronRight, Shield, User, LogOut
} from 'lucide-react'

type Privacy = {
  profile_public: boolean
  show_location: boolean
  allow_messages: boolean
  show_in_nearby: boolean
}

type Notifs = {
  likes: boolean
  comments: boolean
  messages: boolean
  events: boolean
}

const DEFAULT_PRIVACY: Privacy = {
  profile_public: true,
  show_location: true,
  allow_messages: true,
  show_in_nearby: true,
}

const DEFAULT_NOTIFS: Notifs = {
  likes: true,
  comments: true,
  messages: true,
  events: false,
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [privacy, setPrivacy] = useState<Privacy>(DEFAULT_PRIVACY)
  const [notifs, setNotifs] = useState<Notifs>(DEFAULT_NOTIFS)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.push('/sign-in'); return }

        setEmail(user.email ?? '')
        setUserId(user.id)

        // select * so we don't error if new columns don't exist yet
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUsername(profile.username ?? '')

          // privacy_settings — JSONB column (may not exist yet → undefined)
          if (profile.privacy_settings && typeof profile.privacy_settings === 'object') {
            setPrivacy(p => ({ ...p, ...(profile.privacy_settings as Partial<Privacy>) }))
          }

          // notification_settings — JSONB column (may not exist yet → undefined)
          if (profile.notification_settings && typeof profile.notification_settings === 'object') {
            setNotifs(n => ({ ...n, ...(profile.notification_settings as Partial<Notifs>) }))
          }
        }
      } catch {
        // silently fall back to defaults — page still renders
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function savePrivacy(key: keyof Privacy, val: boolean) {
    setSaving(key)
    const next = { ...privacy, [key]: val }
    setPrivacy(next)
    try {
      if (userId) {
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({ privacy_settings: next })
          .eq('id', userId)
      }
    } catch {
      // column may not exist — update is a no-op until migration runs
    }
    setSaving(null)
  }

  async function saveNotif(key: keyof Notifs, val: boolean) {
    setSaving('notif_' + key)
    const next = { ...notifs, [key]: val }
    setNotifs(next)
    try {
      if (userId) {
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({ notification_settings: next })
          .eq('id', userId)
      }
    } catch {
      // no-op until migration runs
    }
    setSaving(null)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  async function deleteAccount() {
    if (deleteInput !== 'DELETE' || !userId) return
    setDeleting(true)
    try {
      const supabase = createClient()
      // Delete posts, likes, messages, then profile
      await supabase.from('post_likes').delete().eq('user_id', userId)
      await supabase.from('posts').delete().eq('author_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.auth.signOut()
      router.push('/sign-in')
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin" size={26} style={{ color: '#1d9bf0' }} />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pb-16">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3.5 backdrop-blur-md"
        style={{ background: 'rgba(6,6,10,0.9)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
      </div>

      {/* Account */}
      <Section icon={<User size={15} />} title="Account">
        <InfoRow label="Username" value={`@${username}`} last={false} />
        <InfoRow label="Email" value={email} last={false} />
        <LinkRow label="Edit profile" sub="Name, bio, avatar, city" href="/profile/edit" last />
      </Section>

      {/* Privacy */}
      <Section icon={<Shield size={15} />} title="Privacy">
        <ToggleRow
          label="Public profile"
          sub="Anyone can view your profile and posts"
          icon={<Eye size={14} />}
          value={privacy.profile_public}
          loading={saving === 'profile_public'}
          onChange={v => savePrivacy('profile_public', v)}
        />
        <ToggleRow
          label="Show in Nearby feed"
          sub="Your posts appear to neighbors within 30 km"
          icon={<MapPin size={14} />}
          value={privacy.show_in_nearby}
          loading={saving === 'show_in_nearby'}
          onChange={v => savePrivacy('show_in_nearby', v)}
        />
        <ToggleRow
          label="Show location on profile"
          sub="Display your neighborhood / city publicly"
          icon={<EyeOff size={14} />}
          value={privacy.show_location}
          loading={saving === 'show_location'}
          onChange={v => savePrivacy('show_location', v)}
        />
        <ToggleRow
          label="Allow direct messages"
          sub="Neighbors can message you privately"
          icon={<MessageCircle size={14} />}
          value={privacy.allow_messages}
          loading={saving === 'allow_messages'}
          onChange={v => savePrivacy('allow_messages', v)}
          last
        />
      </Section>

      {/* Notifications */}
      <Section icon={<Bell size={15} />} title="Notifications">
        <ToggleRow
          label="Likes"
          sub="When someone likes your post"
          value={notifs.likes}
          loading={saving === 'notif_likes'}
          onChange={v => saveNotif('likes', v)}
        />
        <ToggleRow
          label="Comments"
          sub="Replies on your posts"
          value={notifs.comments}
          loading={saving === 'notif_comments'}
          onChange={v => saveNotif('comments', v)}
        />
        <ToggleRow
          label="Messages"
          sub="New direct messages"
          value={notifs.messages}
          loading={saving === 'notif_messages'}
          onChange={v => saveNotif('messages', v)}
        />
        <ToggleRow
          label="Nearby events"
          sub="New events posted within 30 km"
          value={notifs.events}
          loading={saving === 'notif_events'}
          onChange={v => saveNotif('events', v)}
          last
        />
      </Section>

      {/* Account actions */}
      <Section icon={<Lock size={15} />} title="Account">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition"
          style={{ borderBottom: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Sign out</span>
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,24,128,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Trash2 size={15} style={{ color: '#f91880', flexShrink: 0 }} />
          <div>
            <div className="text-sm font-medium" style={{ color: '#f91880' }}>Delete account</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Permanently remove your account and all data
            </div>
          </div>
        </button>
      </Section>

      <p className="text-center text-xs mt-8 mb-4" style={{ color: 'var(--text-3)' }}>
        Neighbr · v1.0
      </p>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => { if (!deleting) { setShowDeleteConfirm(false); setDeleteInput('') } }}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 fade-in"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'var(--border)' }} />
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(249,24,128,0.12)' }}
            >
              <Trash2 size={20} style={{ color: '#f91880' }} />
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Delete your account?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)', lineHeight: 1.5 }}>
              This will permanently delete your profile, all posts, and messages.
              This action <strong style={{ color: 'var(--text-2)' }}>cannot be undone</strong>.
            </p>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-3)' }}>
              Type <span className="font-mono" style={{ color: 'var(--text)' }}>DELETE</span> to confirm
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full mb-4 text-sm font-mono"
              style={{
                background: 'var(--bg)',
                border: `1px solid ${deleteInput === 'DELETE' ? '#f91880' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                disabled={deleting}
                className="flex-1 rounded-full py-3 text-sm font-bold transition hover:opacity-80 disabled:opacity-40"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white disabled:opacity-30 transition"
                style={{ background: '#f91880' }}
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ icon, title, children }: {
  icon?: React.ReactNode; title: string; children: React.ReactNode
}) {
  return (
    <div className="mt-7 mx-4">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span style={{ color: '#1d9bf0' }}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
          {title}
        </span>
      </div>
      <div className="rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#10101e', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-4"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-sm font-medium" style={{ color: '#888899' }}>{label}</span>
      <span className="text-sm font-semibold truncate max-w-[60%] text-right" style={{ color: '#d0d0e8' }}>
        {value}
      </span>
    </div>
  )
}

function LinkRow({ label, sub, href, last }: { label: string; sub?: string; href: string; last?: boolean }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-4 py-4 transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div className="text-sm font-semibold" style={{ color: '#e0e0f0' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: '#666680' }}>{sub}</div>}
      </div>
      <ChevronRight size={15} style={{ color: '#444460' }} />
    </a>
  )
}

function ToggleRow({ label, sub, icon, value, loading, onChange, last }: {
  label: string; sub?: string; icon?: React.ReactNode
  value: boolean; loading?: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-4 cursor-pointer select-none transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
      onClick={() => !loading && onChange(!value)}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
        {icon && (
          <span className="mt-0.5 shrink-0" style={{ color: '#666680' }}>{icon}</span>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: '#e0e0f0' }}>{label}</div>
          {sub && <div className="text-xs mt-1" style={{ color: '#666680' }}>{sub}</div>}
        </div>
      </div>
      <div className="shrink-0">
        {loading ? (
          <Loader2 size={16} className="animate-spin" style={{ color: '#666680' }} />
        ) : (
          <Toggle on={value} />
        )}
      </div>
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 46, height: 28, borderRadius: 100,
      background: on ? '#1d9bf0' : 'rgba(255,255,255,0.15)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      border: on ? 'none' : '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        position: 'absolute',
        top: on ? 3 : 4, left: on ? 22 : 4,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.18s ease',
        boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
      }} />
    </div>
  )
}
