import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // 1. Refresh session
    const response = await updateSession(request)

    // 2. Get user with role (Server-side check)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    let role = user?.user_metadata?.role

    // CRITICAL FIX: Database Fallback
    // If session metadata is stale/missing (causing redirect loops), 
    // we fetch the authoritative role directly from the DB.
    if (user && (!role || role === 'customer')) {
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role) {
                role = profile.role
            }
        } catch (e) {
            // Fail silently to default 'customer'
        }
    }

    // VIP OVERRIDE: Hardcode CEO Access for verified executive email
    // This bypasses any lingering metadata sync/RLS latency issues.
    if (user && user.email === 'ceo@marketbridge.io') {
        role = 'ceo'
    }

    role = role || 'customer'
    const pathname = request.nextUrl.pathname

    // 3. Define Protection Logic

    // CEO PROTECTION
    if (pathname.startsWith('/ceo')) {
        // Exempt login/signup
        if (pathname === '/ceo/login' || pathname === '/ceo/signup') {
            if (user && (role === 'ceo' || role === 'cofounder')) {
                return NextResponse.redirect(new URL('/ceo', request.url))
            }
            return response
        }

        if (!user || !['ceo', 'cofounder'].includes(role)) {
            return NextResponse.redirect(new URL('/ceo/login', request.url))
        }
    }

    // ADMIN PROTECTION
    if (pathname.startsWith('/admin')) {
        // Exempt login/signup
        if (pathname === '/admin/login' || pathname === '/admin/signup') {
            if (user && ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'].includes(role)) {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return response
        }

        if (!user || !['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'].includes(role)) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // DEALER PROTECTION
    if (pathname.startsWith('/dealer')) {
        if (!user || role !== 'dealer') {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
