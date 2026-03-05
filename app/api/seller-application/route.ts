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

        // userId is REQUIRED — the dashboard trial lookup depends on it
        if (!userId || !fullName || !phoneNumber || !university || !campusArea || !studentEmail || !sellCategories) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert by user_id — prevents duplicate applications from same user
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
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Application upsert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Create a 14-day trial subscription for this seller if one doesn't exist yet
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);

        // Check if they already have an active subscription/trial
        const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .limit(1)
            .maybeSingle();

        if (!existingSub) {
            // Get the free/starter plan id
            const { data: freePlan } = await supabaseAdmin
                .from('subscription_plans')
                .select('id')
                .or('name.ilike.%starter%,name.ilike.%free%')
                .limit(1)
                .maybeSingle();

            if (freePlan) {
                await supabaseAdmin.from('subscriptions').insert({
                    user_id: userId,
                    plan_id: freePlan.id,
                    status: 'trialing',
                    trial_start: new Date().toISOString(),
                    trial_end: trialEnd.toISOString(),
                    current_period_start: new Date().toISOString(),
                    current_period_end: trialEnd.toISOString(),
                });
            }
        }

        // Send Welcome/Received Email to the Applicant
        try {
            await sendEmail(
                studentEmail,
                'Application Received 📝 — Your 14-Day Free Trial Has Started!',
                getSellerApplicationTemplate(fullName)
            );
        } catch (emailErr) {
            console.warn('Applicant email failed (non-fatal):', emailErr);
        }

        // Notify ops team
        try {
            await sendEmail(
                'ops-support@marketbridge.com.ng',
                `New Seller Application: ${fullName}`,
                `<p>New application received from <strong>${fullName}</strong> (${university} - ${campusArea}).<br/>
                User ID: ${userId}<br/>
                Contact: ${phoneNumber} | ${studentEmail}<br/>
                ID Uploaded: ${idCardUrl ? 'Yes' : 'No'}<br/>
                Categories: ${sellCategories.join(', ')}<br/><br/>
                Log in to the <a href="https://marketbridge.com.ng/admin">operations dashboard</a> to review.</p>`
            );
        } catch (emailErr) {
            console.warn('Ops email failed (non-fatal):', emailErr);
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Seller application api error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
