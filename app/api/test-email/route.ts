import { NextResponse } from 'next/server';
import { verifyConnection, sendEmail } from '@/lib/email';

export async function GET() {
    try {
        console.log('Testing Email Connection...');

        // 1. Verify SMTP Connection
        const isConnected = await verifyConnection();
        if (!isConnected) {
            return NextResponse.json({
                success: false,
                error: 'SMTP Connection Failed. Check server logs for details.',
                config: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER,
                    baseurl: process.env.NEXT_PUBLIC_APP_URL
                }
            }, { status: 500 });
        }

        // 2. Send Test Email (to self)
        const recipient = process.env.SMTP_USER || 'support@marketbridge.com.ng';
        const success = await sendEmail(
            recipient,
            'MarketBridge SMTP Test',
            `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h1 style="color: #FF6600;">System Test Verified</h1>
                <p>Your MarketBridge email service is successfully configured.</p>
                <p style="color: #666; font-size: 12px;">Timestamp: ${new Date().toISOString()}</p>
            </div>
            `
        );

        if (success) {
            return NextResponse.json({
                success: true,
                message: `Test email sent to ${recipient}`
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Connection verified, but failed to send email.'
            }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
