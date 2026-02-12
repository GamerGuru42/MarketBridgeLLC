# MarketBridge Subscription System - Implementation Roadmap
**Phase 1 Complete ✅ | Next Steps for Full Deployment**  
**Date:** 2026-02-13  
**Commit:** `64f2f98`

---

## ✅ Phase 1: Foundation (COMPLETED)

### What Was Built

#### 1. **Database Architecture** ✅
- ✅ Created 8 core tables with proper constraints and indexes
- ✅ Implemented Row Level Security (RLS) policies
- ✅ Added subscription plans reference data (Free, Campus Starter, Campus Pro, Enterprise)
- ✅ Created helper functions (invoice number generation, updated_at triggers)
- ✅ Set up webhook event logging infrastructure

**Files Created:**
- `supabase/migrations/20260213_subscription_system.sql`

#### 2. **Type System** ✅
- ✅ Comprehensive TypeScript interfaces for all entities
- ✅ Payment processor-specific types (Paystack, Flutterwave, Stripe)
- ✅ API request/response types
- ✅ Utility types for pagination, errors, metrics

**Files Created:**
- `types/subscription.ts`

#### 3. **Payment Integration** ✅
- ✅ Paystack client library with full API coverage
- ✅ PCI-compliant tokenization approach
- ✅ Webhook signature verification
- ✅ Error handling and retry logic
- ✅ Utility functions (proration, date calculations, formatting)

**Files Created:**
- `lib/payment/paystack.ts`

#### 4. **UI Components** ✅
- ✅ Dynamic pricing page with Supabase integration
- ✅ Annual/monthly billing toggle
- ✅ Current plan detection
- ✅ Savings calculation display
- ✅ FAQ section
- ✅ Features comparison

**Files Modified:**
- `app/(main)/pricing/page.tsx`

#### 5. **Documentation** ✅
- ✅ Complete technical specification
- ✅ Database schema documentation
- ✅ API endpoint specifications
- ✅ Security requirements
- ✅ Testing strategy

**Files Created:**
- `SUBSCRIPTION_SYSTEM_SPEC.md`

---

## 🚧 Phase 2: Core Checkout Flow (NEXT - Week 1)

### Priority Tasks

#### 1. **Checkout Page** 🎯 HIGH PRIORITY
**Route:** `app/(main)/checkout/subscription/page.tsx`

**Requirements:**
- [ ] Plan confirmation display
- [ ] Payment method selection (saved cards + new card)
- [ ] Paystack inline integration
- [ ] 3D Secure handling
- [ ] Loading states and error handling
- [ ] Success/failure redirects

**Implementation:**
```tsx
// Key features:
- Fetch session from query params
- Display plan details and pricing
- Integrate PaystackButton component
- Handle payment callbacks
- Create subscription on success
```

#### 2. **API Routes** 🎯 HIGH PRIORITY

**a. Create Subscription**  
**Route:** `app/api/subscriptions/create/route.ts`

**Responsibilities:**
- [ ] Validate user authentication
- [ ] Check plan eligibility
- [ ] Apply promo codes (if any)
- [ ] Create pending subscription record
- [ ] Initialize Paystack transaction
- [ ] Return checkout session data

**b. Confirm Subscription**  
**Route:** `app/api/subscriptions/confirm/route.ts`

**Responsibilities:**
- [ ] Verify payment with Paystack
- [ ] Activate subscription
- [ ] Update user subscription_status
- [ ] Create invoice record
- [ ] Send confirmation email

**c. Paystack Webhook**  
**Route:** `app/api/webhooks/paystack/route.ts`

**Responsibilities:**
- [ ] Verify webhook signature
- [ ] Parse event payload
- [ ] Handle charge.success event
- [ ] Handle charge.failed event
- [ ] Handle subscription events
- [ ] Log all events to webhook_events table

#### 3. **Email Notifications** 📧

**Templates Needed:**
- [ ] Subscription activated
- [ ] Payment successful
- [ ] Payment failed
- [ ] Subscription cancelled
- [ ] Invoice generated

**Implementation:**
- Use SendGrid or Resend
- Create email templates with MarketBridge branding
- Include invoice PDFs

---

## 🔄 Phase 3: Subscription Management (Week 2)

