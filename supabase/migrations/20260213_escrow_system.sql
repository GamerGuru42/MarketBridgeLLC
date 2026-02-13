-- ============================================
-- MARKETBRIDGE SMART ESCROW SYSTEM
-- Phase 3: Secure Transactions
-- ============================================

-- 1. ESCROW AGREEMENTS TABLE
-- Stores the contract between buyer and seller linked to a chat/listing
CREATE TABLE IF NOT EXISTS escrow_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'NGN',
    agreement_type TEXT default 'default', -- 'default' or 'custom'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')),
    
    tos_accepted_buyer BOOLEAN DEFAULT FALSE,
    tos_accepted_seller BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_conversation ON escrow_agreements(conversation_id);
CREATE INDEX IF NOT EXISTS idx_escrow_participants ON escrow_agreements(buyer_id, seller_id);

-- 2. ESCROW STEPS TABLE
-- Tracks the milestones (e.g., "Seller ships", "Buyer inspects")
CREATE TABLE IF NOT EXISTS escrow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES escrow_agreements(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'disputed')),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id), -- Who marked it done?
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_steps_agreement ON escrow_steps(agreement_id);

-- 3. RLS POLICIES
ALTER TABLE escrow_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_steps ENABLE ROW LEVEL SECURITY;

-- Escrow Agreements Policies
-- Participants can view their agreements
CREATE POLICY "Participants view agreements" ON escrow_agreements
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id OR 
        EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid()))
    );

-- Participants can insert agreements (usually initiated by one)
CREATE POLICY "Participants create agreements" ON escrow_agreements
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Participants can update agreements (accept TOS, change status)
CREATE POLICY "Participants update agreements" ON escrow_agreements
    FOR UPDATE USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Escrow Steps Policies
-- Participants View
CREATE POLICY "Participants view steps" ON escrow_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM escrow_agreements a
            WHERE a.id = escrow_steps.agreement_id
            AND (a.buyer_id = auth.uid() OR a.seller_id = auth.uid())
        )
    );

-- Participants Update (Mark steps as complete)
CREATE POLICY "Participants update steps" ON escrow_steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM escrow_agreements a
            WHERE a.id = escrow_steps.agreement_id
            AND (a.buyer_id = auth.uid() OR a.seller_id = auth.uid())
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_escrow_agreements_updated_at ON escrow_agreements;
CREATE TRIGGER update_escrow_agreements_updated_at BEFORE UPDATE ON escrow_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
