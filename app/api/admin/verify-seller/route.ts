import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

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
                is_verified: true,
                is_temporary_seller: false,
                temporary_seller_expires_at: null
            })
            .eq('id', sellerId);

        if (!error) {
            await supabaseAdmin
                .from('users')
                .update({
                    role: 'student_seller'
                })
                .eq('id', sellerId);
        }

        if (error) {
            console.error('Manual verification DB error:', error);
            return NextResponse.json({ error: 'System error during verification.' }, { status: 500 });
        }

        // Audit Log
        await logAudit({
            action: 'verify_seller',
            category: 'admin',
            severity: 'info',
            targetType: 'user',
            targetId: sellerId,
            details: { verifiedBy: user.id },
            newValue: { email_verified: true, is_verified: true }
        }, req);

        return NextResponse.json({ success: true, message: 'Seller manually verified successfully.' });
    } catch (err: any) {
        console.error('Admin API error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
