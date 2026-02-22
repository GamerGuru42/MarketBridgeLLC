Quick deployment and dev notes

- Install Leaflet + React bindings for the map UI:

  ```bash
  npm install react-leaflet leaflet
  ```

- Environment variables required for features added in this patch:
  - `SENDGRID_API_KEY` (optional) — used to deliver OTP emails for seller verification. If not set, OTPs are logged to server console for development.
  - `ENABLE_PUBLIC_SECTION` — must be `true` and DB `site_settings.public_section_enabled` must be `true` to expose `/public` routes.
  - `PAYSTACK_SECRET_KEY` — server secret for webhook verification and API calls.
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — client/public key for Paystack UI if using inline flow.
  - `SUPABASE_SERVICE_ROLE_KEY` — required for server admin Supabase client.

- Run DB migrations (apply `migrations/20260222_add_verification_tables.sql` and existing MarketCoins migrations).

- Paystack testing:
  - Use sandbox/test keys first.
  - Configure webhook URL in Paystack dashboard to point at `/api/webhooks/paystack` and set the webhook secret in `PAYSTACK_SECRET_KEY`.
