import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getSiteSetting(key: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .limit(1)
            .single()

        if (error) return null
        return data?.value
    } catch (e) {
        console.error('getSiteSetting failed', e)
        return null
    }
}
