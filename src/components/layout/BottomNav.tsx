'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, ShoppingBag, MessageCircle, User } from 'lucide-react'

const links = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/events', icon: CalendarDays, label: 'Events' },
  { href: '/posts/new', icon: null, label: 'Post' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile/me', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom md:hidden">
      <div className="flex items-center h-16">
        {links.map((link, i) => {
          if (!link.icon) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex-1 flex items-center justify-center"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white text-2xl font-light leading-none -mt-4 shadow-lg shadow-green-200">
                  +
                </span>
              </Link>
            )
          }
          const Icon = link.icon
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
                active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
