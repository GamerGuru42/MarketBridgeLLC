-- ============================================
-- SMART ESCROW SYSTEM MIGRATION
-- ============================================

-- 1. Create Escrow Templates Table (Default Conditions)
CREATE TABLE IF NOT EXISTS public.escrow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- e.g., 'electronics', 'vehicles', 'services'
    name TEXT NOT NULL, -- e.g., 'Standard Electronics Sale'
    steps JSONB NOT NULL, -- Array of step descriptions: ["Seller ships item", "Buyer receives item", "Buyer inspects item"]
    tos_text TEXT NOT NULL, -- Terms of Service specific to this template
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 2. Create Escrow Agreements Table (The Contract)
CREATE TABLE IF NOT EXISTS public.escrow_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(id),
    seller_id UUID NOT NULL REFERENCES public.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')) DEFAULT 'pending',
    current_step_index INTEGER DEFAULT 0,
    agreement_type TEXT NOT NULL CHECK (agreement_type IN ('default', 'custom')),
    tos_accepted_buyer BOOLEAN DEFAULT FALSE,
    tos_accepted_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Escrow Steps Table (The Execution Steps)
CREATE TABLE IF NOT EXISTS public.escrow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES public.escrow_agreements(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL, -- 0, 1, 2...
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    buyer_confirmed_at TIMESTAMPTZ,
    seller_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.escrow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_steps ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Templates: Public read, Admin write
CREATE POLICY "Everyone can view escrow templates" ON public.escrow_templates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage escrow templates" ON public.escrow_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = (SELECT auth.uid()) 
            AND users.role IN ('operations_admin', 'admin', 'ceo', 'cofounder')
        )
    );

-- Agreements: Participants read/write
CREATE POLICY "Participants can view their agreements" ON public.escrow_agreements
    FOR SELECT USING (
        buyer_id = (SELECT auth.uid()) OR 
        seller_id = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = (SELECT auth.uid()) 
            AND users.role IN ('operations_admin', 'admin', 'ceo', 'cofounder')
        )
    );

CREATE POLICY "Participants can create agreements" ON public.escrow_agreements
    FOR INSERT WITH CHECK (
        buyer_id = (SELECT auth.uid()) OR 
        seller_id = (SELECT auth.uid())
    );

CREATE POLICY "Participants can update their agreements" ON public.escrow_agreements
    FOR UPDATE USING (
        buyer_id = (SELECT auth.uid()) OR 
        seller_id = (SELECT auth.uid())
    );

-- Steps: Participants read/write
CREATE POLICY "Participants can view steps" ON public.escrow_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.escrow_agreements 
            WHERE escrow_agreements.id = escrow_steps.agreement_id 
            AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = (SELECT auth.uid()) 
            AND users.role IN ('operations_admin', 'admin', 'ceo', 'cofounder')
        )
    );

CREATE POLICY "Participants can update steps" ON public.escrow_steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.escrow_agreements 
            WHERE escrow_agreements.id = escrow_steps.agreement_id 
            AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
        )
    );

CREATE POLICY "Participants can insert steps" ON public.escrow_steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.escrow_agreements 
            WHERE escrow_agreements.id = agreement_id 
            AND (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()))
        )
    );

-- 6. Triggers for updated_at
CREATE TRIGGER update_escrow_templates_updated_at BEFORE UPDATE ON public.escrow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_agreements_updated_at BEFORE UPDATE ON public.escrow_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_steps_updated_at BEFORE UPDATE ON public.escrow_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
