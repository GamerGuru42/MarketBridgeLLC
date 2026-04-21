import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
}

const PUBLIC_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
};

const ADMIN_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
};

function checkRateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const tracker = rateLimitMap.get(key);

    if (!tracker) {
        rateLimitMap.set(key, { count: 1, firstAttempt: now });
        return true;
    }

    if (tracker.count >= config.maxAttempts) {
        if (now - tracker.firstAttempt < config.blockDurationMs) {
            return false;
        } else {
            rateLimitMap.set(key, { count: 1, firstAttempt: now });
            return true;
        }
    }

    if (now - tracker.firstAttempt < config.windowMs) {
        tracker.count += 1;
        rateLimitMap.set(key, tracker);
        if (tracker.count >= config.maxAttempts) {
            tracker.firstAttempt = now;
            return false;
        }
        return true;
    } else {
        rateLimitMap.set(key, { count: 1, firstAttempt: now });
        return true;
    }
}

// ─── JWT Helpers ─────────────────────────────────────────────────────────────
function decodeJwtPayload(token: string): Record<string, any> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function extractRoleFromCookies(request: NextRequest): string | null {
    const cookies = request.cookies.getAll();

    // Find the Supabase auth token cookie (could be chunked or single)
    // @supabase/ssr can split large cookies into chunks: sb-<ref>-auth-token.0, .1, etc.
    const authCookieName = cookies.find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))?.name;
    if (!authCookieName) return null;

    // Reconstruct the full cookie value from potential chunks
    const baseName = authCookieName.replace(/\.\d+$/, ''); // strip chunk suffix like .0
    const chunks: string[] = [];
    
    // Check for chunked cookies first
    for (let i = 0; i < 10; i++) {
        const chunk = request.cookies.get(`${baseName}.${i}`);
        if (chunk) {
            chunks.push(chunk.value);
        } else {
            break;
        }
    }

    // If no chunks found, try the base cookie directly
    let rawValue: string;
    if (chunks.length > 0) {
        rawValue = chunks.join('');
    } else {
        const singleCookie = request.cookies.get(baseName);
        if (!singleCookie) return null;
        rawValue = singleCookie.value;
    }

    try {
        let accessToken: string | null = null;

        // Try parsing as JSON first (newer SSR format: base64 encoded JSON)
        try {
            const decoded = decodeURIComponent(rawValue);
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed) && parsed.length > 0) {
                accessToken = parsed[0];
            } else if (typeof parsed === 'object' && parsed?.access_token) {
                accessToken = parsed.access_token;
            }
        } catch {
            // Try as base64-encoded value
            try {
                const decoded = atob(rawValue);
                const parsed = JSON.parse(decoded);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    accessToken = parsed[0];
                } else if (parsed?.access_token) {
                    accessToken = parsed.access_token;
                }
            } catch {
                // Maybe it's a raw JWT
                if (rawValue.includes('.') && rawValue.split('.').length === 3) {
                    accessToken = rawValue;
                }
            }
        }

        if (!accessToken) return null;

        const payload = decodeJwtPayload(accessToken);
        if (!payload) return null;

        // Check expiry
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;

        // Role can be in multiple places depending on how it was set:
        // 1. user_metadata.role (set via updateUser)
        // 2. app_metadata.role (set via admin API) 
        // 3. payload.role (custom claim)
        return payload.user_metadata?.role 
            || payload.app_metadata?.role 
            || payload.role 
            || null;
    } catch {
        return null;
    }
}

const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];

