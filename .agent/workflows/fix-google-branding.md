---
description: Fix Google Sign-In displaying 'supabase.co' instead of 'MarketBridge'
---

This workflow guides you through updating your Google Cloud Console settings to display "MarketBridge" instead of your Supabase URL during sign-in.

### 1. Access Google Cloud Console
1.  Go to [console.cloud.google.com](https://console.cloud.google.com).
2.  Ensure you have selected the project associated with your Supabase Auth (the one where you got your Client ID/Secret).

### 2. Update OAuth Consent Screen
1.  In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2.  Click **Edit App**.
3.  **App Name**: Change this to **MarketBridge**.
    *(This is the most critical step. This name is what users see in the "continue to..." prompt.)*
4.  **User Support Email**: Select your support email.
5.  **App Logo** (Optional): Upload the MarketBridge logo for a more professional look.
6.  **Authorized Domains**: Add `marketbridge.com.ng`.
    *(Press Enter after typing it to save).*
7.  Click **Save and Continue**.

### 3. Verify Credentials
1.  Navigate to **APIs & Services** > **Credentials**.
2.  Click on the **OAuth 2.0 Client ID** you created for this project.
3.  Under **Authorized JavaScript origins**, ensure you have:
    *   `https://marketbridge.com.ng`
    *   `https://rvzgizeamqqetsfwular.supabase.co` (Do not remove this, Supabase needs it).
4.  Under **Authorized redirect URIs**, ensure you have:
    *   `https://rvzgizeamqqetsfwular.supabase.co/auth/v1/callback`
5.  Click **Save**.

### 4. Supabase URL Configuration (Important Check)
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Authentication** > **URL Configuration**.
3.  Ensure your **Site URL** is set to `https://marketbridge.com.ng`.
4.  Under **Redirect URLs**, add `https://marketbridge.com.ng/**`.

### 5. Verification (Optional but Recommended)
For the most professional appearance (removing `supabase.co` entirely from the URL bar during login), you would need to set up a **Custom Domain** on your Supabase project (requires a paid plan). However, completing steps 1-3 above will ensure the text says "Continue to MarketBridge", which is the standard fix for free/pro tier projects.
