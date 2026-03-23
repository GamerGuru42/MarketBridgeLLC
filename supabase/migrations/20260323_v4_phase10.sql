-- Phase 10 Schema Modifications
-- Safe for re-runs. Handles pre-existing tables gracefully.

-- ============================================
-- PREREQUISITE: Ensure messaging tables exist
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table (only if not present)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant2_id);

-- Create messages table (only if not present)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If messages table already existed but lacked conversation_id, add it
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view their conversations') THEN
        CREATE POLICY "Users can view their conversations" ON public.conversations
            FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can insert conversations') THEN
        CREATE POLICY "Users can insert conversations" ON public.conversations
            FOR INSERT WITH CHECK (auth.uid() = participant1_id);
    END IF;
END $$;

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages in their chats') THEN
        CREATE POLICY "Users can view messages in their chats" ON public.messages
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
                    AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid()))
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages') THEN
        CREATE POLICY "Users can send messages" ON public.messages
            FOR INSERT WITH CHECK (
                auth.uid() = sender_id AND
                EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
                    AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid()))
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can mark messages as read') THEN
        CREATE POLICY "Users can mark messages as read" ON public.messages
            FOR UPDATE USING (
                EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
                    AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid()))
            );
    END IF;
END $$;

-- Trigger: Update conversation last_message on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = NEW.content, last_message_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- PHASE 10: New Columns & Tables
-- ============================================

-- 1. Add floor_price to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS floor_price numeric;

-- 2. Add AI flag to escrow (safe — skips if table doesn't exist)
DO $$ BEGIN
    ALTER TABLE public.escrow_agreements ADD COLUMN IF NOT EXISTS ai_flagged boolean DEFAULT false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 3. Chat flags table (NO foreign keys to avoid dependency failures)
CREATE TABLE IF NOT EXISTS public.chat_flags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid,
    message_id uuid,
    flag_type text NOT NULL CHECK (flag_type IN ('spam', 'external_payment', 'harassment', 'scam', 'low_ball')),
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ai_summary text,
    is_resolved boolean DEFAULT false,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chat_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_flags' AND policyname = 'Admins can view all chat flags') THEN
        CREATE POLICY "Admins can view all chat flags"
            ON public.chat_flags FOR SELECT
            USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()
                AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin')));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_flags' AND policyname = 'System can insert chat flags') THEN
        CREATE POLICY "System can insert chat flags"
            ON public.chat_flags FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_flags' AND policyname = 'Admins can update chat flags') THEN
        CREATE POLICY "Admins can update chat flags"
            ON public.chat_flags FOR UPDATE
            USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()
                AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin')));
    END IF;
END $$;

-- Enable realtime (safe re-run)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_flags;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
