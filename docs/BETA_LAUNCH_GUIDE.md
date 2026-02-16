# MarketBridge Campus Beta Launch Guide

## Overview
This document outlines the specific configuration and operational procedures for the "Campus Beta" launch in Abuja. This phase is distinct from the full institutional build.

## 1. Beta Configuration
- **Environment**: Production (Vercel)
- **Database**: Supabase `main` branch (with `20260216_campus_beta_setup.sql` applied).
- **URL**: `https://beta.marketbridge.com.ng` (or Vercel deployment URL)

## 2. Beta Features (Restricted Scope)
The platform is currently operating in a **BETA STATE** with the following restrictions:

### A. User Roles & Access
- **Founding Sellers (`dealer`)**:
  - Must be manually verified by `operations_admin`.
  - Subscription: `beta_campus_founder` (₦1,000/month).
  - Limit: 100 Initial Sellers.
- **Buyers (`customer`)**:
  - Open sign-up (University email preferred but not enforced in code strictness for buyers yet).
  - Can browse and chat.

### B. Admin Panels
Access is strictly role-based (RBAC):
- **Technical Admin**: `technical_admin` -> System Health, Logs.
- **Operations Admin**: `operations_admin` -> Verification, Disputes, Payouts.
- **Marketing Admin**: `marketing_admin` -> Referrals, User Growth.

### C. Legal & Compliance
- **Terms & Conditions**: Explicit "Beta" liability clauses.
- **Privacy Policy**: NDPA 2023 Compliant.
- **Disclaimer**: Mandatory "Testing Phase" warning in footer/hero.

## 3. Operational Workflows

### Onboarding a Seller
1.  **User Splits**: Sign up as `Student Merchant`.
2.  **Verification**: Upload Student ID. Status -> `pending_verification`.
3.  **Admin Action**:
    - Go to `/admin/operations`.
    - Check "Pending Verifications".
    - Review ID Card.
    - Click "Verify Node".
4.  **Activation**:
    - User gets email (mock/future).
    - User subscribes to `beta_campus_founder` plan (14-day trial or immediate payment).

### Handling Disputes
1.  Buyer reports issue via Chat or Support.
2.  **Ops Admin** views `/admin/disputes` (to be fully built, currently manual DB/Chat review).
3.  Funds held in **Escrow** are either released to Seller or Refunded to Buyer.

## 4. Technical Migration
Ensure the following SQL file is executed:
`supabase/migrations/20260216_campus_beta_setup.sql`

## 5. Contact Points
- **System Issues**: `technical@marketbridge.com.ng`
- **User Verified**: `operations@marketbridge.com.ng`
