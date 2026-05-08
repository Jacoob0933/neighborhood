'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, CalendarDays, MessageCircle, User, PlusCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/events', icon: CalendarDays, label: 'Events' },
  { href: '/posts/new', icon: PlusCircle, label: 'New Post' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile/me', icon: User, label: 'Profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-full border-r border-gray-100 bg-white px-4 py-6">
      <Link href="/feed" className="flex items-center gap-2 px-2 mb-8">
        <span className="text-2xl">🏘️</span>
        <span className="text-lg font-bold text-gray-900">Neighborhood</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={signOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <LogOut size={20} strokeWidth={1.8} />
        Sign out
      </button>
    </aside>
  )
}
