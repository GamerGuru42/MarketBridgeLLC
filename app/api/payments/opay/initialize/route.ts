import { NextResponse } from 'next/server';
import { createOPayPayment } from '@/lib/server/opay';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const { amount, description, email } = await req.body ? await req.json() : {};

        if (!amount || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const reference = `OP-${Date.now()}-${uuidv4().slice(0, 8)}`;
        const returnUrl = `${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/payment/callback?reference=${reference}`;

        const response = await createOPayPayment({
            amount,
            reference,
            email,
            description: description || 'MarketBridge Purchase',
            returnUrl
        });

        if (response.code === '00000') {
            return NextResponse.json({
                success: true,
                cashierUrl: response.data.cashierUrl,
                reference: reference
            });
        } else {
            return NextResponse.json({ error: response.message || 'OPay initialization failed' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('OPay API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
