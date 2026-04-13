// MarketBridge Subscription & Payment System Types
// Date: 2026-02-13

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionPlanId = 'basic' | 'standard' | 'pro' | 'beta_campus_founder';

export type SubscriptionStatus =
    | 'active'      // Subscription is active and paid
    | 'cancelled'   // Subscription cancelled, access until period end
    | 'past_due'    // Payment failed, grace period
    | 'trialing'    // In trial period (Automated system)
    | 'trial'       // In trial period (Legacy/Manual)
    | 'paused'      // Temporarily paused by user
    | 'expired'     // Subscription has expired
    | 'inactive'    // Subscription is inactive
    | 'pending'     // Awaiting first payment
    | 'pending_payment' // Awaiting payment
    | 'pending_verification'; // Awaiting verification

export type BillingCycle = 'monthly' | 'annual';

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: SubscriptionPlanId;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    cancelled_at: string | null;
    trial_end: string | null;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionPlan {
    id: SubscriptionPlanId;
    name: string;
    description: string;
    price_monthly: number;
    price_annual: number;
    currency: string;
    features: string[];
    limits: SubscriptionLimits;
    is_active: boolean;
    sort_order: number;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionLimits {
    max_listings: number; // -1 for unlimited
    listing_duration_days: number;
    max_images_per_listing: number;
    priority_support?: boolean;
    featured_badge?: boolean;
    custom_features?: boolean;
}

export interface SubscriptionUsage {
    id: string;
    subscription_id: string;
    user_id: string;
    metric_name: string;
    metric_value: number;
    period_start: string;
    period_end: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentStatus =
    | 'pending'     // Payment initiated
    | 'successful'  // Payment completed
    | 'failed'      // Payment failed
    | 'refunded'    // Payment refunded
    | 'cancelled';  // Payment cancelled

export type PaymentProcessor = 'paystack' | 'flutterwave' | 'stripe' | 'manual';

export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' | 'manual';

export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface Payment {
    id: string;
    user_id: string;
    subscription_id: string | null;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    processor: PaymentProcessor;
    processor_reference: string;
    processor_response: Record<string, any>;
    payment_method: PaymentMethod | null;
    card_last4: string | null;
    card_brand: string | null;
    card_exp_month: number | null;
    card_exp_year: number | null;
    failure_reason: string | null;
    refunded_at: string | null;
    refund_reason: string | null;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethodRecord {
    id: string;
    user_id: string;
    processor: PaymentProcessor;
    processor_token: string;
    processor_customer_id: string | null;
    type: 'card' | 'bank_account';
    card_last4: string | null;
    card_brand: string | null;
    card_exp_month: number | null;
    card_exp_year: number | null;
    bank_name: string | null;
    account_last4: string | null;
    is_default: boolean;
    is_active: boolean;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// ============================================
// INVOICE TYPES
// ============================================

export type InvoiceStatus =
    | 'draft'         // Invoice created but not finalized
    | 'open'          // Invoice sent, awaiting payment
    | 'paid'          // Invoice paid
    | 'void'          // Invoice cancelled
    | 'uncollectible'; // Invoice marked as uncollectible

export interface Invoice {
    id: string;
    user_id: string;
    subscription_id: string | null;
    payment_id: string | null;
    invoice_number: string;
    amount: number;
    tax_amount: number;
    total_amount: number;
    currency: Currency;
    status: InvoiceStatus;
    due_date: string | null;
    paid_at: string | null;
    pdf_url: string | null;
    line_items: InvoiceLineItem[];
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    metadata?: Record<string, any>;
}

// ============================================
// PROMO CODE TYPES
// ============================================

export type DiscountType = 'percentage' | 'fixed_amount';

export interface PromoCode {
    id: string;
    code: string;
    description: string | null;
    discount_type: DiscountType;
    discount_value: number;
    currency: Currency;
    applicable_plans: SubscriptionPlanId[];
    max_uses: number | null;
    current_uses: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface WebhookEvent {
    id: string;
    processor: PaymentProcessor;
    event_type: string;
    event_id: string;
    payload: Record<string, any>;
    processed: boolean;
    processed_at: string | null;
    error_message: string | null;
    retry_count: number;
    created_at: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateSubscriptionRequest {
    plan_id: SubscriptionPlanId;
    billing_cycle: BillingCycle;
    promo_code?: string;
    payment_method_id?: string;
}

export interface CreateSubscriptionResponse {
    subscription_id: string;
    session_id: string;
    client_secret: string;
    amount: number;
    currency: Currency;
    processor: PaymentProcessor;
    checkout_url?: string;
}

export interface ConfirmSubscriptionRequest {
    session_id: string;
    payment_token?: string;
    payment_method_id?: string;
}

export interface ConfirmSubscriptionResponse {
    success: boolean;
    subscription_id: string;
    status: SubscriptionStatus;
    message: string;
}

export interface CancelSubscriptionRequest {
    subscription_id: string;
    cancel_immediately?: boolean;
    reason?: string;
}

export interface UpgradeSubscriptionRequest {
    subscription_id: string;
    new_plan_id: SubscriptionPlanId;
    billing_cycle?: BillingCycle;
}

export interface ApplyPromoCodeRequest {
    promo_code: string;
    plan_id: SubscriptionPlanId;
}

export interface ApplyPromoCodeResponse {
    valid: boolean;
    discount_amount: number;
    final_amount: number;
    message?: string;
}

// ============================================
// PAYMENT PROCESSOR SPECIFIC TYPES
// ============================================

// Paystack Types
export interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: 'success' | 'failed' | 'abandoned';
        reference: string;
        amount: number;
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: Record<string, any>;
        fees: number;
        customer: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: Record<string, any>;
        };
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
            account_name: string | null;
        };
    };
}

export interface PaystackWebhookEvent {
    event: string;
    data: {
        id: number;
        domain: string;
        status: string;
        reference: string;
        amount: number;
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: Record<string, any>;
        customer: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            customer_code: string;
        };
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
        };
    };
}

