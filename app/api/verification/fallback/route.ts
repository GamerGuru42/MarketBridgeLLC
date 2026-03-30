import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 48 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const { error } = await supabaseAdmin
            .from('users')
            .update({
                is_temporary_seller: true,
                temporary_seller_expires_at: expiresAt.toISOString()
            })
            .eq('id', user.id);

        if (error) {
            console.error('Database update failed:', error);
            return NextResponse.json({ error: 'System error.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, fallback_granted: true, expires_at: expiresAt.toISOString() });
    } catch (err: any) {
        console.error('Fallback error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
