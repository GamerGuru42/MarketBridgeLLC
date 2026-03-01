import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { getSellerApplicationTemplate } from '@/lib/email-templates';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const isAllowed = await rateLimit(`seller_${ip}`, 5, 60);

        if (!isAllowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const body = await req.json();
        const {
            userId,
            fullName,
            phoneNumber,
            university,
            campusArea,
            studentEmail,
            sellCategories,
            idCardUrl,
            bio
        } = body;

        if (!userId || !fullName || !phoneNumber || !university || !campusArea || !studentEmail || !sellCategories) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('seller_applications')
            .upsert({
                user_id: userId,
                full_name: fullName,
                phone_number: phoneNumber,
                university: university,
                campus_area: campusArea,
                student_email: studentEmail.toLowerCase(),
                sell_categories: sellCategories,
                id_card_url: idCardUrl || null,
                bio: bio || null,
                status: 'pending'
            }, { onConflict: 'user_id' }); // Assuming we can upsert by user_id or email

        if (error) {
            console.error('Application insert error:', error);
            // If the column `user_id` doesn't exist yet, we might need a fallback or migration.
            // Using a simple insert if upsert fails.
            const { error: insertErr } = await supabaseAdmin
                .from('seller_applications')
                .insert({
                    full_name: fullName,
                    phone_number: phoneNumber,
                    university: university,
                    campus_area: campusArea,
                    student_email: studentEmail.toLowerCase(),
                    sell_categories: sellCategories,
                    id_card_url: idCardUrl || null,
                    bio: bio || null,
                    status: 'pending'
                });
            if (insertErr) {
                console.error('Secondary insert error:', insertErr);
                return NextResponse.json({ error: insertErr.message }, { status: 500 });
            }
        }

        // Send Welcome/Received Email to the Applicant
        await sendEmail(
            studentEmail,
            'Application Received 📝',
            getSellerApplicationTemplate(fullName)
        );

        await sendEmail(
            'ops-support@marketbridge.com.ng',
            `New Seller Application: ${fullName}`,
            `<p>New application received from ${fullName} (${university} - ${campusArea}). Log in to the operations dashboard to review.</p>`
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Seller application api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
