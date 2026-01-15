# MarketBridge Testing Guide

## Pre-Deployment Testing Checklist

This guide will help you test all features before going live.

---

## 🔧 Setup Requirements

### 1. Supabase Configuration
- [ ] Database schema applied (`supabase-schema.sql`)
- [ ] Environment variables set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Google OAuth configured in Supabase
- [ ] Facebook OAuth configured (optional)
- [ ] Email confirmation disabled (for testing)

### 2. Local Testing
- [ ] `npm install` completed
- [ ] `.env.local` file configured
- [ ] Dev server running (`npm run dev`)

---

## 🧪 Test Scenarios

### Authentication Tests

#### Test 1: Google OAuth Signup
**Steps:**
1. Go to `/signup`
2. Click "Sign up with Google"
3. Select Google account
4. Should redirect to home page
5. Check header - should show user avatar/name

**Expected Result:**
- ✅ User created in `auth.users`
- ✅ Profile created in `public.users`
- ✅ Redirected to homepage
- ✅ Header shows logged-in state

**Verify in Supabase:**
```sql
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 1;
```

#### Test 2: Email/Password Signup
**Steps:**
1. Go to `/signup`
2. Fill in email and password
3. Click "Sign Up"
4. Should redirect to home page

**Expected Result:**
- ✅ User created in database
- ✅ Logged in automatically
- ✅ Header shows user info

#### Test 3: Login
**Steps:**
1. Log out
2. Go to `/login`
3. Enter credentials
4. Click "Login"

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected to homepage
- ✅ Session persists on refresh

---

### Dealer Tests

#### Test 4: Create Listing
**Steps:**
1. Sign up as dealer (or update role in database)
2. Go to `/dealer/listings/new`
3. Fill in all fields:
   - Title: "Test Product"
   - Description: "This is a test"
   - Price: 50000
   - Category: Electronics
   - Image URL: (use any valid image URL)
4. Click "Create Listing"

**Expected Result:**
- ✅ Listing created in database
- ✅ Redirected to `/dealer/listings`
- ✅ New listing appears in list

**Verify in Supabase:**
```sql
SELECT * FROM listings ORDER BY created_at DESC LIMIT 1;
```

#### Test 5: Edit Listing
**Steps:**
1. Go to `/dealer/listings`
2. Click "Edit" on a listing
3. Change title to "Updated Product"
4. Click "Save Changes"

**Expected Result:**
- ✅ Listing updated in database
- ✅ Changes reflected immediately

#### Test 6: Delete Listing
**Steps:**
1. Go to `/dealer/listings`
2. Click delete icon
3. Confirm deletion

**Expected Result:**
- ✅ Listing removed from database
- ✅ Removed from list immediately

---

### Customer Tests

#### Test 7: Browse Listings
**Steps:**
1. Go to `/listings`
2. Use search: "Test"
3. Filter by category: "Electronics"
4. Click on a listing

**Expected Result:**
- ✅ Search works
- ✅ Filters work
- ✅ Listing details page loads
- ✅ Images display correctly

#### Test 8: Contact Dealer
**Steps:**
1. On a listing page, click "Contact Dealer"
2. Should open chat

**Expected Result:**
- ✅ Chat created in database
- ✅ Redirected to `/chats/[id]`
- ✅ Listing info shows in chat header

**Verify in Supabase:**
```sql
SELECT * FROM chats ORDER BY created_at DESC LIMIT 1;
```

---

### Chat & Messaging Tests

#### Test 9: Send Messages
**Steps:**
1. In an open chat, type "Hello, is this available?"
2. Press Enter or click Send
3. Open another browser/incognito window
4. Log in as the dealer
5. Go to Messages

**Expected Result:**
- ✅ Message appears instantly
- ✅ Other user sees message in real-time
- ✅ Message saved in database

**Verify in Supabase:**
```sql
SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
```

#### Test 10: Initiate Escrow
**Steps:**
1. As customer, in chat click "Initiate Escrow"
2. Fill in:
   - Amount: 50000
   - Address: "123 Test St, Lagos"
   - Phone: "08012345678"
3. Click "Initiate Escrow"

**Expected Result:**
- ✅ Order created in database
- ✅ System message appears in chat
- ✅ Dialog closes

**Verify in Supabase:**
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

---

### Order Management Tests

#### Test 11: View Orders (Customer)
**Steps:**
1. As customer, go to `/orders`
2. Should see the order created in Test 10

**Expected Result:**
- ✅ Order displays with correct info
- ✅ Status shows "Pending"
- ✅ Escrow message visible

#### Test 12: Update Order Status (Dealer)
**Steps:**
1. Log in as dealer
2. Go to `/dealer/dashboard`
3. Find the order
4. Select "Mark as Shipped"

