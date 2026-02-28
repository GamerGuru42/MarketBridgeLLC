import { NextRequest, NextResponse } from 'next/server';
import { paystackClient } from '@/lib/payment/paystack';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Sponsorship tier definitions
const BOOST_TIERS = {
    basic: {
        name: 'Basic Boost',
        amount: 500,        // ₦500
        amountKobo: 50000,
        durationDays: 3,
        coinsReward: 10,
        perks: ['Pinned to top of category for 3 days', '+10 MarketCoins bonus'],
    },
    featured: {
        name: 'Featured',
        amount: 1500,       // ₦1,500
        amountKobo: 150000,
        durationDays: 7,
        coinsReward: 25,
        perks: ['Pinned to top for 7 days', 'FEATURED badge', '+25 MarketCoins'],
    },
    premium: {
        name: 'Premium Spotlight',
        amount: 3000,       // ₦3,000
        amountKobo: 300000,
        durationDays: 14,
        coinsReward: 50,
        perks: ['Pinned to top for 14 days', 'PREMIUM badge', 'Homepage exposure', '+50 MarketCoins'],
    },
} as const;

type Tier = keyof typeof BOOST_TIERS;

// GET /api/paystack/boost — return tier info (for the frontend modal)
export async function GET() {
    return NextResponse.json({ tiers: BOOST_TIERS });
}

// POST /api/paystack/boost — initialize ad payment
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { listingId, tier } = await req.json();

        if (!listingId || !tier || !BOOST_TIERS[tier as Tier]) {
            return NextResponse.json({ error: 'Invalid listing or tier' }, { status: 400 });
        }

        const tierData = BOOST_TIERS[tier as Tier];

        // Verify the seller owns this listing
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, title, dealer_id, status, is_sponsored, sponsored_until')
            .eq('id', listingId)
            .eq('dealer_id', user.id)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found or you do not own it' }, { status: 404 });
        }

        if (listing.status !== 'active') {
            return NextResponse.json({ error: 'Only active listings can be boosted' }, { status: 400 });
        }

        // Check if already sponsored
        if (listing.is_sponsored && listing.sponsored_until && new Date(listing.sponsored_until) > new Date()) {
            const expiryDate = new Date(listing.sponsored_until).toLocaleDateString('en-NG', { dateStyle: 'medium' });
            return NextResponse.json({
                error: `This listing is already boosted until ${expiryDate}. You can renew after it expires.`
            }, { status: 400 });
        }

        const reference = `BOOST-${Date.now()}-${listingId.slice(0, 8).toUpperCase()}`;

        // Create pending ad_payment record
        await supabaseAdmin.from('ad_payments').insert({
            seller_id: user.id,
            listing_id: listingId,
            paystack_reference: reference,
            tier,
            duration_days: tierData.durationDays,
            amount_paid: tierData.amount,
            status: 'pending',
        });

        // Get seller email for Paystack
        const { data: profile } = await supabase
            .from('users')
            .select('email, display_name')
            .eq('id', user.id)
            .single();

        // Initialize Paystack transaction — goes directly to platform (no subaccount split)
        const response = await paystackClient.initializeTransaction({
            email: profile?.email || user.email!,
            amount: tierData.amountKobo,
            reference,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard?boost_success=1&listing=${listingId}`,
            metadata: {
                type: 'listing_boost',
                listing_id: listingId,
                listing_title: listing.title,
                seller_id: user.id,
                tier,
                duration_days: tierData.durationDays,
                coins_reward: tierData.coinsReward,
            },
            channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        });

        return NextResponse.json({
            authorization_url: response.data.authorization_url,
            reference,
            tier: tierData,
        });

    } catch (error: any) {
        console.error('Boost initialization error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize boost payment' },
            { status: 500 }
        );
    }
}
