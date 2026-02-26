import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('waitlist')
            .insert({ email });

        if (error) {
            if (error.code === '23505') {
                // Unique violation - already joined
                return NextResponse.json({ success: true, message: 'Already on the waitlist!' }, { status: 200 });
            }
            console.error('Waitlist insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Waitlist api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
