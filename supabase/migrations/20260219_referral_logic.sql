-- Migration: Referral Bonus Logic
-- Date: 2026-02-19

CREATE OR REPLACE FUNCTION public.reward_coins_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    buyer_coins INTEGER;
    seller_coins INTEGER;
    referrer_id UUID;
    referral_already_paid BOOLEAN;
BEGIN
    -- Only act when status changes to 'completed' or 'delivered' or 'paid' (depending on flow)
    -- Using 'completed' or 'paid' as the trigger point
    IF (NEW.status = 'completed' OR NEW.status = 'paid') AND (OLD.status != 'completed' AND OLD.status != 'paid') THEN
        
        -- 1. Reward Buyer: 1 coin per 100 NGN
        buyer_coins := floor(NEW.amount / 100);
        IF buyer_coins > 0 THEN
            PERFORM public.add_coins(NEW.buyer_id, buyer_coins, 'earn_purchase', 'Reward for order #' || NEW.id);
        END IF;

        -- 2. Reward Seller: 1 coin per 200 NGN
        IF NEW.seller_id IS NOT NULL THEN
            seller_coins := floor(NEW.amount / 200);
            IF seller_coins > 0 THEN
                PERFORM public.add_coins(NEW.seller_id, seller_coins, 'earn_sale', 'Reward for selling order #' || NEW.id);
            END IF;
        END IF;

        -- 3. Referral Bonus: 300 coins when referred user completes N5,000+ purchase
        IF NEW.amount >= 5000 THEN
            -- Check if buyer has a referrer
            SELECT referred_by_id INTO referrer_id FROM public.users WHERE id = NEW.buyer_id;
            
            IF referrer_id IS NOT NULL THEN
                -- check if this is the FIRST time the referrer gets a bonus for this specific user
                SELECT EXISTS(
                    SELECT 1 FROM public.coins_transactions 
                    WHERE user_id = referrer_id 
                    AND type = 'referral' 
                    AND description LIKE '%' || NEW.buyer_id || '%'
                ) INTO referral_already_paid;

                IF NOT referral_already_paid THEN
                    PERFORM public.add_coins(referrer_id, 300, 'referral', 'Referral bonus: ' || NEW.buyer_id || ' completed first large purchase');
                END IF;
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
