import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { days = 30 } = await req.json();

        const { error } = await supabaseAdmin
            .from('system_settings')
            .upsert({
                id: 'global',
                is_demo_mode: true,
                demo_start_date: new Date().toISOString()
            });

        if (error) throw error;

        return NextResponse.json({ status: 'success', message: `Demo mode reset to today (${days} days remaining)` });

    } catch (err: any) {
        console.error('Reset Demo API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
