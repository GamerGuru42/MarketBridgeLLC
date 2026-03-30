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

        // Verify the user making the request is an admin
        const { data: adminData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!adminData || !['admin', 'ceo', 'operations_admin', 'technical_admin'].includes(adminData.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
        }

        const body = await req.json();
        const { sellerId } = body;

        if (!sellerId) {
            return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });
        }

        // Perform the verification.
        const { error } = await supabaseAdmin
            .from('users')
            .update({
                email_verified: true,
                is_temporary_seller: false,
                temporary_seller_expires_at: null
            })
            .eq('id', sellerId);

        if (error) {
            console.error('Manual verification DB error:', error);
            return NextResponse.json({ error: 'System error during verification.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Seller manually verified successfully.' });
    } catch (err: any) {
        console.error('Admin API error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
