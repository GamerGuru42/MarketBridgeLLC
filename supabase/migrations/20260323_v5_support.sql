-- Phase 11 Schema Modifications: AI Customer Care

-- 1. Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'ai_handling' CHECK (status IN ('open', 'ai_handling', 'escalated', 'resolved')),
    priority text NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id text NOT NULL,
    sender_type text NOT NULL CHECK (sender_type IN ('user', 'ai', 'admin')),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Users can view their own tickets') THEN
        CREATE POLICY "Users can view their own tickets"
            ON public.support_tickets FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Users can insert their own tickets') THEN
        CREATE POLICY "Users can insert their own tickets"
            ON public.support_tickets FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Admins can view and edit all tickets') THEN
        CREATE POLICY "Admins can view and edit all tickets"
            ON public.support_tickets FOR ALL
            USING (
                EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()
                    AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin'))
            );
    END IF;
END $$;

-- RLS for support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Users can view messages for their tickets') THEN
        CREATE POLICY "Users can view messages for their tickets"
            ON public.support_messages FOR SELECT
            USING (
                EXISTS (SELECT 1 FROM public.support_tickets
                    WHERE support_tickets.id = support_messages.ticket_id
                    AND support_tickets.user_id = auth.uid())
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Users can insert messages for their tickets') THEN
        CREATE POLICY "Users can insert messages for their tickets"
            ON public.support_messages FOR INSERT
            WITH CHECK (
                EXISTS (SELECT 1 FROM public.support_tickets
                    WHERE support_tickets.id = support_messages.ticket_id
                    AND support_tickets.user_id = auth.uid())
                AND sender_id = auth.uid()::text
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Admins can view and insert all messages') THEN
        CREATE POLICY "Admins can view and insert all messages"
            ON public.support_messages FOR ALL
            USING (
                EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid()
                    AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin'))
            );
    END IF;
END $$;

-- Enable realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
