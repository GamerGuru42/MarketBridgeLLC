-- Migration: Add notification preferences to users table
-- Run this in your Supabase SQL editor
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS notif_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_new_messages BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_offer_updates BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_marketing_emails BOOLEAN NOT NULL DEFAULT FALSE;
-- RLS: Users can only read/update their own preferences
-- (Covered by existing users table RLS policies — no additional policies needed)
COMMENT ON COLUMN public.users.notif_order_updates IS 'Receive notifications when order status changes';
COMMENT ON COLUMN public.users.notif_new_messages IS 'Receive notifications for new chat messages';
COMMENT ON COLUMN public.users.notif_offer_updates IS 'Receive notifications when offer is accepted/rejected';
COMMENT ON COLUMN public.users.notif_marketing_emails IS 'Receive marketing and promotional emails';