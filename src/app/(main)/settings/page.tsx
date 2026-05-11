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

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const [privacy, setPrivacy] = useState<Privacy>({
    profile_public: true,
    show_location: true,
    allow_messages: true,
    show_in_nearby: true,
  })

  const [notifs, setNotifs] = useState<Notifs>({
    likes: true,
    comments: true,
    messages: true,
    events: false,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, privacy_settings, notification_settings')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username ?? '')
        if (profile.privacy_settings) {
          setPrivacy(p => ({ ...p, ...(profile.privacy_settings as Partial<Privacy>) }))
        }
        if (profile.notification_settings) {
          setNotifs(n => ({ ...n, ...(profile.notification_settings as Partial<Notifs>) }))
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function savePrivacy(key: keyof Privacy, val: boolean) {
    setSaving(key)
    const next = { ...privacy, [key]: val }
    setPrivacy(next)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ privacy_settings: next }).eq('id', user.id)
    }
    setSaving(null)
  }

  async function saveNotif(key: keyof Notifs, val: boolean) {
    setSaving('notif_' + key)
    const next = { ...notifs, [key]: val }
    setNotifs(next)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ notification_settings: next }).eq('id', user.id)
    }
    setSaving(null)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
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
        <InfoRow label="Username" value={`@${username}`} />
        <InfoRow label="Email" value={email} />
        <LinkRow
          label="Edit profile"
          sub="Name, bio, avatar, city"
          href="/profile/edit"
        />
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
          sub="Your posts appear to neighbors within 30km"
          icon={<MapPin size={14} />}
          value={privacy.show_in_nearby}
          loading={saving === 'show_in_nearby'}
          onChange={v => savePrivacy('show_in_nearby', v)}
        />
        <ToggleRow
          label="Show location on profile"
          sub="Display your neighborhood / city"
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
          sub="New events posted within 30km"
          value={notifs.events}
          loading={saving === 'notif_events'}
          onChange={v => saveNotif('events', v)}
        />
      </Section>

      {/* Account actions */}
      <Section icon={<Lock size={15} />} title="Account actions">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition"
          style={{ borderBottom: '1px solid var(--border)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Sign out</span>
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,24,128,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Trash2 size={15} style={{ color: '#f91880', flexShrink: 0 }} />
          <div>
            <div className="text-sm font-medium" style={{ color: '#f91880' }}>Delete account</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Permanently remove your account and all data</div>
          </div>
        </button>
      </Section>

      <p className="text-center text-xs mt-8" style={{ color: 'var(--text-3)' }}>
        Neighbr · v1.0 · <a href="/privacy" className="underline" style={{ color: 'var(--text-3)' }}>Privacy Policy</a>
      </p>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'var(--border)' }} />
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(249,24,128,0.1)' }}>
              <Trash2 size={18} style={{ color: '#f91880' }} />
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Delete your account?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              This will permanently delete your profile, posts, and messages. This cannot be undone.
            </p>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-3)' }}>
              Type <span style={{ color: 'var(--text)' }}>DELETE</span> to confirm
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full mb-4 text-sm"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="flex-1 rounded-full py-3 text-sm font-bold transition hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                disabled={deleteInput !== 'DELETE'}
                className="flex-1 rounded-full py-3 text-sm font-bold text-white disabled:opacity-30"
                style={{ background: '#f91880' }}
              >
                Delete account
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
    <div className="mt-6 mx-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span style={{ color: 'var(--text-3)' }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {title}
        </span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{value}</span>
    </div>
  )
}

function LinkRow({ label, sub, href }: { label: string; sub?: string; href: string }) {
  return (
    <a href={href} className="flex items-center justify-between px-4 py-3.5 transition"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>}
      </div>
      <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
    </a>
  )
}

function ToggleRow({ label, sub, icon, value, loading, onChange }: {
  label: string; sub?: string; icon?: React.ReactNode
  value: boolean; loading?: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5 cursor-pointer transition"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={() => !loading && onChange(!value)}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-3)' }}>{icon}</span>}
        <div className="min-w-0">
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
          {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>}
        </div>
      </div>
      <div className="shrink-0 ml-4">
        {loading ? (
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-3)' }} />
        ) : (
          <Toggle on={value} />
        )}
      </div>
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      style={{
        width: 42, height: 24, borderRadius: 100,
        background: on ? '#1d9bf0' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3, left: on ? 21 : 3,
        width: 18, height: 18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}
