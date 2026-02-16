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

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.warn('PAYSTACK_SECRET_KEY is missing. Paystack features will be disabled.');
}

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
        amount: number; // In kobo (smallest currency unit)
        currency?: Currency;
        reference?: string;
        callback_url?: string;
        metadata?: Record<string, any>;
        channels?: string[];
        plan?: string;
    }): Promise<PaystackInitializeResponse> {
        const response = await this.client.post<PaystackInitializeResponse>(
            '/transaction/initialize',
            {
                email: params.email,
                amount: params.amount,
                currency: params.currency || 'NGN',
                reference: params.reference || this.generateReference(),
                callback_url: params.callback_url,
                metadata: params.metadata,
                channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
                plan: params.plan,
            }
        );

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

        console.log(`Verifying charge: ${reference} (${normalizedAmount} NGN)`);

        try {
            // 1. Is it a subscription?
            if (reference.startsWith('SUB-')) {
                const planId = metadata?.plan_id;
                const userId = metadata?.user_id;

                if (!userId) {
                    console.error('No user_id in subscription metadata');
                    return;
                }

                // Activate Subscription
                const { error: subError } = await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        current_period_start: new Date().toISOString(),
                        metadata: {
                            ...metadata,
                            paystack_id: id,
                            last_payment_ref: reference
                        }
                    })
                    .eq('user_id', userId);

                if (subError) console.error('Error updating subscription:', subError);

                // Update User Profile
                await supabaseAdmin
                    .from('users')
                    .update({
                        subscription_status: 'active',
                        subscription_plan_id: planId
                    })
                    .eq('id', userId);
            }
            // 2. Is it a product order?
            else if (reference.startsWith('TX-')) {
                const { error: orderError } = await supabaseAdmin
                    .from('orders')
                    .update({
                        status: 'paid',
                        payment_id: id.toString(),
                        payment_metadata: event.data,
                        updated_at: new Date().toISOString()
                    })
                    .eq('transaction_ref', reference);

                if (orderError) console.error('Error updating order:', orderError);
            }

            // 3. Record Payment
            await supabaseAdmin
                .from('payments')
                .insert({
                    processor: 'paystack',
                    processor_reference: reference,
                    amount: normalizedAmount,
                    status: 'successful',
                    processor_response: event.data,
                    metadata: metadata
                });

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
