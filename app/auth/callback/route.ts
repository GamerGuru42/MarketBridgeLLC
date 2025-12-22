import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);

    // URL will have the access_token as a hash fragment
    // The client-side Supabase will handle it automatically
    // Just redirect to home page
    return NextResponse.redirect(new URL('/', requestUrl.origin));
}
