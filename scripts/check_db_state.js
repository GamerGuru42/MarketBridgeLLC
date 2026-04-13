const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser since we can't depend on dotenv
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        process.env[parts[0].trim()] = parts[1].trim();
      }
    });
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('--- DB AUDIT START ---');
  try {
    const { data: users, error } = await supabase.from('users').select('role').limit(5);
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('Sample Roles:', JSON.stringify(users));
    }
    
    const { data: plans, error: planError } = await supabase.from('users').select('subscription_plan').limit(5);
    if (planError) {
      console.error('Error fetching plans:', planError);
    } else {
      console.log('Sample Plans:', JSON.stringify(plans));
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
  console.log('--- DB AUDIT END ---');
}

run();
