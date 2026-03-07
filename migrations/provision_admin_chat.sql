-- =============================================
-- ADMIN CHAT INFRASTRUCTURE (ROBUST UPDATE)
-- =============================================
-- 1. Create admin_channels table with all columns
CREATE TABLE IF NOT EXISTS public.admin_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'public',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);
-- 2. Ensure 'description' column exists (if table was created previously without it)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'admin_channels'
        AND column_name = 'description'
) THEN
ALTER TABLE public.admin_channels
ADD COLUMN description TEXT;
END IF;
END $$;
-- 3. Create admin_channel_messages table
CREATE TABLE IF NOT EXISTS public.admin_channel_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.admin_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 4. Provision Default Channels safely
-- Using ON CONFLICT (if you have a unique constraint) or just checking count
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM public.admin_channels
    WHERE name = 'Executive Hub'
) THEN
INSERT INTO public.admin_channels (name, type, description)
VALUES (
        'Executive Hub',
        'public',
        'Main command center for all admins.'
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM public.admin_channels
    WHERE name = 'Operations Node'
) THEN
INSERT INTO public.admin_channels (name, type, description)
VALUES (
        'Operations Node',
        'public',
        'Operational logistics and verification stream.'
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM public.admin_channels
    WHERE name = 'Technical Systems'
) THEN
INSERT INTO public.admin_channels (name, type, description)
VALUES (
        'Technical Systems',
        'public',
        'Server health and infrastructure logs.'
    );
END IF;
END $$;
-- 5. Enable RLS
ALTER TABLE public.admin_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_channel_messages ENABLE ROW LEVEL SECURITY;
-- 6. Helper Function (Robust)
CREATE OR REPLACE FUNCTION public.is_executive() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role IN (
                'admin',
                'ceo',
                'cofounder',
                'cto',
                'coo',
                'technical_admin',
                'operations_admin',
                'marketing_admin'
            )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 7. RLS Policies
DROP POLICY IF EXISTS "Executives can view channels" ON public.admin_channels;
CREATE POLICY "Executives can view channels" ON public.admin_channels FOR
SELECT USING (public.is_executive());
DROP POLICY IF EXISTS "Executives can manage channels" ON public.admin_channels;
CREATE POLICY "Executives can manage channels" ON public.admin_channels FOR ALL USING (public.is_executive());
DROP POLICY IF EXISTS "Executives can view messages" ON public.admin_channel_messages;
CREATE POLICY "Executives can view messages" ON public.admin_channel_messages FOR
SELECT USING (public.is_executive());
DROP POLICY IF EXISTS "Executives can send messages" ON public.admin_channel_messages;
CREATE POLICY "Executives can send messages" ON public.admin_channel_messages FOR
INSERT WITH CHECK (
        public.is_executive()
        AND auth.uid() = sender_id
    );