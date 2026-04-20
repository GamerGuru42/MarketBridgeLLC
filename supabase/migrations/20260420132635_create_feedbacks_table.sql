CREATE TABLE IF NOT EXISTS public.feedbacks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    type text NOT NULL,
    description text NOT NULL,
    name text,
    email text,
    status text NOT NULL DEFAULT 'open',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT feedbacks_pkey PRIMARY KEY (id)
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.feedbacks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view feedback" ON public.feedbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo')
        )
    );

CREATE POLICY "Admins can update feedback" ON public.feedbacks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo')
        )
    );
