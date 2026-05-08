import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarNav } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  return (
    <div className="flex w-full" style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* SIDEBAR — sticky, fixed width, never shrinks */}
      <div className="hidden md:block shrink-0">
        <SidebarNav />
      </div>

      {/* FEED — fills ALL remaining space between sidebar and right panel */}
      <main
        className="flex-1 min-w-0 pb-16 md:pb-0"
        style={{
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          minHeight: '100%',
        }}
      >
        {children}
      </main>

      {/* RIGHT PANEL — fixed width, only on xl */}
      <div className="hidden xl:block shrink-0 px-4 py-4" style={{ width: '340px' }}>
        <div className="sticky top-4 space-y-3">
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-2)' }}>
            <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>Nearby highlights</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Your local posts and events will appear here once you set your location.
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-2)' }}>
            <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>Trending near you</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Post something to start the conversation in your area.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