**Expected Result:**
- ✅ Order status updates to "confirmed"
- ✅ Customer receives notification in chat
- ✅ Dashboard stats update

#### Test 13: Confirm Delivery (Customer)
**Steps:**
1. Log in as customer
2. Go to `/orders`
3. Order should show "Shipped" status
4. Click "Confirm Delivery"
5. Confirm in dialog

**Expected Result:**
- ✅ Order status updates to "completed"
- ✅ Dealer receives notification in chat
- ✅ Payment release message appears

**Verify in Supabase:**
```sql
SELECT id, status, amount FROM orders WHERE status = 'completed';
```

---

### Real-Time Tests

#### Test 14: Real-Time Messages
**Steps:**
1. Open chat in two browsers (customer & dealer)
2. Send message from one
3. Should appear instantly in the other

**Expected Result:**
- ✅ No page refresh needed
- ✅ Message appears within 1 second

#### Test 15: Real-Time Order Updates
**Steps:**
1. Customer: Open `/orders` page
2. Dealer: Update order status
3. Customer page should update automatically

**Expected Result:**
- ✅ Status badge updates
- ✅ No refresh needed

---

## 🐛 Common Issues & Fixes

### Issue: "User not found" after login
**Fix:**
```sql
-- Check if trigger is working
SELECT * FROM auth.users;
SELECT * FROM public.users;

-- If user in auth.users but not public.users, trigger failed
-- Manually create profile:
INSERT INTO public.users (id, email, display_name, role)
VALUES (
  '[user-id-from-auth-users]',
  '[email]',
  '[name]',
  'customer'
);
```

### Issue: Messages not appearing
**Fix:**
1. Check browser console for errors
2. Verify Supabase URL in `.env.local`
3. Check RLS policies:
```sql
-- Should return rows
SELECT * FROM messages WHERE chat_id = '[chat-id]';
```

### Issue: Can't create listing
**Fix:**
1. Verify user role is 'dealer':
```sql
UPDATE users SET role = 'dealer' WHERE id = '[user-id]';
```

### Issue: Escrow button not showing
**Fix:**
1. Verify listing_id in chat:
```sql
SELECT * FROM chats WHERE id = '[chat-id]';
```
2. Ensure user role is 'customer'

---

## 📊 Database Verification Queries

### Check User Count
```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

### Check Listing Count
```sql
SELECT status, COUNT(*) FROM listings GROUP BY status;
```

### Check Order Flow
```sql
SELECT 
  o.id,
  o.status,
  o.amount,
  buyer.display_name as buyer,
  seller.display_name as seller
FROM orders o
JOIN users buyer ON o.buyer_id = buyer.id
JOIN users seller ON o.seller_id = seller.id
ORDER BY o.created_at DESC;
```

### Check Chat Activity
```sql
SELECT 
  c.id,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message
FROM chats c
LEFT JOIN messages m ON c.id = m.chat_id
GROUP BY c.id
ORDER BY last_message DESC;
```

---

## ✅ Pre-Launch Checklist

### Security
- [ ] RLS policies enabled on all tables
- [ ] Service role key not exposed in client
- [ ] Email confirmation enabled (production)
- [ ] Rate limiting configured (if needed)

### Performance
- [ ] Images optimized
- [ ] Database indexes created
- [ ] Unnecessary console.logs removed
- [ ] Error boundaries in place

### User Experience
- [ ] All forms have validation
- [ ] Loading states show correctly
- [ ] Error messages are user-friendly
- [ ] Mobile responsive design verified

### Business Logic
- [ ] Escrow flow works end-to-end
- [ ] Payments release correctly
- [ ] Notifications send properly
- [ ] Order statuses update correctly

### Documentation
- [ ] USER_GUIDE.md complete
- [ ] README.md updated
- [ ] Environment variables documented
- [ ] Deployment guide ready

---

## 🚀 Load Testing (Optional)

### Test with Multiple Users
1. Create 10 test accounts
2. Create 20 listings
3. Initiate 5 chats simultaneously
4. Send 50 messages rapidly
5. Create 10 orders

**Monitor:**
- Response times
- Database performance
- Real-time update speed
- Error rates

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Authentication: ✅ / ❌
Listings: ✅ / ❌
Chat: ✅ / ❌
Escrow: ✅ / ❌
Orders: ✅ / ❌
Real-time: ✅ / ❌

Issues Found:
1. _________________
2. _________________

Notes:
_________________
```

---

## 🎯 Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Real-time updates working
- ✅ Data persisting correctly
- ✅ UI responsive and smooth
- ✅ Escrow flow complete

**When all tests pass, you're ready to launch! 🚀**
