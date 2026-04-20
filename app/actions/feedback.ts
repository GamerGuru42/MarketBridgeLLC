'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY || 'default_key');

export async function submitFeedback(data: {
    type: string;
    description: string;
    name?: string;
    email?: string;
    userId?: string;
}) {
    try {
        // 1. Insert into Postgres
        const { error: dbError } = await supabase
            .from('feedbacks')
            .insert({
                user_id: data.userId || null,
                type: data.type,
                description: data.description,
                name: data.name || null,
                email: data.email || null,
                status: 'open'
            });

        if (dbError) {
            console.error("Failed to save feedback to db", dbError);
            return { success: false, error: "Database internal check failed. Please try again." };
        }

        // 2. Fire instant email to operations
        if (process.env.RESEND_API_KEY) {
            const timestamp = new Date().toLocaleString('en-NG');
            await resend.emails.send({
                from: 'MarketBridge Beta <onboarding@resend.dev>',
                to: 'ops-support@marketbridge.com.ng',
                subject: `New ${data.type} Submitted`,
                html: `
                    <h2>MarketBridge Beta Feedback</h2>
                    <p><strong>Type:</strong> ${data.type}</p>
                    <p><strong>Time:</strong> ${timestamp}</p>
                    <hr/>
                    <p><strong>Message:</strong></p>
                    <p>${data.description}</p>
                    <br/>
                    <p><small>Submitted by: ${data.name || 'Anonymous'} (${data.email || 'No email provided'})</small></p>
                `
            });
        }

        return { success: true };
    } catch (err: any) {
        console.error("Feedback error", err);
        return { success: false, error: err?.message || 'Failed to submit feedback' };
    }
}
