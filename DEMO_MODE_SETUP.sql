-- ========================================================
-- MARKETBRIDGE: DEMO MODE PRIVATE BETA SETUP
-- ========================================================
-- Run this script in the Supabase SQL Editor to initialize
-- the global settings table required for the Demo Mode toggle.

-- 1. Create the system_settings table
create table if not exists public.system_settings (
    id text primary key,
    is_demo_mode boolean default false,
    demo_start_date timestamp with time zone,
    updated_at timestamp with time zone default now()
);

-- 2. Enable Realtime triggers so the UI updates instantly when the CEO flips the toggle
alter publication supabase_realtime add table public.system_settings;

-- 3. Insert the global master record (Defaults to OFF initially)
insert into public.system_settings (id, is_demo_mode)
values ('global', false)
on conflict (id) do nothing;

-- 4. Secure the table (Optional but highly recommended)
-- Only allow Executives to modify it, but everyone can read it
alter table public.system_settings enable row level security;

create policy "Anyone can read system settings" 
    on public.system_settings for select using (true);

create policy "Only Executives can update settings" 
    on public.system_settings for update using (
        exists (
            select 1 from public.users 
            where users.id = auth.uid() 
            and users.role in ('admin', 'ceo', 'cofounder', 'cto', 'coo', 'technical_admin', 'operations_admin', 'marketing_admin')
        )
    );

create policy "Only Executives can insert settings" 
    on public.system_settings for insert with check (
        exists (
            select 1 from public.users 
            where users.id = auth.uid() 
            and users.role in ('admin', 'ceo', 'cofounder', 'cto', 'coo', 'technical_admin', 'operations_admin', 'marketing_admin')
        )
    );
