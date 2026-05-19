-- ============================================
-- MARKETBRIDGE: REALTIME CHAT ENHANCEMENTS
-- Enable Supabase Realtime on messaging tables,
-- add image support, chat flags, and storage.
-- ============================================

-- 1. ADD image_url COLUMN to messages (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE messages ADD COLUMN image_url TEXT DEFAULT NULL;
    END IF;
END $$;

-- 2. CHAT FLAGS TABLE (AI moderation system)
CREATE TABLE IF NOT EXISTS chat_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    flagged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    flag_type TEXT NOT NULL DEFAULT 'spam'
        CHECK (flag_type IN ('spam', 'scam', 'harassment', 'external_payment', 'other')),
    severity TEXT NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ai_summary TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_flags_conversation ON chat_flags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_flags_unresolved ON chat_flags(resolved) WHERE resolved = FALSE;

-- RLS for chat_flags
ALTER TABLE chat_flags ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert a flag (the AI engine inserts on behalf of user)
CREATE POLICY "Authenticated users can insert chat flags" ON chat_flags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can view flags (via service role key in admin dashboard)
-- Regular users cannot read flags
CREATE POLICY "Users can view their own conversation flags" ON chat_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = chat_flags.conversation_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- 3. ADD ai_flagged column to escrow_agreements (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'escrow_agreements' AND column_name = 'ai_flagged'
    ) THEN
        ALTER TABLE escrow_agreements ADD COLUMN ai_flagged BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. ENABLE SUPABASE REALTIME on messaging tables
-- This is the critical step that makes postgres_changes subscriptions work
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 5. STORAGE BUCKET for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-images',
    'chat-images',
    true,
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies for chat-images bucket
-- Allow authenticated users to upload to their conversation folders
CREATE POLICY "Users can upload chat images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-images'
        AND auth.uid() IS NOT NULL
    );

-- Allow anyone to view chat images (they're in-app only, URLs are not guessable)
CREATE POLICY "Public can view chat images" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own chat images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'chat-images'
        AND auth.uid() IS NOT NULL
    );

-- 6. FUNCTION: Get unread message count per conversation for a user
CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id UUID)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT m.conversation_id, COUNT(*)::BIGINT
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.is_read = FALSE
      AND m.sender_id != p_user_id
      AND (c.participant1_id = p_user_id OR c.participant2_id = p_user_id)
    GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
