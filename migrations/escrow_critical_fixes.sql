-- ============================================================
-- MarketBridge: Escrow Critical Fixes Migration
-- Run this entire script in the Supabase SQL Editor.
-- It is safe to run more than once (all statements use IF NOT EXISTS / DO blocks).
-- ============================================================

-- ─── 1. orders table — new columns ──────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_price       DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS agreed_price         DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_fee           DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketcoins_discount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_payout        DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount         DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paystack_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paystack_reference   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at          TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_id           UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at         TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid          DECIMAL(12,2);

-- ─── 2. escrow_transactions table — create and alter ──────────────────────────

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'releasing', 'released', 'refunded', 'frozen')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS paystack_transaction_id TEXT;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS paystack_transfer_ref   TEXT;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS refund_reference        TEXT;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS held_at                 TIMESTAMPTZ;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS released_at             TIMESTAMPTZ;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS refunded_at             TIMESTAMPTZ;

-- ─── 3. disputes table — create and alter ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES public.users(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS raised_by         UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_urls     TEXT[] DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS assigned_admin    UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS deadline          TIMESTAMPTZ;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_notes  TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_by       UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at       TIMESTAMPTZ;

-- ─── 4. users table — new columns ────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS coins_lifetime_earned    INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at  TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS listings_count           INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS paystack_recipient_code  TEXT;

-- ─── 5. processed_webhooks table (idempotency) ───────────────────────────────

CREATE TABLE IF NOT EXISTS processed_webhooks (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  paystack_event_id TEXT       NOT NULL,
  event_type        TEXT       NOT NULL,
  payload           JSONB,
  processed_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT processed_webhooks_event_id_unique UNIQUE (paystack_event_id)
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event_id
  ON processed_webhooks (paystack_event_id);

-- ─── 6. price_offers table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_offers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id     UUID        NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users(id),
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  listing_id  UUID        NOT NULL REFERENCES listings(id),
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_offers_chat_id   ON price_offers (chat_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_sender_id ON price_offers (sender_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status    ON price_offers (status);

-- ─── 7. chats table — active_order_id, buyer_id, seller_id ───────────────────

ALTER TABLE chats ADD COLUMN IF NOT EXISTS active_order_id UUID REFERENCES orders(id);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id);

-- Backfill buyer_id and seller_id from listing's seller and participants array
UPDATE chats c
SET seller_id = l.seller_id
FROM listings l
WHERE c.listing_id = l.id
  AND c.seller_id IS NULL;

UPDATE chats c
SET seller_id = c.participants[1]
WHERE c.seller_id IS NULL 
  AND c.participants IS NOT NULL 
  AND array_length(c.participants, 1) >= 1;

UPDATE chats c
SET buyer_id = (
  SELECT p 
  FROM unnest(c.participants) p 
  WHERE p != c.seller_id 
  LIMIT 1
)
WHERE c.buyer_id IS NULL 
  AND c.participants IS NOT NULL 
  AND array_length(c.participants, 1) >= 2;

-- ─── 8. Trigger: maintain listings_count on users ────────────────────────────

-- Function: increment on insert
CREATE OR REPLACE FUNCTION increment_listings_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
    SET listings_count = COALESCE(listings_count, 0) + 1
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$;

-- Function: decrement on delete
CREATE OR REPLACE FUNCTION decrement_listings_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
    SET listings_count = GREATEST(COALESCE(listings_count, 0) - 1, 0)
  WHERE id = OLD.seller_id;
  RETURN OLD;
END;
$$;

-- Drop & recreate triggers (safe to re-run)
DROP TRIGGER IF EXISTS trg_listing_insert ON listings;
CREATE TRIGGER trg_listing_insert
  AFTER INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION increment_listings_count();

DROP TRIGGER IF EXISTS trg_listing_delete ON listings;
CREATE TRIGGER trg_listing_delete
  AFTER DELETE ON listings
  FOR EACH ROW EXECUTE FUNCTION decrement_listings_count();

-- Backfill existing counts (run once)
UPDATE users u
SET listings_count = (
  SELECT COUNT(*) FROM listings l
  WHERE l.seller_id = u.id
    AND l.status NOT IN ('sold', 'deleted', 'archived')
);

-- ─── 9. orders FK to disputes (deferred to avoid circular ref) ───────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_dispute_id_fkey'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_dispute_id_fkey
      FOREIGN KEY (dispute_id) REFERENCES disputes(id);
  END IF;
END $$;

-- ─── 10. RLS Policies ────────────────────────────────────────────────────────

-- Enable RLS on tables that need it (safe to run if already enabled)
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_offers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;

-- Drop old/conflicting policies first
DROP POLICY IF EXISTS "Users can view own orders"    ON orders;
DROP POLICY IF EXISTS "Users can update own orders"  ON orders;
DROP POLICY IF EXISTS "Admins can access all orders" ON orders;

-- orders: buyer and seller can read their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
  );

-- orders: buyer and seller can update (e.g., advance status via API routes)
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
  );

-- orders: admins can see all
CREATE POLICY "Admins can access all orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'ceo', 'operations', 'technical')
    )
  );

-- escrow_transactions: parties can view; service role only for writes
DROP POLICY IF EXISTS "Parties can view escrow transactions" ON escrow_transactions;
CREATE POLICY "Parties can view escrow transactions"
  ON escrow_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

-- price_offers: buyer and seller in the chat can read
DROP POLICY IF EXISTS "Chat parties can view offers" ON price_offers;
CREATE POLICY "Chat parties can view offers"
  ON price_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- disputes: parties and admins can view
DROP POLICY IF EXISTS "Parties and admins can view disputes" ON disputes;
CREATE POLICY "Parties and admins can view disputes"
  ON disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'ceo', 'operations', 'technical')
    )
  );

-- processed_webhooks: only service role (no user access needed)
DROP POLICY IF EXISTS "No direct user access to webhooks" ON processed_webhooks;
CREATE POLICY "No direct user access to webhooks"
  ON processed_webhooks FOR SELECT
  USING (false); -- Only service_role key can access

-- ─── 11. Indexes for performance ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id        ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id       ON orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_paystack_ref    ON orders (paystack_reference);

CREATE INDEX IF NOT EXISTS idx_escrow_order_id        ON escrow_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transfer_ref    ON escrow_transactions (paystack_transfer_ref);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id      ON disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_admin ON disputes (assigned_admin);
CREATE INDEX IF NOT EXISTS idx_disputes_status        ON disputes (status);

-- ─── Done ─────────────────────────────────────────────────────────────────────

-- Verify key tables exist
DO $$
BEGIN
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'processed_webhooks'),
    'processed_webhooks table was not created';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'price_offers'),
    'price_offers table was not created';
  RAISE NOTICE 'Migration completed successfully.';
END $$;
