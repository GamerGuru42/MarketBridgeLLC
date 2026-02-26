import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        const body = await req.json();
        const {
            university,
            role,
            rating,
            likes,
            frustrations,
            feature_requests,
            bugs,
            nps,
            contact
        } = body;

        // Optional: Only allow logged in users (as per user request: "Only show to logged-in beta users")
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error: insertError } = await supabase
            .from('beta_feedback')
            .insert({
                user_id: session.user.id,
                university,
                role,
                rating,
                likes,
                frustrations,
                feature_requests,
                bugs,
                nps,
                contact
            });

        if (insertError) {
            console.error('Feedback insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Feedback api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
