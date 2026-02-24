import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPaystackSubaccount } from '@/lib/paystack';

export async function POST(req: NextRequest) {
    try {
        const { businessName, bankCode, accountNumber, userId } = await req.json();

        if (!businessName || !bankCode || !accountNumber || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Subaccount on Paystack
        const subaccountCode = await createPaystackSubaccount(
            businessName,
            bankCode,
            accountNumber,
            5.3 // Commission Rate
        );

        if (!subaccountCode) {
            return NextResponse.json({ error: 'Failed to create Paystack subaccount' }, { status: 500 });
        }

        // 2. Update User Profile with Subaccount Code
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                paystack_subaccount_code: subaccountCode,
                business_name: businessName,
                account_number: accountNumber,
                bank_name: bankCode,
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating profile with subaccount:', updateError);
            return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
        }

        return NextResponse.json({
            status: 'success',
            subaccount_code: subaccountCode
        });

    } catch (err: any) {
        console.error('Subaccount API error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
