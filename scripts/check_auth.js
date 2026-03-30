const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) envConfig[key.trim()] = values.join('=').trim();
});

const supabaseAdmin = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
);

async function testGoTrue() {
    console.log('--- TESTING signInWithOtp DIRECTLY ---');
    const email = 'anothernewtest55@cosmopolitan.edu.ng';
    
    // Testing the exact payload sent by seller-onboard
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
        email: email,
        options: {
            data: {
                display_name: 'Test Name',
                full_name: 'Test Name', 
                university: 'Cosmopolitan University',
                phone_number: '08123456789',
                role: 'student_seller'
            },
            emailRedirectTo: 'http://localhost:3000/seller-setup/bank'
        }
    });

    if (error) {
        console.error('GoTrue FAILED with Error:');
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('GoTrue SUCCEEDED!');
        console.log(data);
    }
}

testGoTrue();
