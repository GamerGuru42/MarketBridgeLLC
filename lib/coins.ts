import { createClient } from './supabase/client';

const supabase = createClient();

export const COIN_REWARD_RATE_BUYER = 100; // 1 coin per ₦100 spent
export const COIN_REWARD_RATE_SELLER = 200; // 1 coin per ₦200 sold

/**
 * Earn coins for a buyer after a purchase
 */
export async function earnCoinsBuyer(userId: string, amountSpent: number, orderId: string) {
    const coinsToEarn = Math.floor(amountSpent / COIN_REWARD_RATE_BUYER);
    if (coinsToEarn <= 0) return;

    const { error } = await supabase.rpc('add_coins', {
        amount_to_add: coinsToEarn,
        user_id: userId,
        trans_type: 'earn_purchase',
        trans_desc: `Earned from purchase (Order: ${orderId})`
    });

    if (error) console.error('Error earning coins (buyer):', error);
}

/**
 * Earn coins for a seller after a sale
 */
export async function earnCoinsSeller(userId: string, amountSold: number, orderId: string) {
    const coinsToEarn = Math.floor(amountSold / COIN_REWARD_RATE_SELLER);
    if (coinsToEarn <= 0) return;

    const { error } = await supabase.rpc('add_coins', {
        amount_to_add: coinsToEarn,
        user_id: userId,
        trans_type: 'earn_sale',
        trans_desc: `Earned from sale (Order: ${orderId})`
    });

    if (error) console.error('Error earning coins (seller):', error);
}

/**
 * Redeem coins for a discount
 */
export async function redeemCoins(userId: string, coinsToRedeem: number, orderId: string) {
    const { error } = await supabase.rpc('subtract_coins', {
        amount_to_subtract: coinsToRedeem,
        user_id: userId,
        trans_type: 'redeem',
        trans_desc: `Redeemed for discount (Order: ${orderId})`
    });

    if (error) throw error;
}
