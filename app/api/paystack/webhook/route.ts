import { NextResponse } from 'next/server';
import { paystackClient, PaystackWebhookHandler } from '@/lib/payment/paystack';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('x-paystack-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify Webhook Signature
    const isValid = paystackClient.verifyWebhookSignature(body, signature);

    if (!isValid) {
        console.error('Invalid Paystack Webhook Signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        const event = JSON.parse(body);
        await PaystackWebhookHandler.handleEvent(event);
        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook internal error' },
            { status: 500 }
        );
    }
}
