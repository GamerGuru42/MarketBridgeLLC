import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const supabaseUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch![1].trim();
const supabaseKey = supabaseKeyMatch![1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('admin_channels').select('*');
    if (error) {
        console.error("Channels Error", error);
    } else {
        console.log("Channels Data", data);
    }
}
check();
