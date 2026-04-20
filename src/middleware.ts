import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/database'

const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/recipient': ['recipient'],
  '/donor': ['donor'],
  '/admin': ['admin', 'super_admin'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users trying to access protected routes
  const protectedPrefix = Object.keys(ROLE_ROUTES).find(p => pathname.startsWith(p))
  if (protectedPrefix && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Check role-based access
  if (protectedPrefix && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Banned/suspended users get signed out
    if (userData.status === 'banned' || userData.status === 'suspended') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login?error=account_suspended', request.url))
    }

    const allowedRoles = ROLE_ROUTES[protectedPrefix]
    if (!allowedRoles.includes(userData.role as UserRole)) {
      // Redirect to their correct portal
      const roleRedirects: Record<string, string> = {
        recipient: '/recipient/dashboard',
        donor: '/donor/feed',
        admin: '/admin/dashboard',
        super_admin: '/admin/dashboard',
      }
      return NextResponse.redirect(
        new URL(roleRedirects[userData.role] ?? '/', request.url)
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/recipient/:path*',
    '/donor/:path*',
    '/admin/:path*',
  ],
}
