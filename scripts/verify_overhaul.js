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
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function runTests() {
    console.log('=== STARTING INTEGRATION TESTS FOR PHASE 1 OVERHAUL ===');
    const uniqueId = Math.floor(Math.random() * 1000000);
    const buyerEmail = `buyer_${uniqueId}@gmail.com`;
    const password = 'TestPassword123!';
    
    let buyerClient, sellerClient;
    let buyerUser, sellerUser;
    let listingId, orderId;

    try {
        // -------------------------------------------------------------
        // TEST 1: Create Buyer Account (any email)
        // -------------------------------------------------------------
        console.log(`\n--- TEST 1: Registering Buyer: ${buyerEmail} ---`);
        const { data: bSignup, error: bSignError } = await supabase.auth.signUp({
            email: buyerEmail,
            password
        });
        if (bSignError) throw bSignError;
        console.log('Buyer signed up successfully. ID:', bSignup.user.id);

        // Sign in to get session
        const { data: bSignIn, error: bSignInError } = await supabase.auth.signInWithPassword({
            email: buyerEmail,
            password
        });
        if (bSignInError) throw bSignInError;
        
        buyerClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${bSignIn.session.access_token}` } }
        });

        // Verify User Profile
        const { data: bProfile, error: bProfError } = await buyerClient.from('users').select('*').eq('id', bSignup.user.id).single();
        if (bProfError) throw bProfError;
        console.log('Buyer profile details:', {
            role: bProfile.role,
            is_student: bProfile.is_student,
            referral_code: bProfile.referral_code
        });
        if (bProfile.role !== 'buyer') throw new Error('Expected role to be buyer');

        // Verify Wallet Created
        const { data: bWallet, error: bWalletError } = await buyerClient.from('wallets').select('*').single();
        if (bWalletError) throw bWalletError;
        console.log('Buyer wallet balance (in kobo):', bWallet.balance);
        if (bWallet.balance !== 0) throw new Error('Expected new wallet balance to be 0');

        // Verify Market Coins Created
        const { data: bCoins, error: bCoinsError } = await buyerClient.from('market_coins').select('*').single();
        if (bCoinsError) throw bCoinsError;
        console.log('Buyer Market Coins balance:', bCoins.balance);
        if (bCoins.balance !== 0) throw new Error('Expected new MC balance to be 0');
        console.log('✅ TEST 1 PASSED: Buyer created with wallet + MC + referral code.');

        // -------------------------------------------------------------
        // TEST 2: Create Seller Account (.edu.ng)
        // -------------------------------------------------------------
        const sellerEmail = `seller_${uniqueId}@bazeuniversity.edu.ng`;
        console.log(`\n--- TEST 2: Registering Seller: ${sellerEmail} ---`);
        const { data: sSignup, error: sSignError } = await supabase.auth.signUp({
            email: sellerEmail,
            password
        });
        if (sSignError) throw sSignError;
        console.log('Seller signed up successfully. ID:', sSignup.user.id);

        const { data: sSignIn, error: sSignInError } = await supabase.auth.signInWithPassword({
            email: sellerEmail,
            password
        });
        if (sSignInError) throw sSignInError;

        sellerClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${sSignIn.session.access_token}` } }
        });

        // Verify Auto-verification trigger (is_verified=true, is_student=true, role='seller', university='Baze University')
        const { data: sProfile, error: sProfError } = await sellerClient.from('users').select('*').eq('id', sSignup.user.id).single();
        if (sProfError) throw sProfError;
        console.log('Seller profile details:', {
            role: sProfile.role,
            is_verified: sProfile.is_verified,
            is_student: sProfile.is_student,
            university: sProfile.university,
            campus: sProfile.campus
        });
        if (sProfile.role !== 'seller') throw new Error('Expected role to be seller');
        if (!sProfile.is_verified) throw new Error('Expected is_verified to be true');
        if (!sProfile.is_student) throw new Error('Expected is_student to be true');
        if (sProfile.university !== 'Baze University') throw new Error('Expected university to be Baze University');
        console.log('✅ TEST 2 PASSED: Seller auto-verified and assigned role=seller based on domain.');

        // -------------------------------------------------------------
        // TEST 3: Create Listing
        // -------------------------------------------------------------
        console.log('\n--- TEST 3: Creating Listing (No car fields) ---');
        const { data: listing, error: listError } = await sellerClient.from('listings').insert({
            seller_id: sSignup.user.id,
            title: `Baze Campus Notebook ${uniqueId}`,
            description: 'Brand new academic notepad for Baze students.',
            price: 2000.00, // ₦2,000 NGN
            category: 'Textbooks & Academic Materials',
            images: ['https://placeholder.com/notebook.png'],
            listing_condition: 'new',
            delivery_type: 'campus_delivery',
            delivery_fee: 35000, // ₦350 in kobo
            campus: 'Main Campus'
        }).select().single();
        
        if (listError) throw listError;
        listingId = listing.id;
        console.log('Listing created successfully. ID:', listing.id, 'Title:', listing.title);
        console.log('✅ TEST 3 PASSED: Listing created successfully without legacy car fields.');

        // -------------------------------------------------------------
        // TEST 4: Place Order
        // -------------------------------------------------------------
        console.log('\n--- TEST 4: Placing Order ---');
        const { data: order, error: orderError } = await buyerClient.from('orders').insert({
            buyer_id: bSignup.user.id,
            seller_id: sSignup.user.id,
            listing_id: listingId,
            status: 'pending',
            amount: 2000.00,
            service_fee: 100.00,
            delivery_fee: 35000,
            total_amount: 1000000, // ₦10,000 in kobo (to trigger the 50 MC award limit which checks floor(total_amount / 1000000) * 50)
            delivery_address: { campus: 'Main Campus', hostel: 'Block A', room: '102' },
            delivery_type: 'campus_delivery',
            quantity: 1,
            unit_price: 1000000
        }).select().single();

        if (orderError) throw orderError;
        orderId = order.id;
        console.log('Order created successfully. ID:', orderId, 'Status:', order.status);
        console.log('✅ TEST 4 PASSED: Order created successfully with delivery tracking schemas.');

        // -------------------------------------------------------------
        // TEST 5: Mark Order Delivered → Verify MC Awarded
        // -------------------------------------------------------------
        console.log('\n--- TEST 5: Updating Order to Delivered & Verifying MC ---');
        const { data: updatedOrder, error: updateError } = await sellerClient.from('orders').update({
            status: 'delivered'
        }).eq('id', orderId).select().single();
        if (updateError) throw updateError;
        console.log('Order status updated by seller to:', updatedOrder.status);

        // Fetch Buyer Market Coins again to verify reward
        const { data: bCoinsAfter, error: bCoinsAfterError } = await buyerClient.from('market_coins').select('*').single();
        if (bCoinsAfterError) throw bCoinsAfterError;
        console.log('Buyer MC Balance after delivery:', bCoinsAfter.balance);
        if (bCoinsAfter.balance !== 50) {
            throw new Error(`Expected buyer to receive 50 MC reward for 1,000,000 kobo (₦10,000) transaction, but got: ${bCoinsAfter.balance}`);
        }
        console.log('✅ TEST 5 PASSED: Buyer awarded 50 MC successfully on delivery completion.');

        console.log('\n=== ALL PHASE 1 INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
    } catch (err) {
        console.error('\n❌ INTEGRATION TEST FAILED:', err);
        process.exit(1);
    }
}

runTests();
