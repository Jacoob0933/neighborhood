import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarNav } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { RightPanel } from '@/components/layout/RightPanel'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  return (
    <div className="flex w-full" style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* SIDEBAR */}
      <div className="hidden md:block shrink-0">
        <SidebarNav />
      </div>

      {/* MAIN CONTENT */}
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

      {/* RIGHT PANEL */}
      <div className="hidden xl:block shrink-0 px-5 py-5" style={{ width: '348px' }}>
        <RightPanel />
      </div>

      <BottomNav />
    </div>
  )
}
