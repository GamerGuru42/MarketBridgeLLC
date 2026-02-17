-- Quick Fix: Run this in Supabase SQL Editor
-- This will allow operations_admin and all other admin roles to send messages

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins can insert messages" ON admin_channel_messages;

-- 2. Create new policy that explicitly checks for admin roles
CREATE POLICY "Admins can insert messages" ON admin_channel_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );
