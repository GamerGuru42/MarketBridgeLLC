import { NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';

export async function GET() {
    try {
        const banks = await paystackClient.listBanks();
        return NextResponse.json(banks);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch banks' },
            { status: 500 }
        );
    }
}
