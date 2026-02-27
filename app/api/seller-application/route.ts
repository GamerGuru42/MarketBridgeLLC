import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { getSellerApplicationTemplate } from '@/lib/email-templates';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const isAllowed = await rateLimit(`seller_${ip}`, 5, 60); // 5 per minute

        if (!isAllowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const body = await req.json();
        const {
            fullName,
            phoneNumber,
            university,
            studentEmail,
            sellCategories,
            itemsReady,
            idCardUrl
        } = body;

        // Basic validation
        if (!fullName || !phoneNumber || !university || !studentEmail || !sellCategories || !itemsReady) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify 40-seller cap for Phase 1
        const { count: currentSellers, error: countError } = await supabaseAdmin
            .from('seller_applications')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error checking seller count:', countError);
            return NextResponse.json({ error: 'System error' }, { status: 500 });
        }

        if (currentSellers !== null && currentSellers >= 40) {
            return NextResponse.json(
                { error: 'Phase 1 seller onboarding is full. The first 40 spots have been claimed.' },
                { status: 403 }
            );
        }

        // Insert into database
        const { error } = await supabaseAdmin
            .from('seller_applications')
            .insert({
                full_name: fullName,
                phone_number: phoneNumber,
                university: university,
                student_email: studentEmail.toLowerCase(),
                sell_categories: sellCategories,
                items_ready: itemsReady,
                id_card_url: idCardUrl || null,
                status: 'pending'
            });

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'An application with this email already exists.' }, { status: 400 });
            }
            console.error('Application insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Send Welcome/Received Email to the Applicant
        await sendEmail(
            studentEmail,
            'Application Received 📝',
            getSellerApplicationTemplate(fullName)
        );

        // Optional: Send alert to Ops/CEO (can just rely on Dashboard, but an alert is nice)
        await sendEmail(
            'ops-support@marketbridge.com.ng',
            `New Seller Application: ${fullName}`,
            `<p>New application received from ${fullName} (${university}). Log in to the operations dashboard to review.</p>`
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Seller application api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
