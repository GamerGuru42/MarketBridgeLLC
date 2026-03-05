import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const BUCKETS = [
    { id: 'listings', public: true, fileSizeLimit: 10 * 1024 * 1024 },
    { id: 'seller_docs', public: true, fileSizeLimit: 5 * 1024 * 1024 },
    { id: 'listings-videos', public: true, fileSizeLimit: 50 * 1024 * 1024 },
    { id: 'avatars', public: true, fileSizeLimit: 2 * 1024 * 1024 },
];

export async function POST() {
    const results: Record<string, string> = {};

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

        results[bucket.id] = error ? `error: ${error.message}` : 'created';
    }

    return NextResponse.json({ results });
}

export async function GET() {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ buckets: buckets?.map(b => ({ id: b.id, public: b.public })) });
}
