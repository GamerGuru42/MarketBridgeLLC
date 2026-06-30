/**
 * MarketBridge Subscription Enforcement
 * Validates whether a seller is allowed to create a new listing
 * based on their active subscription tier and current listing count.
 */

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingPermissionResult {
  allowed: boolean;
  error?: string;
  currentCount?: number;
  limit?: number | null; // null = unlimited
  tier?: string;
}

type SubscriptionTier = 'basic' | 'standard' | 'pro';

const LISTING_LIMITS: Record<SubscriptionTier, number | null> = {
  basic: 5,
  standard: 20,
  pro: null, // unlimited
};

// ─── canCreateListing ─────────────────────────────────────────────────────────

/**
 * Checks whether a seller is allowed to create one more listing.
 *
 * Rules:
 * - If their subscription has expired (or they have none), treat as "basic".
 * - "basic" = max 5 active listings.
 * - "standard" = max 20 active listings.
 * - "pro" = unlimited.
 *
 * The check uses `listings_count` on the users table (kept in sync by a
 * DB trigger) rather than doing a live COUNT query, to stay fast.
 */
export async function canCreateListing(sellerId: string): Promise<ListingPermissionResult> {
  if (!sellerId) {
    return { allowed: false, error: 'sellerId is required' };
  }

  const supabase = createClient();

  const { data: seller, error: sellerErr } = await supabase
    .from('users')
    .select('subscription_tier, subscription_expires_at, listings_count')
    .eq('id', sellerId)
    .single();

  if (sellerErr || !seller) {
    return { allowed: false, error: 'Seller not found' };
  }

  const typedSeller = seller as {
    subscription_tier: string | null;
    subscription_expires_at: string | null;
    listings_count: number | null;
  };

  // Determine effective tier
  const isActive =
    typedSeller.subscription_expires_at != null &&
    new Date(typedSeller.subscription_expires_at) > new Date();

  const tier: SubscriptionTier = isActive
    ? ((typedSeller.subscription_tier ?? 'basic') as SubscriptionTier)
    : 'basic';

  const limit = LISTING_LIMITS[tier] ?? LISTING_LIMITS.basic;
  const currentCount = typedSeller.listings_count ?? 0;

  // Pro tier: unlimited
  if (limit === null) {
    return { allowed: true, currentCount, limit: null, tier };
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      error: `Your ${tier} plan allows ${limit} active listing${limit === 1 ? '' : 's'}. You currently have ${currentCount}. Upgrade your plan to add more.`,
      currentCount,
      limit,
      tier,
    };
  }

  return { allowed: true, currentCount, limit, tier };
}

// ─── validateSubscriptionMiddleware ──────────────────────────────────────────

/**
 * Drop-in middleware for listing creation API routes.
 * Returns a Response with 403 if the seller cannot create a listing,
 * or null if the request is allowed to proceed.
 */
export async function validateSubscriptionMiddleware(
  sellerId: string
): Promise<Response | null> {
  const result = await canCreateListing(sellerId);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: result.error }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

// ─── getRemainingListingSlots ─────────────────────────────────────────────────

/**
 * Returns how many more listings a seller can create.
 * Returns Infinity for pro tier.
 */
export async function getRemainingListingSlots(sellerId: string): Promise<number> {
  const result = await canCreateListing(sellerId);

  if (!result.allowed) return 0;
  if (result.limit === null) return Infinity;
  return (result.limit ?? 0) - (result.currentCount ?? 0);
}