### Dashboard & Settings

#### 1. **Subscription Dashboard** 
**Route:** `app/(main)/settings/subscription/page.tsx`

**Features:**
- [ ] Current plan card with usage metrics
- [ ] Next billing date
- [ ] Billing history table
- [ ] Download invoice PDFs
- [ ] Payment methods management
- [ ] Cancel/pause subscription
- [ ] Upgrade/downgrade options

#### 2. **API Routes**

**a. Get Current Subscription**  
`GET /api/subscriptions/current`

**b. Cancel Subscription**  
`POST /api/subscriptions/cancel`

**c. Upgrade/Downgrade**  
`POST /api/subscriptions/upgrade`

**d. List Invoices**  
`GET /api/invoices`

**e. Download Invoice PDF**  
`GET /api/invoices/:id/pdf`

#### 3. **Payment Methods Management**

**Features:**
- [ ] List saved payment methods
- [ ] Add new card (tokenized)
- [ ] Remove card
- [ ] Set default payment method

---

## 🔐 Phase 4: Security & Compliance (Week 3)

### Security Hardening

#### 1. **Rate Limiting**
- [ ] Implement rate limiting on payment endpoints
- [ ] Use Upstash Redis or similar
- [ ] Set limits: 10 requests/minute for checkout

#### 2. **Webhook Security**
- [ ] Signature verification (already implemented)
- [ ] Replay attack prevention
- [ ] IP whitelisting for Paystack webhooks

#### 3. **Data Encryption**
- [ ] Ensure all payment data is encrypted at rest
- [ ] Use HTTPS for all endpoints
- [ ] Implement CSP headers

#### 4. **Compliance**
- [ ] NDPR compliance audit
- [ ] PCI DSS compliance verification
- [ ] Privacy policy updates
- [ ] Terms of service updates

---

## 📊 Phase 5: Analytics & Monitoring (Week 4)

### Metrics Dashboard

#### 1. **Revenue Metrics**
- [ ] MRR (Monthly Recurring Revenue)
- [ ] ARR (Annual Recurring Revenue)
- [ ] ARPU (Average Revenue Per User)
- [ ] Churn rate

#### 2. **Subscription Metrics**
- [ ] Active subscriptions by plan
- [ ] New subscriptions (daily/weekly/monthly)
- [ ] Cancellations
- [ ] Upgrades/Downgrades

#### 3. **Payment Metrics**
- [ ] Success rate
- [ ] Failed payments
- [ ] Average transaction value
- [ ] Refunds

#### 4. **Monitoring Tools**
- [ ] Sentry for error tracking
- [ ] LogRocket for session replay
- [ ] Datadog for infrastructure monitoring
- [ ] Mixpanel for user behavior analytics

---

## 🧪 Phase 6: Testing & QA (Week 5)

### Test Coverage

#### 1. **Unit Tests**
- [ ] Subscription creation logic
- [ ] Payment processing
- [ ] Proration calculations
- [ ] Promo code validation
- [ ] Invoice generation

#### 2. **Integration Tests**
- [ ] End-to-end payment flow
- [ ] Webhook handling
- [ ] Subscription lifecycle
- [ ] Email notifications

#### 3. **Security Tests**
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] SQL injection prevention
- [ ] API abuse prevention

#### 4. **Load Tests**
- [ ] Concurrent checkout sessions
- [ ] Webhook processing under load
- [ ] Database query performance

---

## 🚀 Phase 7: Deployment (Week 6)

### Pre-Launch Checklist

#### 1. **Database Migration**
- [ ] Run migration on production Supabase
- [ ] Verify all tables created
- [ ] Verify RLS policies active
- [ ] Seed subscription plans

#### 2. **Environment Variables**
```env
# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Flutterwave (Fallback)
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx

# Webhook URLs
PAYSTACK_WEBHOOK_URL=https://marketbridge.ng/api/webhooks/paystack

# Email
SENDGRID_API_KEY=SG.xxx
SUBSCRIPTION_EMAIL_FROM=billing@marketbridge.ng
```

#### 3. **Paystack Configuration**
- [ ] Create live API keys
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test webhook delivery
- [ ] Enable 3D Secure
- [ ] Set up settlement account

#### 4. **Monitoring Setup**
- [ ] Configure Sentry project
- [ ] Set up error alerts
- [ ] Configure uptime monitoring
- [ ] Set up payment failure alerts

#### 5. **Documentation**
- [ ] User guide for subscriptions
- [ ] FAQ updates
- [ ] Support team training
- [ ] Admin dashboard guide

---

## 🎯 Quick Start Guide for Next Session

### Immediate Next Steps (Start Here)

1. **Run Database Migration**
```bash
# Connect to Supabase and run the migration
psql -h <supabase-host> -U postgres -d postgres -f supabase/migrations/20260213_subscription_system.sql
```

2. **Create Checkout Page**
```bash
# Create the file
touch app/(main)/checkout/subscription/page.tsx
```

3. **Create API Routes**
```bash
# Create directory structure
mkdir -p app/api/subscriptions
mkdir -p app/api/webhooks

# Create route files
touch app/api/subscriptions/create/route.ts
touch app/api/subscriptions/confirm/route.ts
touch app/api/webhooks/paystack/route.ts
```

4. **Install Dependencies**
```bash
npm install react-paystack @upstash/ratelimit @upstash/redis
```

5. **Test Pricing Page**
- Navigate to `/pricing`
- Verify plans load from Supabase
- Test annual/monthly toggle
- Click "Upgrade Now" (should route to checkout)

---

## 📋 Implementation Priority Matrix

### Critical Path (Must Have for MVP)
1. ✅ Database schema
2. ✅ Type definitions
3. ✅ Paystack integration library
4. ✅ Pricing page
5. 🚧 Checkout page
6. 🚧 Create subscription API
7. 🚧 Confirm subscription API
8. 🚧 Paystack webhook handler
9. 🚧 Email notifications

### High Priority (Launch Week)
10. Subscription dashboard
11. Cancel subscription
12. Payment methods management
13. Invoice generation
14. Security hardening

### Medium Priority (Post-Launch)
15. Upgrade/downgrade flow
16. Promo codes
17. Analytics dashboard
18. Admin subscription management

### Low Priority (Future Enhancements)
19. Flutterwave fallback
20. Stripe international support
21. Usage-based billing
22. Custom enterprise plans

---

## 🐛 Known Issues & Considerations

### Database
- ✅ Migration script ready but not yet run on production
- ⚠️ Need to verify existing users table has required columns
- ⚠️ Need to create free subscriptions for existing merchants

### Payment Processing
- ⚠️ Paystack test keys needed for development
- ⚠️ Live keys needed for production
- ⚠️ Webhook URL must be HTTPS and publicly accessible

### UI/UX
- ⚠️ Checkout page not yet created
- ⚠️ Subscription dashboard not yet created
- ⚠️ Email templates not yet designed

### Testing
- ⚠️ No tests written yet
- ⚠️ Need sandbox testing with Paystack
- ⚠️ Need to test webhook delivery

---

## 📞 Support & Resources

### Paystack Documentation
- API Reference: https://paystack.com/docs/api/
- Webhooks: https://paystack.com/docs/payments/webhooks/
- Testing: https://paystack.com/docs/payments/test-payments/

### Supabase Documentation
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Database Functions: https://supabase.com/docs/guides/database/functions

### Next.js Documentation
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

---

## 🎉 Success Metrics

### Phase 1 (Foundation) - ✅ COMPLETE
- [x] Database schema designed and documented
- [x] Type system implemented
- [x] Payment library created
- [x] Pricing page updated
- [x] Documentation complete

### Phase 2 (Checkout) - Target: Week 1
- [ ] First successful test payment
- [ ] Subscription activated via webhook
- [ ] Email confirmation sent
- [ ] Invoice generated

### Phase 3 (Management) - Target: Week 2
- [ ] User can view subscription
- [ ] User can cancel subscription
- [ ] User can download invoice
- [ ] User can update payment method

### Phase 4 (Launch) - Target: Week 6
- [ ] 100% uptime on payment endpoints
- [ ] < 2% payment failure rate
- [ ] All security audits passed
- [ ] 10+ successful live transactions

---

**Next Action:** Create the checkout page and subscription API routes to enable the first test payment! 🚀
