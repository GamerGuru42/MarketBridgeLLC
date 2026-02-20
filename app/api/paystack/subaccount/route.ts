import { NextResponse } from 'next/server';
import { createPaystackSubaccount } from '@/lib/paystack';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { businessName, bankCode, accountNumber, userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subaccountCode = await createPaystackSubaccount(
            businessName,
            bankCode,
            accountNumber,
            5.3 // Commission rate
        );

        if (subaccountCode) {
            // Update user profile in DB
            const supabaseServer = await createClient();
            const { error } = await supabaseServer
                .from('users')
                .update({
                    paystack_subaccount_code: subaccountCode,
                    bank_name: bankCode, // Should probably store bank name too if possible
                    account_number: accountNumber
                })
                .eq('id', userId);

            if (error) {
                console.error('Database update error:', error);
                return NextResponse.json({ error: 'Failed to save subaccount code' }, { status: 500 });
            }

            return NextResponse.json({ success: true, subaccountCode });
        } else {
            return NextResponse.json({ error: 'Failed to create subaccount' }, { status: 400 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
