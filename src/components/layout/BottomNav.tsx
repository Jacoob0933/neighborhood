'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, MessageCircle, User, PenLine } from 'lucide-react'

const links = [
  { href: '/feed', icon: Home },
  { href: '/events', icon: CalendarDays },
  { href: '/posts/new', icon: PenLine, isPost: true },
  { href: '/messages', icon: MessageCircle },
  { href: '/profile/me', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom md:hidden backdrop-blur-md"
      style={{
        background: 'rgba(6,6,10,0.92)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center h-14 max-w-lg mx-auto px-2">
        {links.map(({ href, icon: Icon, isPost }) => {
          const active = pathname === href
          if (isPost) {
            return (
              <Link key={href} href={href} className="flex-1 flex items-center justify-center">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #1d9bf0, #0d6efd)' }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
              </Link>
            )
          }
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex items-center justify-center h-full"
              style={{ color: active ? 'var(--text)' : 'var(--text-3)' }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
