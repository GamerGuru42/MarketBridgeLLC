
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDemo() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('system_settings')
        .upsert({
            id: 'global',
            is_demo_mode: true,
            demo_start_date: today,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Failed to update system settings:', error);
    } else {
        console.log('System settings updated: Demo Mode ACTIVE starting', today);
    }
}

initDemo();
