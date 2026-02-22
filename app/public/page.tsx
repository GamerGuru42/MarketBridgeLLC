import { notFound } from 'next/navigation'
import React from 'react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import PublicMarketplaceClient from '@/components/PublicMarketplaceClient'

export default async function PublicIndexPage() {
    // Server-side guard: enforce env var + DB flag
    const envEnabled = process.env.ENABLE_PUBLIC_SECTION === 'true'
    if (!envEnabled) return notFound()

    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'public_section_enabled')
            .limit(1)

        if (error) {
            console.error('Public index DB check failed', error)
            return notFound()
        }

        const dbEnabled = data?.[0]?.value === true || data?.[0]?.value === 'true'
        if (!dbEnabled) return notFound()
    } catch (e) {
        console.error('Public index guard error', e)
        return notFound()
    }

    return <PublicMarketplaceClient />
}
