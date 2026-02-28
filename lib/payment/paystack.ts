// MarketBridge Paystack Integration
// PCI-Compliant Payment Processing for Nigeria
// Date: 2026-02-13

import axios, { AxiosInstance } from 'axios';
import type {
    PaystackInitializeResponse,
    PaystackVerifyResponse,
    PaystackWebhookEvent,
    Currency,
} from '@/types/subscription';

// ============================================
// CONFIGURATION
// ============================================

// CONFIGURATION
// ============================================

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// if (!PAYSTACK_SECRET_KEY && process.env.NODE_ENV === 'production') {
//     console.warn('PAYSTACK_SECRET_KEY is missing. Paystack features will be disabled.');
// }

// ============================================
// PAYSTACK CLIENT
// ============================================

class PaystackClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: PAYSTACK_BASE_URL,
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('Paystack API Error:', error.response?.data || error.message);
                throw new PaystackError(
                    error.response?.data?.message || 'Payment processing failed',
                    error.response?.status,
                    error.response?.data
                );
            }
        );
    }

    /**
     * Initialize a payment transaction
     */
    async initializeTransaction(params: {
        email: string;
        amount: number; // In kobo
        currency?: Currency;
        reference?: string;
        callback_url?: string;
        metadata?: Record<string, any>;
        channels?: string[];
        plan?: string;
        subaccount?: string; // Subaccount code for split payments
        transaction_charge?: number; // Transaction charge in kobo
        bearer?: 'account' | 'subaccount' | 'all' | 'none';
    }): Promise<PaystackInitializeResponse> {
        const payload: any = {
            email: params.email,
            amount: params.amount,
            currency: params.currency || 'NGN',
            reference: params.reference || this.generateReference(),
            callback_url: params.callback_url,
            metadata: params.metadata,
            channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'bank_transfer'],
        };

        if (params.plan) payload.plan = params.plan;
        if (params.subaccount) {
            payload.subaccount = params.subaccount;
            payload.bearer = params.bearer || 'account'; // Main account usually bears fees in split
            if (params.transaction_charge) payload.transaction_charge = params.transaction_charge;
        }

        const response = await this.client.post<PaystackInitializeResponse>(
            '/transaction/initialize',
            payload
        );

        return response.data;
    }

    /**
     * Create a subaccount
     */
    async createSubaccount(params: {
        business_name: string;
        settlement_bank: string; // Bank code
        account_number: string;
        percentage_charge: number;
        description?: string;
        primary_contact_email?: string;
    }) {
        const response = await this.client.post('/subaccount', params);
        return response.data;
    }

    /**
     * Update a subaccount
     */
    async updateSubaccount(code: string, params: {
        business_name?: string;
        settlement_bank?: string;
        account_number?: string;
        percentage_charge?: number;
        active?: boolean;
    }) {
        const response = await this.client.put(`/subaccount/${code}`, params);
        return response.data;
    }

    /**
     * List banks
     */
    async listBanks() {
        const response = await this.client.get('/bank');
        return response.data;
    }

    /**
     * Resolve account number
     */
    async resolveAccount(account_number: string, bank_code: string) {
        const response = await this.client.get(`/bank/resolve`, {
            params: { account_number, bank_code }
        });
        return response.data;
    }

    /**
     * Verify a transaction
     */
    async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
        const response = await this.client.get<PaystackVerifyResponse>(
            `/transaction/verify/${reference}`
        );

        return response.data;
    }

    /**
     * Create a customer
     */
    async createCustomer(params: {
        email: string;
        first_name: string;
        last_name: string;
        phone?: string;
        metadata?: Record<string, any>;
    }) {
        const response = await this.client.post('/customer', params);
        return response.data;
    }

    /**
     * Create a subscription plan
     */
    async createPlan(params: {
        name: string;
        amount: number; // In kobo
        interval: 'daily' | 'weekly' | 'monthly' | 'annually';
        description?: string;
        currency?: Currency;
        invoice_limit?: number;
    }) {
        const response = await this.client.post('/plan', {
            name: params.name,
            amount: params.amount,
            interval: params.interval,
            description: params.description,
            currency: params.currency || 'NGN',
            invoice_limit: params.invoice_limit,
        });

        return response.data;
    }

    /**
     * Subscribe a customer to a plan
     */
    async createSubscription(params: {
        customer: string; // Customer code or email
        plan: string; // Plan code
        authorization: string; // Authorization code from previous transaction
        start_date?: string; // ISO 8601 format
    }) {
        const response = await this.client.post('/subscription', params);
        return response.data;
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(params: {
        code: string; // Subscription code
        token: string; // Email token
    }) {
        const response = await this.client.post('/subscription/disable', params);
        return response.data;
    }

    /**
     * Charge authorization (for recurring payments)
     */
    async chargeAuthorization(params: {
        email: string;
        amount: number; // In kobo
        authorization_code: string;
        reference?: string;
        currency?: Currency;
        metadata?: Record<string, any>;
    }) {
        const response = await this.client.post('/transaction/charge_authorization', {
            email: params.email,
            amount: params.amount,
            authorization_code: params.authorization_code,
            reference: params.reference || this.generateReference(),
            currency: params.currency || 'NGN',
            metadata: params.metadata,
        });

        return response.data;
    }

    /**
     * List transactions
     */
    async listTransactions(params?: {
        perPage?: number;
        page?: number;
        customer?: number;
        status?: 'success' | 'failed' | 'abandoned';
        from?: string;
        to?: string;
    }) {
        const response = await this.client.get('/transaction', { params });
        return response.data;
    }

    /**
     * Refund a transaction
     */
    async refundTransaction(params: {
        transaction: string | number; // Transaction ID or reference
        amount?: number; // Partial refund amount in kobo
        currency?: Currency;
        customer_note?: string;
        merchant_note?: string;
    }) {
        const response = await this.client.post('/refund', params);
        return response.data;
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const crypto = require('crypto');
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(payload)
            .digest('hex');

        return hash === signature;
    }

    /**
     * Generate a unique transaction reference
     */
    private generateReference(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `MB-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Convert amount to kobo (smallest currency unit)
     */
    static toKobo(amount: number): number {
        return Math.round(amount * 100);
    }

    /**
     * Convert kobo to naira
     */
    static fromKobo(kobo: number): number {
        return kobo / 100;
    }
}

// ============================================
// CUSTOM ERROR CLASS
// ============================================

export class PaystackError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public data?: any
    ) {
        super(message);
        this.name = 'PaystackError';
    }
}

// ============================================
// WEBHOOK HANDLER
// ============================================

import { supabaseAdmin } from '@/lib/supabase/admin';

export class PaystackWebhookHandler {
    /**
     * Handle incoming webhook events
     */
    static async handleEvent(event: PaystackWebhookEvent): Promise<void> {
        console.log(`Processing Paystack webhook: ${event.event}`);

        switch (event.event) {
            case 'charge.success':
                await this.handleChargeSuccess(event);
                break;

            case 'charge.failed':
                await this.handleChargeFailed(event);
                break;

            case 'subscription.create':
                await this.handleSubscriptionCreate(event);
                break;

            case 'subscription.disable':
                await this.handleSubscriptionDisable(event);
                break;

            default:
                console.warn(`Unhandled Paystack event: ${event.event}`);
        }
    }

    private static async handleChargeSuccess(event: PaystackWebhookEvent): Promise<void> {
        const { reference, amount, customer, metadata, id } = event.data;
        const normalizedAmount = amount / 100;

        console.log(`Processing charge.success: ${reference} (₦${normalizedAmount})`);

        try {
            // ── 1. SUBSCRIPTION PAYMENT ──────────────────────────────────────
            if (reference.startsWith('SUB-')) {
                const planId = metadata?.plan_id;
                const userId = metadata?.user_id;

                if (!userId) {
                    console.error('No user_id in subscription metadata');
                    return;
                }

                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        current_period_start: new Date().toISOString(),
                        metadata: { ...metadata, paystack_id: id, last_payment_ref: reference }
                    })
                    .eq('user_id', userId);

                await supabaseAdmin
                    .from('users')
                    .update({ subscription_status: 'active', subscription_plan_id: planId })
                    .eq('id', userId);

                // Record payment
                await supabaseAdmin.from('payments').insert({
                    processor: 'paystack',
                    processor_reference: reference,
                    amount: normalizedAmount,
                    status: 'successful',
                    processor_response: event.data,
                    metadata,
                });
            }

            // ── 2. MARKETPLACE SALE ────────────────────────────────────────
            else if (reference.startsWith('TXNL-')) {
                const listingId = metadata?.listing_id;
                const buyerId = metadata?.buyer_id;
                const sellerId = metadata?.seller_id;
                const commissionRate = metadata?.platform_commission_percent || 5.3;

                if (!listingId) {
                    console.error('TXNL- payment missing listing_id in metadata');
                    return;
                }

                const amountTotal = amount / 100;
                const amountPlatform = (amountTotal * commissionRate) / 100;
                const amountSeller = amountTotal - amountPlatform;

                // Mark listing as sold
                await supabaseAdmin
                    .from('listings')
                    .update({ status: 'sold', current_offered_price: null, updated_at: new Date().toISOString() })
                    .eq('id', listingId);

                // ✅ FIX: Create order record (was NEVER being created before)
                const { data: orderData, error: orderError } = await supabaseAdmin
                    .from('orders')
                    .insert({
                        listing_id: listingId,
                        buyer_id: buyerId,
                        seller_id: sellerId,
                        amount: amountTotal,
                        status: 'confirmed',
                        payment_reference: reference,
                        payment_status: 'paid',
                        created_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (orderError) console.error('Error creating order:', orderError);
                else console.log(`Order created: ${orderData?.id}`);

                // Record sale transaction
                await supabaseAdmin.from('sales_transactions').insert({
                    paystack_reference: reference,
                    listing_id: listingId,
                    buyer_id: buyerId,
                    seller_id: sellerId,
                    amount_total: amountTotal,
                    amount_seller: amountSeller,
                    amount_platform: amountPlatform,
                    commission_rate: commissionRate,
                    status: 'success',
                    metadata: event.data,
                });

                // MarketCoins: deduct used coins from buyer
                const coinsUsed = metadata?.coins_used || 0;
                if (coinsUsed > 0 && buyerId) {
                    await supabaseAdmin.rpc('subtract_coins', {
                        user_id: buyerId,
                        amount_to_subtract: coinsUsed,
                        trans_type: 'redeem_discount',
                        trans_desc: `Redeemed for listing ${listingId}`
                    }).then(({ error }) => { if (error) console.error('Coin deduct error:', error); });
                }

                // MarketCoins: award buyer coins (1 coin per ₦100 spent)
                const buyerEarned = Math.floor(amountTotal / 100);
                if (buyerEarned > 0 && buyerId) {
                    await supabaseAdmin.rpc('add_coins', {
                        user_id: buyerId,
                        amount_to_add: buyerEarned,
                        trans_type: 'earn_purchase',
                        trans_desc: `Earned from purchase of listing ${listingId}`
                    }).then(({ error }) => { if (error) console.error('Buyer coin earn error:', error); });
                }

                // MarketCoins: award seller coins (1 coin per ₦200 earned)
                const sellerEarned = Math.floor(amountSeller / 200);
                if (sellerEarned > 0 && sellerId) {
                    await supabaseAdmin.rpc('add_coins', {
                        user_id: sellerId,
                        amount_to_add: sellerEarned,
                        trans_type: 'earn_sale',
                        trans_desc: `Earned from sale of ${listingId}`
                    }).then(({ error }) => { if (error) console.error('Seller coin earn error:', error); });
                }

                // Close accepted offers for this listing
                if (buyerId) {
                    await supabaseAdmin
                        .from('offers')
                        .update({ status: 'completed' })
                        .eq('listing_id', listingId)
                        .eq('buyer_id', buyerId)
                        .eq('status', 'accepted');
                }

                // Record payment
                await supabaseAdmin.from('payments').insert({
                    processor: 'paystack',
                    processor_reference: reference,
                    amount: normalizedAmount,
                    status: 'successful',
                    processor_response: event.data,
                    metadata,
                });
            }

            // ── 3. LISTING BOOST (AD) PAYMENT ────────────────────────────
            else if (reference.startsWith('BOOST-')) {
                const listingId = metadata?.listing_id;
                const sellerId = metadata?.seller_id;
                const tier = metadata?.tier as 'basic' | 'featured' | 'premium';
                const durationDays = metadata?.duration_days || 3;
                const coinsReward = metadata?.coins_reward || 10;

                if (!listingId || !tier) {
                    console.error('BOOST- payment missing listing_id or tier in metadata');
                    return;
                }

                const sponsoredFrom = new Date();
                const sponsoredUntil = new Date(sponsoredFrom);
                sponsoredUntil.setDate(sponsoredUntil.getDate() + durationDays);

                // Activate sponsorship on listing
                await supabaseAdmin
                    .from('listings')
                    .update({
                        is_sponsored: true,
                        sponsored_tier: tier,
                        sponsored_until: sponsoredUntil.toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', listingId);

                // Update ad_payments record to active
                await supabaseAdmin
                    .from('ad_payments')
                    .update({
                        status: 'active',
                        sponsored_from: sponsoredFrom.toISOString(),
                        sponsored_until: sponsoredUntil.toISOString(),
                    })
                    .eq('paystack_reference', reference);

                // Award MarketCoins bonus to seller
                if (coinsReward > 0 && sellerId) {
                    await supabaseAdmin.rpc('add_coins', {
                        user_id: sellerId,
                        amount_to_add: coinsReward,
                        trans_type: 'earn_boost',
                        trans_desc: `Bonus for boosting listing ${listingId} (${tier})`
                    }).then(({ error }) => { if (error) console.error('Boost coins error:', error); });
                }

                console.log(`Listing ${listingId} boosted (${tier}) until ${sponsoredUntil.toLocaleDateString()}`);

                // Record payment
                await supabaseAdmin.from('payments').insert({
                    processor: 'paystack',
                    processor_reference: reference,
                    amount: normalizedAmount,
                    status: 'successful',
                    processor_response: event.data,
                    metadata,
                });
            }

            // ── 4. UNKNOWN PAYMENT TYPE ──────────────────────────────────
            else {
                console.warn(`Unknown charge reference prefix: ${reference}`);
                // Still record it for audit purposes
                await supabaseAdmin.from('payments').insert({
                    processor: 'paystack',
                    processor_reference: reference,
                    amount: normalizedAmount,
                    status: 'successful',
                    processor_response: event.data,
                    metadata,
                });
            }

        } catch (err) {
            console.error('Critical error in Paystack Webhook Handler:', err);
        }
    }

    private static async handleChargeFailed(event: PaystackWebhookEvent): Promise<void> {
        const { reference } = event.data;
        console.warn('Payment failed:', reference);

        await supabaseAdmin
            .from('payments')
            .update({ status: 'failed', processor_response: event.data })
            .eq('processor_reference', reference);
    }

    private static async handleSubscriptionCreate(event: PaystackWebhookEvent): Promise<void> {
        console.log('Automated subscription record created on Paystack');
    }

    private static async handleSubscriptionDisable(event: PaystackWebhookEvent): Promise<void> {
        console.log('Subscription disabled on Paystack');
        // Logic to deactivate user in Supabase
    }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const paystackClient = new PaystackClient();

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: Currency = 'NGN'): string {
    const formatter = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return formatter.format(amount);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Generate customer code from email
 */
export function generateCustomerCode(email: string): string {
    const crypto = require('crypto');
    return crypto
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();
}

/**
 * Calculate proration for plan upgrades
 */
export function calculateProration(params: {
    currentPlanPrice: number;
    newPlanPrice: number;
    daysRemaining: number;
    totalDaysInPeriod: number;
}): number {
    const { currentPlanPrice, newPlanPrice, daysRemaining, totalDaysInPeriod } = params;

    // Calculate unused value of current plan
    const unusedValue = (currentPlanPrice / totalDaysInPeriod) * daysRemaining;

    // Calculate cost of new plan for remaining period
    const newPlanCost = (newPlanPrice / totalDaysInPeriod) * daysRemaining;

    // Return the difference (amount to charge)
    return Math.max(0, newPlanCost - unusedValue);
}

/**
 * Get next billing date
 */
export function getNextBillingDate(
    currentDate: Date,
    interval: 'monthly' | 'annually'
): Date {
    const nextDate = new Date(currentDate);

    if (interval === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate;
}

/**
 * Check if card is expired
 */
export function isCardExpired(expMonth: number, expYear: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    if (expYear < currentYear) {
        return true;
    }

    if (expYear === currentYear && expMonth < currentMonth) {
        return true;
    }

    return false;
}

// ============================================
// EXPORT PUBLIC KEY FOR CLIENT-SIDE
// ============================================

export const PAYSTACK_PUBLIC_KEY_CLIENT = PAYSTACK_PUBLIC_KEY;
