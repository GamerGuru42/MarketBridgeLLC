import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PROMOTION_COST = 500; // 500 MarketCoins to promote a listing

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const { listingId } = await req.json();

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
        }

        // 1. Check if listing belongs to user
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('dealer_id, title, is_sponsored')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.dealer_id !== user.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        if (listing.is_sponsored) {
            return NextResponse.json({ error: 'Listing is already sponsored' }, { status: 400 });
        }

        // 2. Check coin balance
        const { data: profile } = await supabase
            .from('users')
            .select('coins_balance')
            .eq('id', user.id)
            .single();

        if ((profile?.coins_balance || 0) < PROMOTION_COST) {
            return NextResponse.json({
                error: `Insufficient MarketCoins. Need ${PROMOTION_COST} MC to promote.`,
                current_balance: profile?.coins_balance || 0
            }, { status: 400 });
        }

        // 3. Perform atomic update (Subtract coins & Promote listing)
        // We use the subtract_coins RPC function we created earlier
        const { error: promoError } = await supabase.rpc('subtract_coins', {
            user_id: user.id,
            amount_to_subtract: PROMOTION_COST,
            trans_type: 'promotion',
            trans_desc: `Sponsorship for listing: ${listing.title}`
        });

        if (promoError) throw promoError;

        // 4. Mark listing as sponsored
        const { error: updateError } = await supabase
            .from('listings')
            .update({ is_sponsored: true })
            .eq('id', listingId);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: 'Listing successfully sponsored!',
            new_balance: profile && profile.coins_balance ? (profile.coins_balance - PROMOTION_COST) : 0
        });

    } catch (error: any) {
        console.error('Promotion Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
