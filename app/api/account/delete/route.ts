import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    try {
        const cookieStore = cookies();

        // 1. Create standard server client to get the authenticated user
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignore in Server Component context
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'You must be logged in to delete your account.' },
                { status: 401 }
            );
        }

        // 2. Prevent CEO / admin accounts from self-deleting via this route
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'ceo') {
            return NextResponse.json(
                { error: 'CEO accounts cannot be deleted through this interface.' },
                { status: 403 }
            );
        }

        // 3. Clean up user data from the public.users table
        //    (RLS allows users to delete their own row)
        await supabase.from('users').delete().eq('id', user.id);

        // 4. Delete the auth user using the service-role key (admin privilege)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Failed to delete auth user:', deleteError.message);
            return NextResponse.json(
                { error: 'Account deletion partially failed. Please contact support.' },
                { status: 500 }
            );
        }

        // 5. Sign out the user's current session
        await supabase.auth.signOut();

        return NextResponse.json({ success: true, message: 'Your account has been permanently deleted.' });
    } catch (err: any) {
        console.error('Account deletion error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
