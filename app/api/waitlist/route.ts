import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { getWaitlistWelcomeTemplate } from '@/lib/email-templates';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const isAllowed = await rateLimit(`waitlist_${ip}`, 5, 60); // 5 per minute

        if (!isAllowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

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

        // Get queue position
        const { count } = await supabaseAdmin
            .from('waitlist')
            .select('*', { count: 'exact', head: true });

        const queuePosition = count || 1;

        // Send Welcome Email
        await sendEmail(
            email,
            'Welcome to the MarketBridge Family! 🚀',
            getWaitlistWelcomeTemplate(email, queuePosition)
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Waitlist api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
