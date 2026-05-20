import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

const BUCKETS = [
    { id: 'listings', public: true, fileSizeLimit: 10 * 1024 * 1024 },
    { id: 'seller_docs', public: true, fileSizeLimit: 5 * 1024 * 1024 },
    { id: 'listings-videos', public: true, fileSizeLimit: 50 * 1024 * 1024 },
    { id: 'avatars', public: true, fileSizeLimit: 2 * 1024 * 1024 },
];

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!adminData || !['admin', 'ceo', 'technical_admin'].includes(adminData.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
        }

        const results: Record<string, string> = {};
        const created: string[] = [];

        for (const bucket of BUCKETS) {
            // Check if bucket exists first
            const { data: existing } = await supabaseAdmin.storage.getBucket(bucket.id);
            if (existing) {
                results[bucket.id] = 'exists';
                continue;
            }

            const { error } = await supabaseAdmin.storage.createBucket(bucket.id, {
                public: bucket.public,
                fileSizeLimit: bucket.fileSizeLimit,
            });

            if (!error) {
                created.push(bucket.id);
            }
            results[bucket.id] = error ? `error: ${error.message}` : 'created';
        }

        if (created.length > 0) {
            // Audit Log
            await logAudit({
                action: 'setup_storage_buckets',
                category: 'system',
                severity: 'info',
                targetType: 'setting',
                targetId: 'storage',
                details: { bucketsCreated: created, triggeredBy: user.id }
            }, req);
        }

        return NextResponse.json({ results });
    } catch (err: any) {
        console.error('Setup Storage API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!adminData || !['admin', 'ceo', 'technical_admin'].includes(adminData.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
        }

        const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ buckets: buckets?.map(b => ({ id: b.id, public: b.public })) });
    } catch (err: any) {
        console.error('List Buckets API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
