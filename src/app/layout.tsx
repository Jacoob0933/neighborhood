import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Neighbr — Your Local Community',
  description: 'Neighborhood is a hyperlocal community app. Share local events, buy and sell in your area, find lost pets, and connect with the people who live around you.',
  keywords: ['neighborhood', 'community', 'local events', 'hyperlocal', 'neighbors', 'marketplace', 'lost and found'],
  authors: [{ name: 'Neighborhood' }],
  creator: 'Neighborhood',
  openGraph: {
    title: 'Neighbr — Your Local Community',
    description: 'Share local events, sell things, find lost pets, and connect with the people around you.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Neighborhood',
  },
  twitter: {
    card: 'summary',
    title: 'Neighbr — Your Local Community',
    description: 'Share local events, sell things, find lost pets, and connect with the people around you.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d9bf0',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
