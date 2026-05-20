import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setSetting } from '@/lib/settings';
import { logAudit } from '@/lib/audit';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'ceo', 'technical_admin'].includes(profile?.role || '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'ceo', 'technical_admin'].includes(profile?.role || '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { key, value } = await req.json();
        
        // Fetch old setting value if possible
        const { data: oldSetting } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .single();

        await setSetting(key, value);

        // Audit Log
        await logAudit({
            action: 'update_setting',
            category: 'system',
            severity: 'critical',
            targetType: 'setting',
            targetId: key,
            targetLabel: key,
            details: { updatedBy: user.id },
            oldValue: oldSetting ? { value: oldSetting.value } : null,
            newValue: { value }
        }, req);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
