import { NextResponse } from 'next/server';
import { paystackClient, PaystackWebhookHandler } from '@/lib/payment/paystack';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = headers().get('x-paystack-signature');

        if (!signature) {
            return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
        }

        // Verify the signature
        const isValid = paystackClient.verifyWebhookSignature(body, signature);

        if (!isValid) {
            console.error('Invalid Paystack signature');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);

        // Use the handler to process the event
        await PaystackWebhookHandler.handleEvent(event);

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Paystack Webhook Error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
