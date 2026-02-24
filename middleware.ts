import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Middleware is currently unused as all routes are campus-focused and explicit
    return NextResponse.next();
}

export const config = {
    matcher: [], // No routes matched
};
