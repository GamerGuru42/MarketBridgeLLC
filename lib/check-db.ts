
import { createClient } from '@/lib/supabase/client';

export async function checkTables() {
    const supabase = createClient();

    const { data: users } = await supabase.from('users').select('*').limit(1);
    const { data: orders } = await supabase.from('orders').select('*').limit(1);
    const { data: listings } = await supabase.from('listings').select('*').limit(1);
    const { error: proposalsError } = await supabase.from('proposals').select('*').limit(1);
    const { error: disputesError } = await supabase.from('disputes').select('*').limit(1);

    return {
        users: users?.[0],
        orders: orders?.[0],
        listings: listings?.[0],
        hasProposalsTable: !proposalsError,
        hasDisputesTable: !disputesError
    };
}
