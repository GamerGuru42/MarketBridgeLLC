import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API Key
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, category } = body;

        if (!email || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Email to the User (Confirmation)
        await resend.emails.send({
            from: 'MarketBridge <no-reply@marketbridge.com.ng>',
            to: email,
            subject: `Waitlist Confirmation: ${category} Access`,
            html: `
                <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #333;">
                    <h1 style="color: #FF6200; text-transform: uppercase; font-size: 24px; letter-spacing: 2px;">MarketBridge System</h1>
                    <p style="font-size: 16px; line-height: 1.6;">You have been successfully added to the priority queue for <strong>${category}</strong>.</p>
                    <p style="font-size: 14px; color: #888;">We are currently restricting access to verified nodes only. You will be notified immediately once this System level is unlocked for your credentials.</p>
                    <br/>
                    <div style="border-top: 1px solid #333; padding-top: 20px; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 3px;">
                        MarketBridge Systems // Abuja Dashboard Node
                    </div>
                </div>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Waitlist email error:', error);
        // Don't block the UI flow in beta
        return NextResponse.json({ success: true, warning: 'System simulation active' });
    }
}