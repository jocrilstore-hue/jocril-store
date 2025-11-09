import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { userHasAdminAccess, userHasAdminAccessDB } from "@/lib/auth/permissions"

// Cache for reducing database calls (in-memory, resets on server restart)
const AUTH_CACHE_DURATION = 5000 // 5 seconds
const authCache = new Map<string, { user: any; timestamp: number; isAdmin: boolean }>()

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip middleware for static assets and API routes (early return for performance)
  const pathname = request.nextUrl.pathname
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)
  ) {
    return supabaseResponse
  }

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
    },
  )

  // Only check auth for protected routes
  const requiresAuth = pathname.startsWith("/conta") ||
                       pathname.startsWith("/encomendas") ||
                       pathname.startsWith("/admin")

  if (!requiresAuth) {
    // For public routes, just update session cookies without auth check
    // This saves the expensive getUser() call
    await supabase.auth.getSession() // Only get session to refresh cookies if needed
    return supabaseResponse
  }

  // Check cache first to avoid redundant auth checks
  const sessionToken = request.cookies.get('sb-access-token')?.value ||
                      request.cookies.get('sb-localhost-auth-token')?.value

  if (sessionToken) {
    const cached = authCache.get(sessionToken)
    if (cached && Date.now() - cached.timestamp < AUTH_CACHE_DURATION) {
      if (!cached.user) {
        return redirectToLogin(request)
      }
      if (pathname.startsWith("/admin") && !cached.isAdmin) {
        return redirectToHome(request)
      }
      return supabaseResponse
    }
  }

  // Perform auth check only for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && requiresAuth) {
    return redirectToLogin(request)
  }

  // Check admin only for /admin routes
  if (pathname.startsWith("/admin") && user) {
    // Fast check: metadata/env first (no DB)
    let isAdmin = userHasAdminAccess(user)

    if (!isAdmin) {
      // Only query DB if metadata check fails
      isAdmin = await userHasAdminAccessDB(supabase, user.id)
      if (!isAdmin) {
        return redirectToHome(request)
      }
    }

    // Cache the result
    if (sessionToken) {
      authCache.set(sessionToken, { user, timestamp: Date.now(), isAdmin: true })
    }
  } else if (user && sessionToken) {
    // Cache non-admin user
    authCache.set(sessionToken, { user, timestamp: Date.now(), isAdmin: false })
  }

  return supabaseResponse
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/auth/login"
  url.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

function redirectToHome(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/"
  url.searchParams.set("erro", "sem-acesso")
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
