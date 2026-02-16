# Deployment & Domain Setup Guide: MarketBridge Campus Beta

This guide outlines the immediate steps to sync your local changes to the cloud (Supabase & Vercel) and activate your custom domain `marketbridge.com.ng`.

## Part 1: Supabase Configuration (Database)
**Goal:** Apply the new database schema for the Beta launch (Roles, Plans, Tables).

1.  **Login to Supabase Dashboard**: Go to [app.supabase.com](https://app.supabase.com).
2.  **Select Project**: Open your `MarketBridge` project.
3.  **Open SQL Editor**: Click on the "SQL Editor" icon in the left sidebar.
4.  **New Query**: Click "New Query" and paste the contents of `supabase/migrations/20260216_campus_beta_setup.sql`.
    *   *Note: You can find this file in your local project folder.*
5.  **Run Query**: Click "Run" to execute the script.
    *   **Success Check**: You should see "Success. No rows returned" or similar.
    *   *Verification*: Go to the "Table Editor" and check if tables like `referrals`, `seller_feedback`, and `system_audit_logs` exist. Check if the `subscription_plans` table has the `beta_campus_founder` row.

## Part 2: Vercel Configuration (Deployment & Domain)
**Goal:** Push your code live and connect your domain.

### A. Deploying the Code
1.  **Push to Git**: Ensure all your local changes are committed and pushed to your connected repository (GitHub/GitLab/Bitbucket).
    ```bash
    git add .
    git commit -m "feat: setup marketbridge campus beta"
    git push origin main
    ```
2.  **Monitor Build**: Log in to [vercel.com](https://vercel.com), go to your project, and watch the "Deployment" tab. Vercel automatically deploys new pushes to `main`.

### B. Configuring the Domain (`marketbridge.com.ng`)
1.  **Go to Settings**: In your Vercel project dashboard, click **Settings** -> **Domains**.
2.  **Add Domain**:
    *   Enter `marketbridge.com.ng` in the input field.
    *   Click **Add**.
3.  **Choose Redirect Option**:
    *   Vercel will ask if you want to redirect `www.marketbridge.com.ng` to `marketbridge.com.ng` (Recommended). Select this option.
4.  **Update DNS Records**:
    *   Vercel will generate a set of DNS records (likely an **A Record** and a **CNAME Record**) valid for your domain registrar.
    *   **Login to your Domain Registrar** (e.g., GoDaddy, Namecheap, WhoGoHost).
    *   **Manage DNS**: Find the DNS management section for `marketbridge.com.ng`.
    *   **Add Records**:
        *   **Type**: `A` | **Name**: `@` | **Value**: `76.76.21.21` (Verify this value on Vercel dashboard).
        *   **Type**: `CNAME` | **Name**: `www` | **Value**: `cname.vercel-dns.com` (Verify this value on Vercel dashboard).
5.  **Wait for Propagation**: DNS changes can take a few minutes to 24 hours to propagate globally. Vercel will show a green checkmark next to the domain when it's live.

### C. Environment Variables (Important!)
1.  **Go to Settings**: Click **Settings** -> **Environment Variables**.
2.  **Update URL**:
    *   Find `NEXT_PUBLIC_SITE_URL` (if it exists).
    *   Update its value to `https://marketbridge.com.ng`.
    *   *If you are using it for authentication redirects (Supabase Auth), ensure this URL is also added to your Supabase Auth > URL Configuration > Site URL.*

## Part 3: Post-Deployment Verification
Once the domain is verified and the deployment is green:
1.  Visit `https://marketbridge.com.ng`.
2.  Check the **Footer** to see if the "Beta" links are present.
3.  Go to the **Pricing Page** and verify the "Founding Member" plan shows up.
4.  Try to **Sign Up** as a "Student Merchant" to test the flow.
