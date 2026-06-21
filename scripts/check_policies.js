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
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY; // Need service role to query pg_catalog

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'orders';"
    });
    if (error) {
        // If RPC exec_sql doesn't exist, we can query it using a direct query or postgres view if we exposed one,
        // or we can query pg_policies via supabase.from().select() if it has API access (usually not).
        console.error("Error querying policies:", error);
        // Let's try standard select on pg_policies if exposed
        const { data: data2, error: error2 } = await supabase.from('pg_policies').select('*');
        console.log("pg_policies fallback:", data2, error2);
    } else {
        console.log("Active Policies on orders table:");
        console.log(data);
    }
}
run();
