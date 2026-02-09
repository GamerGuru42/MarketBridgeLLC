import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // Standard Supabase Next.js Middleware pattern
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fallback if environment variables are missing to prevent middleware crash
    if (!supabaseUrl || !supabaseAnonKey) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('CRITICAL: Supabase environment variables missing in middleware.')
        }
        return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({
                    request,
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    // refreshing the auth token (authoritative check)
    const { data: { user } } = await supabase.auth.getUser()

    let role = user?.user_metadata?.role
    const pathname = request.nextUrl.pathname

    // CRITICAL FIX: Database Fallback for stale metadata
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
            // Silence DB errors to maintain performance
        }
    }

    role = role || 'customer'

    // PROTECTION LOGIC

    // CEO PROTECTION
    if (pathname.startsWith('/ceo')) {
        // Allow public access to CEO auth pages
        if (pathname.includes('/login') || pathname.includes('/signup')) {
            if (user && role === 'ceo') {
                return NextResponse.redirect(new URL('/ceo', request.url))
            }
            return supabaseResponse
        }

        // Protect CEO Dashboard
        if (!user || role !== 'ceo') {
            return NextResponse.redirect(new URL('/ceo/login', request.url))
        }
    }

    // AUTH ENTROPY PREVENTION: Redirect logged-in users away from auth pages
    if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
        if (['dealer', 'student_seller'].includes(role)) {
            return NextResponse.redirect(new URL('/dealer/dashboard', request.url))
        } else if (['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cto', 'coo', 'cofounder'].includes(role)) {
            return NextResponse.redirect(new URL('/admin', request.url))
        } else {
            return NextResponse.redirect(new URL('/listings', request.url))
        }
    }

    const isAdmin = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'].includes(role)

    // ADMIN PROTECTION
    if (pathname.startsWith('/admin')) {
        if (pathname === '/admin/login' || pathname === '/admin/signup') {
            if (user && isAdmin) {
                // Redirect to specific dashboard based on role to avoid confusion
                if (role === 'marketing_admin') return NextResponse.redirect(new URL('/admin/marketing', request.url))
                if (role === 'operations_admin') return NextResponse.redirect(new URL('/admin/operations', request.url))
                if (role === 'technical_admin') return NextResponse.redirect(new URL('/admin/technical', request.url))
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return supabaseResponse
        }

        if (!user || !isAdmin) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // Granular Access Control
        const superAdmins = ['admin', 'ceo', 'cofounder', 'cto', 'coo'];
        const isSuperAdmin = superAdmins.includes(role);

        if (!isSuperAdmin) {
            if (pathname.startsWith('/admin/marketing') && role !== 'marketing_admin') {
                return NextResponse.redirect(new URL('/admin', request.url)) // Or their own dashboard
            }
            if (pathname.startsWith('/admin/operations') && role !== 'operations_admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            if (pathname.startsWith('/admin/technical') && role !== 'technical_admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
        }
    }

    // DEALER PROTECTION
    if (pathname.startsWith('/dealer')) {
        if (!user || !['dealer', 'student_seller'].includes(role)) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return supabaseResponse
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
