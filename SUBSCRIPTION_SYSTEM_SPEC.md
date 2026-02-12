# MarketBridge Subscription & Payment System
**Complete Implementation Specification**  
**Date:** 2026-02-13  
**Status:** 🚧 IN DEVELOPMENT

---

## 📋 System Overview

### Core Objectives
1. **Native Checkout Experience** - Users never leave MarketBridge
2. **PCI-DSS Compliance** - Tokenized payment handling via certified processors
3. **Subscription Management** - Full lifecycle control (create, upgrade, cancel, renew)
4. **Multi-Processor Support** - Paystack (primary), Flutterwave (fallback), Stripe (international)
5. **NDPR Compliance** - Nigerian Data Protection Regulation adherence

### Target Users
- **Student Sellers** (`student_seller` role)
- **Dealers** (`dealer` role)
- **Future:** Campus organizations, bulk buyers

---

## 🎯 Subscription Plans

### Plan Tiers

#### 1. **FREE TIER** (Default)
- **Price:** ₦0/month
- **Features:**
  - List up to 3 items
  - Basic chat support
  - 7-day listing duration
  - Standard visibility
- **Status:** `free`

#### 2. **CAMPUS STARTER** 
- **Price:** ₦2,500/month
- **Features:**
  - List up to 15 items
  - Priority chat support
  - 30-day listing duration
  - Enhanced visibility
  - Basic analytics
  - Verification badge
- **Status:** `campus_starter`

#### 3. **CAMPUS PRO**
- **Price:** ₦5,000/month
- **Features:**
  - Unlimited listings
  - 24/7 priority support
  - 90-day listing duration
  - Premium visibility (top of search)
  - Advanced analytics & insights
  - Featured merchant badge
  - Custom business page
  - Bulk upload tools
- **Status:** `campus_pro`

#### 4. **ENTERPRISE** (Custom)
- **Price:** Custom pricing
- **Features:**
  - All Campus Pro features
  - Dedicated account manager
  - API access
  - White-label options
  - Custom integrations
- **Status:** `enterprise`

---

## 🏗️ Technical Architecture

### Database Schema

#### **subscriptions** table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- 'free', 'campus_starter', 'campus_pro', 'enterprise'
    status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due', 'trialing', 'paused'
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    trial_end TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### **payments** table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT NOT NULL, -- 'pending', 'successful', 'failed', 'refunded'
    processor TEXT NOT NULL, -- 'paystack', 'flutterwave', 'stripe'
    processor_reference TEXT UNIQUE NOT NULL,
    processor_response JSONB DEFAULT '{}',
    payment_method TEXT, -- 'card', 'bank_transfer', 'ussd'
    card_last4 TEXT,
    card_brand TEXT,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_processor_reference ON payments(processor_reference);
CREATE INDEX idx_payments_status ON payments(status);
```

#### **invoices** table
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
```

#### **payment_methods** table
```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    processor TEXT NOT NULL,
    processor_token TEXT NOT NULL, -- Tokenized reference
    type TEXT NOT NULL, -- 'card', 'bank_account'
    card_last4 TEXT,
    card_brand TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    bank_name TEXT,
    account_last4 TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
```

---

## 🔐 Payment Processor Integration

### Paystack (Primary - Nigeria)

#### Configuration
```typescript
// lib/payment/paystack.ts
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const paystackClient = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});
```

#### Key Features
- ✅ Naira (NGN) support
- ✅ 3D Secure authentication
- ✅ Recurring billing
- ✅ Webhook notifications
- ✅ Card tokenization
- ✅ Bank transfer support

### Flutterwave (Fallback)

#### Configuration
```typescript
// lib/payment/flutterwave.ts
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!;
const FLW_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY!;
```

#### Key Features
- ✅ Multi-currency support
- ✅ Advanced fraud detection
- ✅ USSD payments
- ✅ Mobile money integration

---

## 🎨 UI/UX Implementation

### 1. Plan Selection Page (`/pricing`)
**Route:** `/app/(main)/pricing/page.tsx`

**Features:**
- Side-by-side plan comparison
- Feature checklist per tier
- "Current Plan" indicator
- "Upgrade" / "Downgrade" CTAs
- Annual vs Monthly toggle (10% discount for annual)
- FAQ section

### 2. Checkout Flow (`/checkout/subscription`)
**Route:** `/app/(main)/checkout/subscription/page.tsx`

**Steps:**
1. **Plan Confirmation**
   - Display selected plan
   - Show pricing breakdown
   - Apply promo codes
   