const ROLE_PATH_ACCESS: Record<string, string[]> = {
    '/admin/ceo': ['ceo', 'cofounder'],
    '/admin/technical': ['technical_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/operations': ['operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/marketing': ['marketing_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/users': ['operations_admin', 'technical_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/listings': ['marketing_admin', 'operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/orders': ['operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/payouts': ['operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/revenue': ['ceo', 'cofounder', 'admin'],
    '/admin/disputes': ['operations_admin', 'ceo', 'cofounder', 'admin'],
};

// ─── Middleware ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown-ip';

    // ── 0. Subdomain & Host Detection ────────────────────────────────────────
    const host = request.headers.get('host') || '';
    const isProduction = host.endsWith('marketbridge.com.ng');
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isHQSubdomain = host.startsWith('hq.') || (isProduction && host === 'hq.marketbridge.com.ng');

    // ── 1. Rate Limiting ────────────────────────────────────────────────────
    const isPortalRoute = pathname.startsWith('/portal') || pathname.startsWith('/admin');
    const isAuthRoute = (pathname.includes('/login') || pathname.includes('/auth') || pathname.includes('/signup')) && !pathname.includes('/callback');

    if (isAuthRoute) {
        const config = isPortalRoute ? ADMIN_RATE_LIMIT : PUBLIC_RATE_LIMIT;
        const rateLimitKey = isPortalRoute ? `admin:${ip}` : `public:${ip}`;
        const isAllowed = checkRateLimit(rateLimitKey, config);

        if (!isAllowed) {
            const blockMinutes = isPortalRoute ? 60 : 30;
            return new NextResponse(
                JSON.stringify({ error: `Too many attempts. Your access is temporarily restricted for ${blockMinutes} minutes for security.` }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // ── 2. Intercept misplaced OAuth codes ───────────────────────────────────
    if (pathname === '/' && searchParams.has('code')) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/callback';
        return NextResponse.redirect(url);
    }

    // ── 3. Block /public/* when disabled ─────────────────────────────────────
    const disablePublic = process.env.NEXT_PUBLIC_DISABLE_PUBLIC_SECTION === 'true';
    if (disablePublic && pathname.startsWith('/public')) {
        return new NextResponse('Not Found', { status: 404 });
    }

    // ── 3.5. Subdomain Flow Control ──────────────────────────────────────────
    if (isHQSubdomain && (pathname === '/' || pathname === '/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/portal/login';
        return NextResponse.rewrite(url);
    }

    // ── 4. Internal System Isolation (Admin + Portal) ────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
        // ENFORCE HQ DOMAIN IN PRODUCTION
        if (isProduction && !isHQSubdomain && !isLocalhost) {
            const hqUrl = new URL(request.url);
            hqUrl.hostname = 'hq.marketbridge.com.ng';
            return NextResponse.redirect(hqUrl);
        }

        // Allow unauthenticated access ONLY to portal login
        if (pathname === '/portal/login') {
            const response = NextResponse.next();
            response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
            return response;
        }

        // Check for Supabase auth cookie
        const cookies = request.cookies.getAll();
        const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
        const hasAdminSession = request.cookies.has('mb-admin-session');

        // No auth cookie at all → redirect to portal login
        if (!hasAuthCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/portal/login';
            return NextResponse.redirect(url);
        }

        // Verify role
        const role = extractRoleFromCookies(request);

        // Standardized Admin Roles (Phase 5 will fully enforce these names)
        const activeAdminRoles = ['ceo', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support', 'technical_admin', 'admin'];

        if (!role || !activeAdminRoles.includes(role)) {
            return new NextResponse(
                JSON.stringify({ error: 'Security Violation: Access to HQ Portal requires an administrative role. Public users are strictly forbidden.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // ── ROLE-BASED PATH FILTERING ────────────────────────────────────────
        for (const [path, allowedRoles] of Object.entries(ROLE_PATH_ACCESS)) {
            if (pathname.startsWith(path) && !allowedRoles.includes(role)) {
                return new NextResponse(
                    JSON.stringify({ error: 'Security Alert: Access to this department is restricted for your role.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        const response = NextResponse.next();
        response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        // Add Security Headers
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        return response;
    }

    // ── 5. Public Marketplace Isolation ──
    const IS_LOGGED_IN = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    const PUBLIC_ACCESSIBLE_ROUTES = ['/', '/login', '/signup', '/auth', '/seller-qr', '/verify-email', '/reset-password', '/api'];

    const isPublicAccessible = PUBLIC_ACCESSIBLE_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    );

    // If on HQ subdomain but trying to access public marketplace (non-portal) routes
    if (isHQSubdomain && !isPortalRoute && !pathname.startsWith('/auth')) {
        const publicUrl = new URL(request.url);
        if (isProduction) {
            publicUrl.hostname = 'marketbridge.com.ng';
        }
        // Locally we just let it slide but usually we redirect back to root or marketplace
        return NextResponse.redirect(publicUrl);
    }

    if (!IS_LOGGED_IN && !isPublicAccessible) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // ── 6. Role-Based Redirection (Prevention of Admin bleed into Marketplace) ──
    const currentRole = extractRoleFromCookies(request);
    const ADMIN_ROLES_LIST = ['ceo', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support', 'technical_admin', 'admin'];

    if (currentRole && ADMIN_ROLES_LIST.includes(currentRole)) {
        // Admins should not be browsing /marketplace or /buyer paths normally
        if (pathname.startsWith('/buyer') || (pathname.startsWith('/marketplace') && !isLocalhost)) {
            const hqUrl = request.nextUrl.clone();
            hqUrl.pathname = currentRole === 'ceo' ? '/admin/ceo' : '/admin';
            if (isProduction) hqUrl.hostname = 'hq.marketbridge.com.ng';
            return NextResponse.redirect(hqUrl);
        }
    }

    // ── 7. Universal Security Headers (Public Routes) ──
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
