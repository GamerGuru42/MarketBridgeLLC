import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSiteSetting } from '@/lib/settings/server'

export async function GET(req: NextRequest) {
    try {
        const publicFlag = await getSiteSetting('public_section_enabled')
        // Quick DB connectivity check
        const { error } = await supabaseAdmin.from('users').select('id').limit(1)
        const dbOk = !error

        return new Response(JSON.stringify({ ok: true, dbOk, public_section_enabled: publicFlag === 'true' || publicFlag === true, version: process.env.npm_package_version || null }), { status: 200 })
    } catch (e) {
        console.error('Health check failed', e)
        return new Response(JSON.stringify({ ok: false }), { status: 500 })
    }
}
