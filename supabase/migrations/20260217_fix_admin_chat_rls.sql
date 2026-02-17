-- Fix Admin Chat Message Insert Policy
-- The issue is that operations_admin and other admin roles need explicit permission

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can insert messages" ON admin_channel_messages;

-- Create a more permissive policy for admin roles
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

-- Also ensure the channels table has an insert policy (in case new channels need to be created)
DROP POLICY IF EXISTS "Admins can insert channels" ON admin_channels;

CREATE POLICY "Admins can insert channels" ON admin_channels
    FOR INSERT WITH CHECK (
        EXISTS (
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
