# Dealer Pricing System Implementation

## Overview
Implemented a comprehensive subscription-based pricing system for dealers during the signup process.

## Changes Made

### 1. User Type Definitions (`client/types/user.ts`)
- Added `SubscriptionPlan` type: 'starter' | 'professional' | 'enterprise'
- Added `SubscriptionStatus` type: 'active' | 'inactive' | 'trial' | 'expired'
- Extended `User` and `FirestoreUser` interfaces with:
  - `subscriptionPlan`
  - `subscriptionStatus`
  - `subscriptionStartDate`
  - `subscriptionEndDate`
  - `listingLimit`

### 2. Firebase Admin (`client/lib/firebase-admin.ts`)
- Updated `createUser` function to automatically set subscription defaults:
  - **Dealers**: Get 14-day free trial on selected plan (default: starter)
  - **Customers**: No active subscription (inactive status)
- Listing limits by plan:
  - Starter: 5 listings
  - Professional: 50 listings
  - Enterprise: Unlimited (999,999)

### 3. Registration API (`client/app/api/auth/register/route.ts`)
- Added `subscriptionPlan` parameter support
- Passes subscription plan to `createUser` function

### 4. Signup Page (`client/app/signup/page.tsx`)
**Complete redesign with 3-step flow:**

#### Step 1: Role Selection
- User chooses between Customer or Dealer
- Visual card-based selection
- Google OAuth option available

#### Step 2: Plan Selection (Dealers Only)
- Displays 3 pricing tiers:
  - **Starter**: Free (5 listings, 5% fee, 14-day trial)
  - **Professional**: ₦5,000/month (50 listings, 2.5% fee, verified badge) - POPULAR
  - **Enterprise**: ₦20,000/month (unlimited listings, 1% fee, API access)
- Visual comparison with feature lists
- All plans include 14-day free trial

#### Step 3: Profile Completion
- Collects user details
- For dealers: business name, store type, verification documents
- Shows selected plan in header
- Creates account with chosen subscription

## Pricing Plans

### Starter (Free)
- Up to 5 active listings
- Basic analytics
- Standard support
- 5% transaction fee
- 14-day trial

### Professional (₦5,000/month)
- Up to 50 active listings
- Advanced analytics
- Priority support
- Verified Dealer Badge
- 2.5% transaction fee

### Enterprise (₦20,000/month)
- Unlimited listings
- Custom analytics reports
- Dedicated account manager
- API access
- 1% transaction fee

## User Experience Flow

1. **New Dealer Signup**:
   - Selects "Dealer" role
   - Chooses subscription plan
   - Completes profile
   - Gets 14-day free trial
   - Trial starts after account verification

2. **New Customer Signup**:
   - Selects "Customer" role
   - Completes profile
   - No subscription required

## Database Schema

Each user document now includes:
```javascript
{
  // ... existing fields
  subscriptionPlan: 'starter' | 'professional' | 'enterprise',
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired',
  subscriptionStartDate: '2024-01-01T00:00:00.000Z' | null,
  subscriptionEndDate: '2024-01-15T00:00:00.000Z' | null,
  listingLimit: 5 | 50 | 999999
}
```

## Next Steps (Future Enhancements)

1. **Payment Integration**:
   - Integrate Flutterwave for subscription payments
   - Handle plan upgrades/downgrades
   - Automatic billing

2. **Subscription Management**:
   - Dealer dashboard to view subscription status
   - Upgrade/downgrade functionality
   - Payment history

3. **Enforcement**:
   - Check listing limits when creating listings
   - Display subscription status in dealer dashboard
   - Send trial expiration reminders

4. **Analytics**:
   - Track subscription conversions
   - Monitor plan popularity
   - Revenue reporting

## Files Modified

1. `client/types/user.ts` - Added subscription types
2. `client/lib/firebase-admin.ts` - Updated user creation logic
3. `client/app/api/auth/register/route.ts` - Added subscription plan support
4. `client/app/signup/page.tsx` - Complete redesign with pricing flow
5. `client/contexts/AuthContext.tsx` - Uses shared User type

## Deployment

All changes are backward compatible. Existing users will have default values:
- `subscriptionPlan`: 'starter'
- `subscriptionStatus`: 'inactive' (customers) or 'trial' (dealers)
- `listingLimit`: 5

No database migration required - new fields are added automatically on user creation.
