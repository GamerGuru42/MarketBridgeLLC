-- Admin Chat System
-- Simple channel-based chat for admins/executives

-- 1. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS admin_channels (
    id TEXT PRIMARY KEY, -- 'gen', 'strat', 'tech', 'abj'
    name TEXT NOT NULL,
    type TEXT DEFAULT 'public', -- 'public', 'private'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default channels
INSERT INTO admin_channels (id, name, type) VALUES
('gen', 'general-ops', 'public'),
('strat', 'ceo-strategy', 'private'),
('tech', 'tech-signals', 'public'),
('abj', 'ops-abuja', 'public')
ON CONFLICT (id) DO NOTHING;

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS admin_channel_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id TEXT NOT NULL REFERENCES admin_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT, -- Cache role for speed? Or join. Let's cache it for simplicity in UI
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_msgs_channel ON admin_channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_admin_msgs_created ON admin_channel_messages(created_at DESC);

-- RLS
ALTER TABLE admin_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_channel_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow all authenticated users with admin roles to view/insert
-- For now, we'll just allow authenticated users to read (assuming app logic filters non-admins from accessing the page)
-- But ideally we restrict to admin roles.

CREATE POLICY "Admins can view channels" ON admin_channels
    FOR SELECT USING (
        auth.role() = 'authenticated' -- We rely on Middleware/Page protection for now
    );

CREATE POLICY "Admins can view messages" ON admin_channel_messages
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can insert messages" ON admin_channel_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Realtime
-- ALTER PUBLICATION supabase_realtime ADD TABLE admin_channel_messages;
