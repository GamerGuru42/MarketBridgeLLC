import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const { amount, email, userId } = await req.json();

        if (!amount || !email || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (amount < 10000) { // 100 naira in kobo
            return NextResponse.json({ error: 'Minimum deposit is ₦100' }, { status: 400 });
        }

        if (amount > 100000000) { // 1M naira in kobo
            return NextResponse.json({ error: 'Maximum deposit is ₦1,000,000' }, { status: 400 });
        }

        const reference = `WDEP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Initialize Paystack transaction
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount,
                reference,
                callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://marketbridge.com.ng'}/wallet?deposit=success&ref=${reference}`,
                metadata: {
                    type: 'wallet_deposit',
                    user_id: userId,
                },
                channels: ['card', 'bank', 'ussd', 'qr', 'bank_transfer'],
            }),
        });

        const paystackData = await paystackRes.json();

        if (!paystackData.status) {
            return NextResponse.json(
                { error: paystackData.message || 'Failed to initialize payment' },
                { status: 500 }
            );
        }

        // Create pending transaction record
        await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            wallet_id: userId,
            type: 'deposit',
            amount,
            status: 'pending',
            reference,
            metadata: {
                paystack_access_code: paystackData.data.access_code,
                paystack_reference: paystackData.data.reference,
            },
        });

        return NextResponse.json({
            authorization_url: paystackData.data.authorization_url,
            access_code: paystackData.data.access_code,
            reference: paystackData.data.reference,
        });
    } catch (error: any) {
        console.error('Wallet deposit error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
