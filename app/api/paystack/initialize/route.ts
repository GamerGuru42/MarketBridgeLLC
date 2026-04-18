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
        const { listingId, coinsToUse = 0 } = await req.json();

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

        // Verify insufficient coins
        if (coinsToUse > 0) {
            const { data: profile } = await supabase.from('users').select('coins_balance').eq('id', user.id).single();
            if (!profile || (profile.coins_balance || 0) < coinsToUse) {
                return NextResponse.json({ error: 'Insufficient MarketCoins' }, { status: 400 });
            }
        }

        // Private Beta / Demo Mode Enforcement
        const { data: systemSettings } = await supabase
            .from('system_settings')
            .select('is_demo_mode')
            .eq('id', 'global')
            .maybeSingle();

        const isDemo = systemSettings?.is_demo_mode || false;
        const finalPrice = listing.current_offered_price || listing.price;

        if (isDemo && finalPrice > 5000) {
            return NextResponse.json({ 
                error: '🚧 PRIVATE BETA LIMIT: During this 30-day testing window, maximum transaction value is capped at ₦5,000. Please negotiate the price down in the chat to proceed with this test payment.' 
            }, { status: 403 });
        }

        if (isDemo) {
            console.log('NOTICE: Initializing transaction in DEMO MODE (Test Environment Enforced)');
        }

        // 2. Calculate Commission & Split (Two-Tier Transaction System)
        
        let baseCommission = 0;
        if (finalPrice <= 100000) {
            baseCommission = finalPrice * 0.015; // Tier 1: 1.5% fee
        } else if (finalPrice <= 300000) {
            baseCommission = (finalPrice * 0.025) + 2000; // Tier 2: 2.5% + flat ₦2,000 High-Value Protection Fee
        } else {
            return NextResponse.json({ error: 'Transaction exceeds ₦300,000 platform limit' }, { status: 400 });
        }

        // Calculate discount. 1 MC = ₦1
        const discountedPrice = Math.max(0, finalPrice - coinsToUse);

        // Platform eats the MarketCoins discount from our commission
        let finalPlatformFee = baseCommission - coinsToUse;
        // Paystack cannot take a negative transaction charge. 
        if (finalPlatformFee < 0) {
            finalPlatformFee = 0; 
        }

        // Smart Escrow protection fee (+₦150 flat when buyer opts in)
        const isEscrow = (await req.clone().json().catch(() => ({}))).type === 'escrow';
        const escrowFee = isEscrow ? 150 : 0;
        
        finalPlatformFee += escrowFee; // Escrow fee goes to platform

        const totalCharge = discountedPrice + escrowFee;
        const amountKobo = Math.round(totalCharge * 100);
        const transactionChargeKobo = Math.round(finalPlatformFee * 100);

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
                platform_commission_kobo: transactionChargeKobo,
                coins_used: coinsToUse,
                original_price: finalPrice,
                escrow_fee: escrowFee,
                type: isEscrow ? 'escrow' : 'marketplace_sale'
            },
            subaccount: seller.paystack_subaccount_code,
            transaction_charge: transactionChargeKobo,
            bearer: 'account',
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
