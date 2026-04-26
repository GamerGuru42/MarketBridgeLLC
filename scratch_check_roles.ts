import { supabaseAdmin } from './lib/supabase/admin.ts';

async function checkRoles() {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('role');
    
    if (error) {
        console.error('Error fetching roles:', error);
        return;
    }
    
    const roles = [...new Set(data.map((u: any) => u.role))];
    console.log('Distinct roles in DB:', roles);
}

checkRoles();
