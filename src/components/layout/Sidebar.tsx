'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, CalendarDays, MessageCircle, User, LogOut, PenLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NeighbrLogo } from '@/components/ui/NeighbrLogo'

const links = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/events', icon: CalendarDays, label: 'Events' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile/me', icon: User, label: 'Profile' },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 h-screen flex flex-col py-4 px-2 lg:px-4 overflow-hidden w-[72px] lg:w-[248px]">
      {/* Logo */}
      <Link
        href="/feed"
        className="flex items-center justify-center lg:justify-start gap-3 w-11 lg:w-auto h-11 rounded-2xl mb-4 hover:opacity-80 transition shrink-0"
      >
        <div className="shrink-0"><NeighbrLogo size={34} /></div>
        <span className="hidden lg:block text-xl font-black whitespace-nowrap" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
          Neighborhood
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex-1 flex flex-col gap-0.5">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === '/feed' && (pathname === '/feed' || pathname.startsWith('/feed?') || pathname.startsWith('/posts/')))
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex items-center justify-center lg:justify-start gap-3.5 w-11 h-11 lg:w-auto lg:h-auto lg:px-3 lg:py-2.5 rounded-xl transition group"
              style={{
                background: active ? 'var(--bg-3)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-2)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <div className="relative shrink-0">
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full hidden lg:block"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </div>
              <span className={`hidden lg:block text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
      </div>

      {/* New Post button */}
      <Link
        href="/posts/new"
        title="New post"
        className="flex items-center justify-center lg:justify-start gap-2.5 w-11 h-11 lg:w-full lg:h-auto lg:px-4 lg:py-3 rounded-xl mb-3 font-bold text-white text-sm transition hover:opacity-90 shrink-0"
        style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
      >
        <PenLine size={18} strokeWidth={2} className="shrink-0" />
        <span className="hidden lg:block">New Post</span>
      </Link>

      {/* Sign out */}
      <button
        onClick={signOut}
        title="Sign out"
        className="flex items-center justify-center lg:justify-start gap-3.5 w-11 h-11 lg:w-auto lg:h-auto lg:px-3 lg:py-2.5 rounded-xl transition shrink-0"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; (e.currentTarget.style.color = 'var(--text-2)') }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget.style.color = 'var(--text-3)') }}
      >
        <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
        <span className="hidden lg:block text-sm font-medium">Sign out</span>
      </button>
    </nav>
  )
}
