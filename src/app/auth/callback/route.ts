import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/feed'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data?.user) {
      const user = data.user
      const meta = user.user_metadata ?? {}
      const provider = user.app_metadata?.provider

      // Check if profile already exists and has a username
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (!existing?.username) {
        // New user — create basic profile from OAuth data
        const emailPrefix = (user.email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
        const fallbackUsername = emailPrefix || `user${user.id.slice(0, 6)}`

        await supabase.from('profiles').upsert({
          id: user.id,
          username: meta.username ?? fallbackUsername,
          full_name: meta.full_name ?? meta.name ?? '',
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
          city: meta.city ?? null,
          neighborhood: meta.neighborhood ?? null,
          lat: meta.lat ?? null,
          lng: meta.lng ?? null,
        }, { onConflict: 'id' })

        // OAuth new user → send to setup page for GPS
        if (provider === 'google' || provider === 'apple') {
          return NextResponse.redirect(new URL('/setup', request.url))
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
