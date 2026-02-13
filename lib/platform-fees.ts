/**
 * MarketBridge Platform Fees & Commission System
 * Handles revenue collection from successful transactions
 */

export interface PlatformFeeConfig {
    orderFeePercentage: number; // % of each order
    minimumFee: number; // Minimum fee in Naira
    maximumFee: number; // Maximum fee in Naira (optional cap)
    subscriptionFeePercentage: number; // For dealer subscriptions
    dealerRegistrationFee: number; // One-time dealer setup
}

// Default Platform Configuration
const DEFAULT_CONFIG: PlatformFeeConfig = {
    orderFeePercentage: 5.0, // 5% of each successful transaction
    minimumFee: 100, // ₦100 minimum
    maximumFee: 50000, // ₦50,000 cap for large transactions
    subscriptionFeePercentage: 0, // We collect full subscription amount
    dealerRegistrationFee: 5000, // ₦5,000 one-time dealer verification fee
};

/**
 * Calculate platform fee for an order
 */
export function calculateOrderFee(
    orderAmount: number,
    config: PlatformFeeConfig = DEFAULT_CONFIG
): {
    platformFee: number;
    sellerReceives: number;
    buyerPays: number;
} {
    // Calculate percentage-based fee
    let platformFee = (orderAmount * config.orderFeePercentage) / 100;

    // Apply minimum fee
    if (platformFee < config.minimumFee) {
        platformFee = config.minimumFee;
    }

    // Apply maximum fee cap
    if (config.maximumFee && platformFee > config.maximumFee) {
        platformFee = config.maximumFee;
    }

    // Round to nearest Naira
    platformFee = Math.round(platformFee);

    return {
        platformFee,
        sellerReceives: orderAmount - platformFee,
        buyerPays: orderAmount, // Buyer pays listing price, fee comes from seller
    };
}

/**
 * Calculate Paystack transaction fee
 * (Paystack charges buyer, but we need to know total cost)
 */
export function calculatePaystackFee(amount: number): {
    paystackFee: number;
    totalCharge: number;
} {
    // Paystack: 1.5% + ₦100 (capped at ₦2000)
    let paystackFee = (amount * 1.5) / 100 + 100;

    if (paystackFee > 2000) {
        paystackFee = 2000;
    }

    return {
        paystackFee: Math.round(paystackFee),
        totalCharge: amount + Math.round(paystackFee),
    };
}

/**
 * Calculate complete transaction breakdown
 */
export function calculateTransactionBreakdown(listingPrice: number): {
    listingPrice: number;
    platformFee: number;
    paystackFee: number;
    sellerReceives: number;
    buyerPays: number;
    marketBridgeRevenue: number;
} {
    const orderFees = calculateOrderFee(listingPrice);
    const paymentFees = calculatePaystackFee(listingPrice);

    return {
        listingPrice,
        platformFee: orderFees.platformFee,
        paystackFee: paymentFees.paystackFee,
        sellerReceives: orderFees.sellerReceives,
        buyerPays: paymentFees.totalCharge,
        marketBridgeRevenue: orderFees.platformFee, // Our cut
    };
}

/**
 * Format fee breakdown for display
 */
export function formatFeeBreakdown(listingPrice: number): string {
    const breakdown = calculateTransactionBreakdown(listingPrice);

    return `
Listing Price: ₦${breakdown.listingPrice.toLocaleString()}
Platform Fee (5%): -₦${breakdown.platformFee.toLocaleString()}
Seller Receives: ₦${breakdown.sellerReceives.toLocaleString()}

Buyer Pays: ₦${breakdown.buyerPays.toLocaleString()}
(includes ₦${breakdown.paystackFee.toLocaleString()} payment processing)
    `.trim();
}

/**
 * Get dealer registration fee
 */
export function getDealerRegistrationFee(): number {
    return DEFAULT_CONFIG.dealerRegistrationFee;
}

/**
 * Calculate subscription revenue
 */
export function calculateSubscriptionRevenue(
    subscriptionPrice: number
): number {
    // We keep 100% of subscriptions since they're optional premium features
    return subscriptionPrice;
}

/**
 * Validate fee configuration
 */
export function isValidFeeConfig(config: PlatformFeeConfig): boolean {
    return (
        config.orderFeePercentage >= 0 &&
        config.orderFeePercentage <= 100 &&
        config.minimumFee >= 0 &&
        (!config.maximumFee || config.maximumFee >= config.minimumFee)
    );
}
