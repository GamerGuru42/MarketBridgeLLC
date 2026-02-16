import { NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { bankCode, accountNumber, accountName, businessName } = body;

        if (!bankCode || !accountNumber || !accountName) {
            return NextResponse.json({ error: 'Missing bank details' }, { status: 400 });
        }

        // Fetch current user data from public.users to check for existing subaccount
        const { data: profile } = await supabase
            .from('users')
            .select('paystack_subaccount_code, email, display_name')
            .eq('id', user.id)
            .single();

        let subaccountCode = profile?.paystack_subaccount_code;

        if (subaccountCode) {
            // Update existing subaccount
            await paystackClient.updateSubaccount(subaccountCode, {
                business_name: businessName || profile?.display_name || user.email,
                settlement_bank: bankCode,
                account_number: accountNumber,
            });
        } else {
            // Create new subaccount
            const response = await paystackClient.createSubaccount({
                business_name: businessName || profile?.display_name || user.email || 'MarketBridge Seller',
                settlement_bank: bankCode,
                account_number: accountNumber,
                percentage_charge: 0, // We control the split in the transaction initialization
                description: `MarketBridge Payouts for ${user.email}`,
                primary_contact_email: user.email,
            });
            subaccountCode = response.data.subaccount_code;
        }

        // Update public.users table with subaccount code and details
        const { error: updateError } = await supabase
            .from('users')
            .update({
                paystack_subaccount_code: subaccountCode,
                bank_details: {
                    bank_code: bankCode,
                    account_number: accountNumber,
                    account_name: accountName,
                    updated_at: new Date().toISOString()
                },
                // Legacy fields for backward compatibility
                bank_name: body.bankName,
                account_number: accountNumber,
                account_name: accountName
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, subaccount_code: subaccountCode });
    } catch (error: any) {
        console.error('Subaccount Ops Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync bank details with Paystack' },
            { status: 500 }
        );
    }
}
