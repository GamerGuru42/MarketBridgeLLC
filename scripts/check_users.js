const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) envConfig[key.trim()] = values.join('=').trim();
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
    if (userError) {
        console.error("User fetch error:", userError);
    } else {
        console.log("Users schema keys from sample row:", Object.keys(users[0] || {}));
    }
}
run();
