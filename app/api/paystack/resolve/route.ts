import { NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get('accountNumber');
    const bankCode = searchParams.get('bankCode');

    if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const resolution = await paystackClient.resolveAccount(accountNumber, bankCode);
        return NextResponse.json(resolution);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to resolve account' },
            { status: 400 }
        );
    }
}
