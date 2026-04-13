import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('--- DB AUDIT START ---');
  const { data: users, error } = await supabase.from('users').select('role').limit(5);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample Roles:', users);
  }
  
  const { data: plans } = await supabase.from('users').select('subscription_plan').limit(5);
  console.log('Sample Plans:', plans);
  console.log('--- DB AUDIT END ---');
}

run();
