require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    const { data, error } = await supabase
        .from('users')
        .select('role');
    
    if (error) {
        console.error('Error fetching roles:', error);
        return;
    }
    
    const roles = [...new Set(data.map(u => u.role))];
    console.log('Distinct roles in DB:', roles);
}

checkRoles();