// Flutterwave Types
export interface FlutterwaveInitializeResponse {
    status: string;
    message: string;
    data: {
        link: string;
    };
}

export interface FlutterwaveVerifyResponse {
    status: string;
    message: string;
    data: {
        id: number;
        tx_ref: string;
        flw_ref: string;
        device_fingerprint: string;
        amount: number;
        currency: string;
        charged_amount: number;
        app_fee: number;
        merchant_fee: number;
        processor_response: string;
        auth_model: string;
        ip: string;
        narration: string;
        status: 'successful' | 'failed';
        payment_type: string;
        created_at: string;
        account_id: number;
        customer: {
            id: number;
            name: string;
            phone_number: string;
            email: string;
            created_at: string;
        };
        card: {
            first_6digits: string;
            last_4digits: string;
            issuer: string;
            country: string;
            type: string;
            token: string;
            expiry: string;
        };
    };
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface ApiError {
    error: string;
    message: string;
    code?: string;
    details?: Record<string, any>;
}

export interface SubscriptionMetrics {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    arpu: number; // Average Revenue Per User
    churn_rate: number;
    active_subscriptions: number;
    new_subscriptions_this_month: number;
    cancellations_this_month: number;
    upgrades_this_month: number;
    downgrades_this_month: number;
}

export interface PaymentMetrics {
    total_revenue: number;
    successful_payments: number;
    failed_payments: number;
    success_rate: number;
    average_transaction_value: number;
    refunds: number;
    refund_amount: number;
}

// ============================================
// CHECKOUT SESSION TYPES
// ============================================

export interface CheckoutSession {
    id: string;
    user_id: string;
    plan_id: SubscriptionPlanId;
    billing_cycle: BillingCycle;
    amount: number;
    currency: Currency;
    promo_code: string | null;
    discount_amount: number;
    final_amount: number;
    processor: PaymentProcessor;
    processor_session_id: string;
    status: 'pending' | 'completed' | 'expired' | 'cancelled';
    expires_at: string;
    metadata: Record<string, any>;
    created_at: string;
}

// ============================================
// SUBSCRIPTION FEATURE FLAGS
// ============================================

export interface SubscriptionFeatures {
    canCreateListing: boolean;
    canUploadImages: boolean;
    canAccessAnalytics: boolean;
    canUsePrioritySupport: boolean;
    canCustomizePage: boolean;
    canBulkUpload: boolean;
    canUseAPI: boolean;
    maxListings: number;
    maxImagesPerListing: number;
    listingDurationDays: number;
    hasFeaturedBadge: boolean;
    hasVerificationBadge: boolean;
}

// ============================================
// BILLING HISTORY TYPES
// ============================================

export interface BillingHistoryItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    invoice_url: string | null;
    payment_method: string;
}


