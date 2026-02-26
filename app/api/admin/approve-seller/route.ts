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

        // Generate Invite Token (using UUID for simplicity, could be JWT)
        const inviteToken = crypto.randomUUID();

        // In a real scenario, you might store this token in a `seller_invites` table.
        // For now, we'll embed the applicationId and email in the URL as a proof-of-concept,
        // or just direct them to SIGNUP with a special flag.

        // Ensure they go to a controlled signup page:
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marketbridge.com.ng'}/admin/signup?intent=sell&email=${encodeURIComponent(application.student_email)}&token=${inviteToken}`;

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
