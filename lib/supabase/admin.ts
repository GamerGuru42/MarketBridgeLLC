import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = rawUrl && rawUrl.length > 0 ? rawUrl : 'https://placeholder.supabase.co';
const supabaseServiceKey = rawKey && rawKey.length > 0 ? rawKey : 'placeholder_service_key';

/**
 * Supabase client using the Service Role Key.
 * Use this ONLY in server-side contexts for administrative tasks
 * that bypass Row Level Security (RLS).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
