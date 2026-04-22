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

// ─── Role Mapping ────────────────────────────────────────────────────────────
const ROLE_MAP: Record<string, string> = {
    'student_buyer': 'buyer',
    'student_seller': 'seller',
    'operations_admin': 'admin',
    'ceo': 'ceo',
    'systems_admin': 'admin',
    'technical_admin': 'admin',
    'marketing_admin': 'admin',
    'it_support': 'admin',
    'admin': 'admin',
    'buyer': 'buyer',
    'seller': 'seller',
};

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
        const rawRole = payload.user_metadata?.role 
            || payload.app_metadata?.role 
            || payload.role 
            || null;
            
        if (!rawRole) return null;
        return ROLE_MAP[rawRole] || 'buyer';
    } catch {
        return null;
    }
}

const ADMIN_ROLES = ['admin', 'ceo'];

const ROLE_PATH_ACCESS: Record<string, string[]> = {
    '/admin/ceo': ['ceo'],
    '/admin/technical': ['ceo', 'admin'],
    '/admin/operations': ['ceo', 'admin'],
    '/admin/marketing': ['ceo', 'admin'],
    '/admin/users': ['ceo', 'admin'],
    '/admin/listings': ['ceo', 'admin'],
    '/admin/orders': ['ceo', 'admin'],
    '/admin/payouts': ['ceo', 'admin'],
    '/admin/revenue': ['ceo', 'admin'],
    '/admin/disputes': ['ceo', 'admin'],
};

// ─── Middleware ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown-ip';

    const host = request.headers.get('host') || '';
    const isProduction = host.endsWith('marketbridge.com.ng');
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isHQ = host.startsWith('hq.');
    const isWWW = host === 'marketbridge.com.ng' || host.startsWith('www.') || (isLocalhost && !isHQ);

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
    if (isHQ && (pathname === '/' || pathname === '/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/portal/login';
        return NextResponse.rewrite(url);
    }

    // On www: block admin routes
    if (isWWW && (pathname.startsWith('/admin') || pathname === '/ceo' || pathname.startsWith('/portal'))) {
        return new NextResponse('Not Found', { status: 404 });
    }

    // Check Authentication state
    const IS_LOGGED_IN = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    const mappedRole = extractRoleFromCookies(request);

    // On hq: require admin role
    if (isHQ && pathname !== '/portal/login' && !pathname.startsWith('/auth')) {
        if (!IS_LOGGED_IN) {
            const url = request.nextUrl.clone();
            url.pathname = '/portal/login';
            return NextResponse.redirect(url);
        }
        if (!mappedRole || !['admin', 'ceo'].includes(mappedRole)) {
            return new NextResponse('Forbidden', { status: 403 });
        }
        
        // ── ROLE-BASED PATH FILTERING ────────────────────────────────────────
        for (const [path, allowedRoles] of Object.entries(ROLE_PATH_ACCESS)) {
            if (pathname.startsWith(path) && !allowedRoles.includes(mappedRole)) {
                return new NextResponse(
                    JSON.stringify({ error: 'Security Alert: Access to this department is restricted for your role.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
    }

    // On www: redirect admin users to hq
    if (isWWW && mappedRole && ['admin', 'ceo'].includes(mappedRole) && !pathname.startsWith('/login') && !pathname.startsWith('/logout') && !pathname.startsWith('/auth')) {
        const hqUrl = new URL(request.url);
        if (isProduction) hqUrl.hostname = 'hq.marketbridge.com.ng';
        hqUrl.pathname = '/admin/dashboard';
        return NextResponse.redirect(hqUrl);
    }

    // ── 5. Public Marketplace Isolation ──
    const PUBLIC_ACCESSIBLE_ROUTES = ['/', '/login', '/signup', '/auth', '/seller-qr', '/verify-email', '/reset-password', '/api', '/listings', '/about', '/terms', '/privacy', '/categories', '/search', '/logout'];

    const isPublicAccessible = PUBLIC_ACCESSIBLE_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    );

    if (!IS_LOGGED_IN && !isPublicAccessible && isWWW) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
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