2. **Payment Method Selection**
   - Saved cards (if any)
   - Add new card (tokenized form)
   - Bank transfer option
   - USSD option

3. **Billing Information**
   - Name on card
   - Email for receipt
   - Billing address (optional)

4. **Review & Confirm**
   - Order summary
   - Terms acceptance
   - Secure payment indicators

5. **Processing**
   - Loading state with progress
   - 3D Secure redirect (if required)
   - Success/failure feedback

### 3. Subscription Dashboard (`/settings/subscription`)
**Route:** `/app/(main)/settings/subscription/page.tsx`

**Sections:**
- **Current Plan Card**
  - Plan name & price
  - Renewal date
  - Usage metrics (listings used/limit)
  - Upgrade/Downgrade buttons

- **Billing History**
  - Table of past invoices
  - Download PDF buttons
  - Payment status indicators

- **Payment Methods**
  - Saved cards list
  - Add/Remove cards
  - Set default payment method

- **Subscription Actions**
  - Cancel subscription
  - Pause subscription
  - Reactivate subscription

---

## 🔄 Payment Flow Sequence

### Subscription Creation Flow

```
1. User selects plan on /pricing
   ↓
2. Frontend: POST /api/subscriptions/create
   {
     plan_id: 'campus_starter',
     billing_cycle: 'monthly'
   }
   ↓
3. Backend:
   - Validate user eligibility
   - Create subscription record (status: 'pending')
   - Generate checkout session
   - Return session_id & client_secret
   ↓
4. Frontend: Redirect to /checkout/subscription?session=<session_id>
   ↓
5. User enters payment details (tokenized via Paystack SDK)
   ↓
6. Frontend: POST /api/subscriptions/confirm
   {
     session_id: '<session_id>',
     payment_token: '<processor_token>'
   }
   ↓
7. Backend:
   - Initialize payment with processor
   - Create payment record
   - Wait for processor callback
   ↓
8. Processor Webhook: POST /api/webhooks/paystack
   {
     event: 'charge.success',
     data: { reference: '<ref>', status: 'success' }
   }
   ↓
9. Backend:
   - Verify webhook signature
   - Update payment status
   - Activate subscription
   - Update user subscription_status
   - Send confirmation email
   ↓
10. Frontend: Redirect to /settings/subscription?success=true
```

---

## 🔒 Security Implementation

### 1. PCI-DSS Compliance Strategy

**Tokenization Approach:**
- ✅ Never store raw card numbers
- ✅ Use processor SDKs for card input
- ✅ Store only processor-generated tokens
- ✅ Implement CSP headers to prevent XSS

**Example: Paystack Inline Integration**
```typescript
// components/PaymentForm.tsx
import { PaystackButton } from 'react-paystack';

const PaymentForm = ({ amount, email, onSuccess }) => {
    const config = {
        reference: generateReference(),
        email,
        amount: amount * 100, // Convert to kobo
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            custom_fields: [
                {
                    display_name: "Subscription Plan",
                    variable_name: "plan_id",
                    value: "campus_starter"
                }
            ]
        }
    };

    return (
        <PaystackButton
            {...config}
            onSuccess={onSuccess}
            onClose={() => console.log('Payment closed')}
            className="paystack-button"
        />
    );
};
```

### 2. Webhook Security

**Signature Verification:**
```typescript
// app/api/webhooks/paystack/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    
    // Verify signature
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
        .update(body)
        .digest('hex');
    
    if (hash !== signature) {
        return new Response('Invalid signature', { status: 401 });
    }
    
    const event = JSON.parse(body);
    
    // Process event
    await handlePaystackEvent(event);
    
    return new Response('OK', { status: 200 });
}
```

### 3. Rate Limiting

```typescript
// middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
});

export async function rateLimitMiddleware(identifier: string) {
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
    
    if (!success) {
        throw new Error('Rate limit exceeded');
    }
    
    return { limit, reset, remaining };
}
```

---

## 📧 Notification System

### Email Templates

#### 1. Subscription Activated
```
Subject: Welcome to MarketBridge Campus Pro! 🎉

Your subscription is now active.
Plan: Campus Pro
Next billing: March 13, 2026
Amount: ₦5,000

[Manage Subscription] [View Invoice]
```

#### 2. Payment Failed
```
Subject: Payment Failed - Action Required

We couldn't process your payment for MarketBridge.
Reason: Insufficient funds

Your subscription will be paused in 3 days.

[Update Payment Method] [Contact Support]
```

