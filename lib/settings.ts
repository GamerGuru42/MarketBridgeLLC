import { createClient } from '@/lib/supabase/server';

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) return defaultValue;
    return data.value as T;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;
}

export async function isPublicSectionEnabled(): Promise<boolean> {
    return await getSetting('public_section_enabled', false);
}
