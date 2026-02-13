-- ============================================
-- MARKETBRIDGE MESSAGING SYSTEM
-- Phase 3: Trust & Communication via Chat
-- ============================================

-- 1. CONVERSATIONS TABLE
-- Tracks the chat thread between two users, optionally about a specific listing
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL, -- Optional context
    last_message TEXT, -- Preview of the last message
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure distinct conversation per pair per listing
    -- Use specific check trigger or constraint if needed, but uniqueness on (p1, p2, listing) 
    -- is tricky because p1/p2 order matters. We'll handle order in application logic (sort IDs) 
    -- or add a check constraint.
    CONSTRAINT check_participants_diff CHECK (participant1_id != participant2_id)
);

-- Index for fast lookup of a user's conversations
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

-- 2. MESSAGES TABLE
-- Individual messages within a conversation
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for real-time fetching
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS POLICIES
-- Users can view conversations they are part of
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = participant1_id OR auth.uid() = participant2_id
    );

-- Users can create a conversation if they are participant1 (initiator)
CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant1_id
    );

-- MESSAGES POLICIES
-- Users can view messages in conversations they belong to
CREATE POLICY "Users can view messages in their chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- Users can send messages to conversations they belong to
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- Users can mark messages as read (UPDATE) if they are the recipient
-- (Recipient is the participant who is NOT the sender)
CREATE POLICY "Users can mark messages as read" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- ============================================
-- 4. REAL-TIME TRIGGERS
-- ============================================

-- Function: Update conversation's last_message when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- 5. REALTIME ENABLEMENT (Supabase Specific)
-- ============================================

-- Enable Realtime for these tables so the frontend gets instant updates
-- Note: This usually requires running in Supabase dashboard SQL editor
-- via "alter publication supabase_realtime add table ..."
-- We'll add the instruction here for completeness.

-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
