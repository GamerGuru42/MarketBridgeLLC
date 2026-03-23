-- Migration to add Admin Channels and Messages

CREATE TABLE IF NOT EXISTS public.admin_channels (
    id text PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('public', 'private')),
    is_dm boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_channel_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id text NOT NULL REFERENCES public.admin_channels(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.admin_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_channel_messages ENABLE ROW LEVEL SECURITY;

-- Allow Operations, Technical Admins, and CEO read/write access
CREATE POLICY "Staff can view admin channels"
    ON public.admin_channels
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cofounder')
        )
    );

CREATE POLICY "Staff can insert admin channels"
    ON public.admin_channels
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cofounder')
        )
    );

CREATE POLICY "Staff can update admin channels"
    ON public.admin_channels
    FOR UPDATE
    USING (
         EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cofounder')
        )
    );


CREATE POLICY "Staff can view admin messages"
    ON public.admin_channel_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cofounder')
        )
    );

CREATE POLICY "Staff can insert admin messages"
    ON public.admin_channel_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cofounder')
        )
    );

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