#### 3. Subscription Cancelled
```
Subject: Subscription Cancelled

Your Campus Pro subscription has been cancelled.
Access until: March 13, 2026

We'd love to have you back!

[Reactivate Subscription] [Give Feedback]
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/subscriptions/create.test.ts
describe('Subscription Creation', () => {
    it('should create a pending subscription', async () => {
        const result = await createSubscription({
            userId: 'test-user-id',
            planId: 'campus_starter'
        });
        
        expect(result.status).toBe('pending');
        expect(result.plan_id).toBe('campus_starter');
    });
    
    it('should reject invalid plan IDs', async () => {
        await expect(
            createSubscription({
                userId: 'test-user-id',
                planId: 'invalid_plan'
            })
        ).rejects.toThrow('Invalid plan ID');
    });
});
```

### Integration Tests
```typescript
// __tests__/integration/payment-flow.test.ts
describe('End-to-End Payment Flow', () => {
    it('should complete subscription payment', async () => {
        // 1. Create subscription
        const subscription = await createSubscription({
            userId: testUser.id,
            planId: 'campus_starter'
        });
        
        // 2. Simulate payment
        const payment = await simulatePaystackPayment({
            reference: subscription.payment_reference,
            amount: 2500
        });
        
        // 3. Trigger webhook
        await triggerWebhook({
            event: 'charge.success',
            data: payment
        });
        
        // 4. Verify subscription activated
        const updated = await getSubscription(subscription.id);
        expect(updated.status).toBe('active');
    });
});
```

---

## 📊 Analytics & Monitoring

### Key Metrics Dashboard

1. **Revenue Metrics**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - ARPU (Average Revenue Per User)
   - Churn rate

2. **Subscription Metrics**
   - Active subscriptions by plan
   - New subscriptions (daily/weekly/monthly)
   - Cancellations
   - Upgrades/Downgrades

3. **Payment Metrics**
   - Success rate
   - Failed payments
   - Average transaction value
   - Processor performance comparison

### Monitoring Tools
- **Sentry** - Error tracking
- **LogRocket** - Session replay for payment issues
- **Datadog** - Infrastructure monitoring
- **Mixpanel** - User behavior analytics

---

## 🚀 Deployment Checklist

### Environment Variables
```env
# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxx

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Webhook URLs
PAYSTACK_WEBHOOK_URL=https://marketbridge.ng/api/webhooks/paystack
FLUTTERWAVE_WEBHOOK_URL=https://marketbridge.ng/api/webhooks/flutterwave

# Email
SENDGRID_API_KEY=SG.xxx
SUBSCRIPTION_EMAIL_FROM=billing@marketbridge.ng
```

### Pre-Launch Checklist
- [ ] Database migrations executed
- [ ] Webhook endpoints configured in processor dashboards
- [ ] SSL certificates valid
- [ ] Rate limiting configured
- [ ] Email templates tested
- [ ] Payment processor sandbox testing complete
- [ ] Security audit passed
- [ ] NDPR compliance verified
- [ ] Error monitoring active
- [ ] Backup strategy implemented

---

## 📖 API Documentation

### Endpoints

#### `POST /api/subscriptions/create`
Create a new subscription.

**Request:**
```json
{
  "plan_id": "campus_starter",
  "billing_cycle": "monthly",
  "promo_code": "LAUNCH2026"
}
```

**Response:**
```json
{
  "subscription_id": "sub_xxx",
  "session_id": "sess_xxx",
  "client_secret": "cs_xxx",
  "amount": 2500,
  "currency": "NGN"
}
```

#### `POST /api/subscriptions/confirm`
Confirm payment and activate subscription.

#### `GET /api/subscriptions/current`
Get user's current subscription.

#### `POST /api/subscriptions/cancel`
Cancel subscription (effective at period end).

#### `POST /api/subscriptions/upgrade`
Upgrade to higher tier (prorated).

#### `GET /api/invoices`
List user's invoices.

#### `GET /api/invoices/:id/pdf`
Download invoice PDF.

---

## 🎯 Success Criteria

### Phase 1 (MVP) - Week 1-2
- [ ] Database schema implemented
- [ ] Paystack integration complete
- [ ] Basic checkout flow working
- [ ] Subscription activation functional

### Phase 2 (Core Features) - Week 3-4
- [ ] Subscription management dashboard
- [ ] Invoice generation
- [ ] Email notifications
- [ ] Payment method management

### Phase 3 (Advanced) - Week 5-6
- [ ] Flutterwave fallback
- [ ] Promo codes
- [ ] Usage-based billing
- [ ] Analytics dashboard

### Phase 4 (Polish) - Week 7-8
- [ ] Security audit
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation complete

---

**Next Steps:** Begin implementation with database schema and Paystack integration.
