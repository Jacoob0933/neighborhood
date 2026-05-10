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

    // For OAuth users (Google, Apple) — make sure profile exists
    if (data?.user) {
      const user = data.user
      const meta = user.user_metadata ?? {}

      // Build a safe username from email prefix
      const emailPrefix = (user.email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
      const fallbackUsername = emailPrefix || `user${user.id.slice(0, 6)}`

      // Only upsert if profile doesn't already have required fields
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (!existing?.username) {
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
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
