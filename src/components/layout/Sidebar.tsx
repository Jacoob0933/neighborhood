'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, CalendarDays, MessageCircle, User, LogOut, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
    /*
     * sticky + h-screen so nav stays fixed while feed scrolls.
     * On md: 72px icon-only, right-aligned content.
     * On lg: 240px with labels.
     */
    <nav
      className="sticky top-0 h-screen flex flex-col py-3 px-1 lg:px-3 overflow-hidden w-[72px] lg:w-[240px]"
    >
      {/* Logo — icon only on md, icon+name on lg */}
      <Link
        href="/feed"
        className="flex items-center justify-center lg:justify-start gap-3 w-12 lg:w-auto h-12 rounded-full mb-2 hover:opacity-80 transition"
      >
        <span className="text-2xl shrink-0">🏘️</span>
        <span className="hidden lg:block text-base font-black whitespace-nowrap" style={{ color: 'var(--text)' }}>
          Neighborhood
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex-1 flex flex-col gap-0.5">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === '/feed' && pathname.startsWith('/feed'))
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex items-center justify-center lg:justify-start gap-4 w-12 lg:w-auto h-12 lg:h-auto lg:px-4 lg:py-3 rounded-full transition"
              style={{
                background: active ? 'var(--bg-hover)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-2)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = active ? 'var(--bg-hover)' : 'transparent')}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
              <span className="hidden lg:block text-base font-medium">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* New Post button */}
      <Link
        href="/posts/new"
        title="New post"
        className="flex items-center justify-center lg:justify-start gap-2 w-12 lg:w-full h-12 lg:h-auto lg:px-5 lg:py-3 rounded-full mb-2 font-bold text-white transition hover:opacity-90"
        style={{ background: '#1d9bf0' }}
      >
        <PlusCircle size={20} className="shrink-0" />
        <span className="hidden lg:block">New Post</span>
      </Link>

      {/* Sign out */}
      <button
        onClick={signOut}
        title="Sign out"
        className="flex items-center justify-center lg:justify-start gap-4 w-12 lg:w-auto h-12 lg:h-auto lg:px-4 lg:py-3 rounded-full transition"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <LogOut size={20} strokeWidth={1.8} className="shrink-0" />
        <span className="hidden lg:block text-sm">Sign out</span>
      </button>
    </nav>
  )
}
