import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the user making the request is an admin/ceo
        const { data: adminData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!adminData || !['admin', 'ceo', 'technical_admin'].includes(adminData.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { days = 30 } = body;

        const { error } = await supabaseAdmin
            .from('system_settings')
            .upsert({
                id: 'global',
                is_demo_mode: true,
                demo_start_date: new Date().toISOString()
            });

        if (error) throw error;

        // Audit Log
        await logAudit({
            action: 'reset_demo_mode',
            category: 'system',
            severity: 'critical',
            targetType: 'setting',
            targetId: 'global',
            details: { days, resetBy: user.id },
            newValue: { is_demo_mode: true, demo_start_date: new Date().toISOString() }
        }, req);

        return NextResponse.json({ status: 'success', message: `Demo mode reset to today (${days} days remaining)` });

    } catch (err: any) {
        console.error('Reset Demo API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
