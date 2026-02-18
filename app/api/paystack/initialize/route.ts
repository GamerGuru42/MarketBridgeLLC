import { NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Please login to purchase' }, { status: 401 });
    }

    try {
        const { listingId } = await req.json();

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
        }

        // 1. Fetch Listing & Seller Details
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*, seller:users!listings_dealer_id_fkey(*)')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.status !== 'active') {
            return NextResponse.json({ error: 'This item is no longer available' }, { status: 400 });
        }

        const seller = listing.seller;
        if (!seller?.paystack_subaccount_code) {
            return NextResponse.json({ error: 'Seller has not set up payouts yet. Please contact support.' }, { status: 400 });
        }

        // 2. Calculate Commission & Split
        const commissionPercentage = 7; // Default 7%
        const finalPrice = listing.current_offered_price || listing.price;
        const amountKobo = Math.round(finalPrice * 100);

        // Generate a unique reference for this transaction
        const reference = `TXNL-${Date.now()}-${listingId.slice(0, 8)}`;

        // 3. Initialize Paystack Transaction with Split
        const initializeParams = {
            email: user.email!,
            amount: amountKobo,
            reference,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/purchases/verify?reference=${reference}`,
            metadata: {
                listing_id: listingId,
                seller_id: seller.id,
                buyer_id: user.id,
                platform_commission_percent: commissionPercentage,
                type: 'marketplace_sale'
            },
            subaccount: seller.paystack_subaccount_code,
            bearer: 'account', // Platform bears the Paystack transaction fees
            channels: ['card', 'bank', 'ussd', 'qr', 'bank_transfer']
        };

        const response = await paystackClient.initializeTransaction(initializeParams as any);

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Checkout Initialization Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize checkout' },
            { status: 500 }
        );
    }
}
