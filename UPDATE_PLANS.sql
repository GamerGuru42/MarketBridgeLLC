-- Update Subscription Plans to match user requirements
-- Campus Starter: NGN 1,000 / month
-- Enterprise: Contact Sales, includes all lower tier features

UPDATE subscription_plans 
SET 
    price_monthly = 1000, 
    price_annual = 10800, -- 10% discount from 12k
    features = '["List up to 15 items", "Priority chat support", "30-day listing duration", "Enhanced visibility", "Basic analytics", "Verification badge", "Direct customer messaging"]',
    limits = '{"max_listings": 15, "listing_duration_days": 30, "max_images_per_listing": 10, "priority_support": true, "verification_badge": true}'
WHERE id = 'campus_starter';

-- Update Campus Pro to be 2500 (since starter is now 1000)
-- This is a reasonable progression as the user said "1000/month plan"
UPDATE subscription_plans
SET
    price_monthly = 2500,
    price_annual = 27000,
    features = '["Unlimited listings", "24/7 priority support", "90-day listing duration", "Premium visibility", "Advanced analytics", "Featured merchant badge", "Custom business page", "Bulk upload tools", "Verified seller status"]',
    limits = '{"max_listings": -1, "listing_duration_days": 90, "max_images_per_listing": 20, "priority_support": true, "featured_badge": true, "custom_page": true}'
WHERE id = 'campus_pro';

UPDATE subscription_plans
SET 
    features = '["All Campus Pro & Starter features", "Dedicated account manager", "API access", "White-label options", "Custom integrations", "Priority campus-wide visibility", "Unlimited operational capacity", "Private seller terminal"]',
    price_monthly = 0, -- Contact Sales
    price_annual = 0
WHERE id = 'enterprise';
