import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient({})

  // expect a logged-in user (server-side)
  const { data: { user } = {} } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data, error } = await supabase.from('coins_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transactions: data || [] })
}
