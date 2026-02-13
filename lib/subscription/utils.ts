// MarketBridge Subscription Utilities
// Helper functions for subscription management

import { createClient } from '@/lib/supabase/client';
import type { Subscription, SubscriptionPlan, SubscriptionFeatures } from '@/types/subscription';

/**
 * Get the user's current subscription with plan details
 */
export async function getCurrentSubscription(userId: string): Promise<{
    subscription: Subscription | null;
    plan: SubscriptionPlan | null;
    isTrialing: boolean;
    trialDaysRemaining: number | null;
    trialEndsAt: Date | null;
}> {
    const supabase = createClient();

    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .or('status.eq.trialing')
        .single();

    if (subError || !subscription) {
        return {
            subscription: null,
            plan: null,
            isTrialing: false,
            trialDaysRemaining: null,
            trialEndsAt: null,
        };
    }

    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single();

    const isTrialing = subscription.status === 'trialing';
    let trialDaysRemaining: number | null = null;
    let trialEndsAt: Date | null = null;

    if (isTrialing && subscription.trial_end) {
        trialEndsAt = new Date(subscription.trial_end);
        const now = new Date();
        const diffTime = trialEndsAt.getTime() - now.getTime();
        trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        subscription,
        plan: plan || null,
        isTrialing,
        trialDaysRemaining,
        trialEndsAt,
    };
}

/**
 * Get subscription features based on plan limits
 */
export function getSubscriptionFeatures(plan: SubscriptionPlan | null): SubscriptionFeatures {
    if (!plan) {
        // Default free tier features
        return {
            canCreateListing: true,
            canUploadImages: true,
            canAccessAnalytics: false,
            canUsePrioritySupport: false,
            canCustomizePage: false,
            canBulkUpload: false,
            canUseAPI: false,
            maxListings: 3,
            maxImagesPerListing: 5,
            listingDurationDays: 7,
            hasFeaturedBadge: false,
            hasVerificationBadge: false,
        };
    }

    const limits = plan.limits as any;

    return {
        canCreateListing: true,
        canUploadImages: true,
        canAccessAnalytics: plan.id !== 'free',
        canUsePrioritySupport: limits.priority_support || false,
        canCustomizePage: plan.id === 'campus_pro' || plan.id === 'enterprise',
        canBulkUpload: plan.id === 'campus_pro' || plan.id === 'enterprise',
        canUseAPI: plan.id === 'enterprise',
        maxListings: limits.max_listings || 3,
        maxImagesPerListing: limits.max_images_per_listing || 5,
        listingDurationDays: limits.listing_duration_days || 7,
        hasFeaturedBadge: limits.featured_badge || false,
        hasVerificationBadge: plan.id !== 'free',
    };
}

/**
 * Check if user can create more listings
 */
export async function canCreateListing(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentCount: number;
    maxAllowed: number;
}> {
    const supabase = createClient();
    const { subscription, plan } = await getCurrentSubscription(userId);

    if (!plan) {
        return {
            allowed: false,
            reason: 'No active subscription found',
            currentCount: 0,
            maxAllowed: 0,
        };
    }

    const features = getSubscriptionFeatures(plan);

    // Count active listings
    const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', userId)
        .eq('status', 'active');

    const currentCount = count || 0;
    const maxAllowed = features.maxListings;

    // -1 means unlimited
    if (maxAllowed === -1) {
        return {
            allowed: true,
            currentCount,
            maxAllowed: -1,
        };
    }

    if (currentCount >= maxAllowed) {
        return {
            allowed: false,
            reason: `You've reached your plan limit of ${maxAllowed} active listings. Upgrade to list more items.`,
            currentCount,
            maxAllowed,
        };
    }

    return {
        allowed: true,
        currentCount,
        maxAllowed,
    };
}

/**
 * Format trial countdown message
 */
export function getTrialCountdownMessage(daysRemaining: number): {
    message: string;
    urgency: 'low' | 'medium' | 'high';
    color: string;
} {
    if (daysRemaining <= 0) {
        return {
            message: 'Your trial has expired',
            urgency: 'high',
            color: 'red',
        };
    }

    if (daysRemaining === 1) {
        return {
            message: '⏰ Last day of trial! Upgrade now to keep premium features',
            urgency: 'high',
            color: 'red',
        };
    }

    if (daysRemaining <= 3) {
        return {
            message: `⚠️ ${daysRemaining} days left in your trial`,
            urgency: 'high',
            color: 'orange',
        };
    }

    if (daysRemaining <= 7) {
        return {
            message: `${daysRemaining} days left to enjoy premium features`,
            urgency: 'medium',
            color: 'yellow',
        };
    }

    return {
        message: `${daysRemaining} days remaining in your trial`,
        urgency: 'low',
        color: 'green',
    };
}

/**
 * Check if trial has expired and needs downgrade
 */
export async function checkAndHandleExpiredTrial(userId: string): Promise<boolean> {
    const { subscription, isTrialing, trialDaysRemaining } = await getCurrentSubscription(userId);

    if (!subscription || !isTrialing) {
        return false;
    }

    // If trial expired, trigger downgrade
    if (trialDaysRemaining !== null && trialDaysRemaining <= 0) {
        const supabase = createClient();

        // Call the database function to handle expiration
        const { error } = await supabase.rpc('handle_expired_trials');

        if (error) {
            console.error('Error handling expired trial:', error);
            return false;
        }

        return true; // Trial was expired and handled
    }

    return false;
}

/**
 * Get upgrade recommendation based on usage
 */
export async function getUpgradeRecommendation(userId: string): Promise<{
    shouldUpgrade: boolean;
    recommendedPlan: string | null;
    reason: string;
}> {
    const supabase = createClient();
    const { plan } = await getCurrentSubscription(userId);

    if (!plan || plan.id === 'campus_pro' || plan.id === 'enterprise') {
        return {
            shouldUpgrade: false,
            recommendedPlan: null,
            reason: 'Already on premium plan',
        };
    }

    // Check listing count
    const { count: listingCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', userId);

    const features = getSubscriptionFeatures(plan);

    // If user is hitting limits, recommend upgrade
    if (listingCount && listingCount >= features.maxListings * 0.8) {
        return {
            shouldUpgrade: true,
            recommendedPlan: plan.id === 'free' ? 'campus_starter' : 'campus_pro',
            reason: `You're using ${listingCount} of ${features.maxListings} listings. Upgrade for more capacity!`,
        };
    }

    return {
        shouldUpgrade: false,
        recommendedPlan: null,
        reason: 'Current plan meets your needs',
    };
}
