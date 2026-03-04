import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { getSellerApprovedTemplate } from '@/lib/email-templates';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { applicationId, approverId } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Missing logic' }, { status: 400 });
        }

        // Verify approver's role
        const { data: approverData } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', approverId)
            .single();

        if (!approverData || !['admin', 'ceo', 'operations_admin', 'technical_admin'].includes(approverData.role)) {
            return NextResponse.json({ error: 'Unauthorized to approve sellers' }, { status: 403 });
        }

        // Fetch application
        const { data: application, error: fetchError } = await supabaseAdmin
            .from('seller_applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (fetchError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (application.status === 'approved') {
            return NextResponse.json({ error: 'Application already approved' }, { status: 400 });
        }

        // Update application status
        const { error: updateError } = await supabaseAdmin
            .from('seller_applications')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', applicationId);

        if (updateError) {
            throw updateError;
        }

        // Grant the user seller access immediately
        if (application.user_id) {
            await supabaseAdmin
                .from('users')
                .update({
                    role: 'student_seller',
                    is_verified: true,
                    is_verified_seller: true,
                    isVerified: true,
                })
                .eq('id', application.user_id);
        }

        // Generate Invite Link (invite token for audit trail)
        const inviteToken = crypto.randomUUID();
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marketbridge.com.ng'}/seller/dashboard`;

        // Send Approval Email
        await sendEmail(
            application.student_email,
            'Application Approved! 🎉',
            getSellerApprovedTemplate(application.full_name, inviteLink)
        );

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('Approve seller api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
