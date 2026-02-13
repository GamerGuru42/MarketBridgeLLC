import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API Key
// In production, this should be in process.env
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, category, phone } = body;

        if (!email || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Email to the User (Confirmation)
        await resend.emails.send({
            from: 'MarketBridge <no-reply@marketbridge.com>', // Update with verified domain
            to: email,
            subject: `Waitlist Confirmation: ${category} Access`,
            html: `
                <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; border-radius: 10px;">
                    <h1 style="color: #FF6600; text-transform: uppercase;">Access Requested</h1>
                    <p>You have been added to the priority queue for <strong>${category}</strong>.</p>
                    <p>We are currently restricting access to verified nodes only. You will be notified immediately once this protocol level is unlocked for your credentials.</p>
                    <br/>
                    <div style="border-top: 1px solid #333; padding-top: 20px; font-size: 12px; color: #666;">
                        MARKETBRIDGE PROTOCOL V1.0
                    </div>
                </div>
            `
        });

        // Email to Admin (Notification) - Optional
        // await resend.emails.send({ ... })

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Waitlist email error:', error);
        // Don't block the UI flow even if email fails in this demo env without valid key
        return NextResponse.json({ success: true, warning: 'Email dispatch simulated' });
    }
}
